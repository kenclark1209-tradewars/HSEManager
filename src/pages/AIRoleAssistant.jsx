import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { getUserRole, getRoleLabel, getRoleColor } from '@/lib/roleUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Loader2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format, addDays } from 'date-fns';

// Role-based system prompts
const ROLE_PROMPTS = {
  manager: `Bạn là AI HSE Manager assistant cho người quản lý HSE cấp cao.
Nhiệm vụ:
1. Tạo kế hoạch HSE (PDCA) toàn diện cho tổ chức
2. Phân tích rủi ro từ dữ liệu hệ thống
3. Đọc pháp luật ATVSLĐ VN → tạo danh sách Action cần làm ngay
4. Đề xuất cải tiến hệ thống HSE
5. Tạo báo cáo KPI và xu hướng
Khi tạo kế hoạch/action: luôn ghi rõ who/what/when/how theo SMART.
Ngôn ngữ: Tiếng Việt, chuyên nghiệp.`,

  supervisor: `Bạn là AI HSE Supervisor assistant cho giám sát viên HSE.
Nhiệm vụ:
1. Tạo checklist kiểm tra an toàn cho công việc cụ thể
2. Nhắc nhở deadline và công việc sắp hết hạn
3. Theo dõi tiến độ thực hiện của nhóm
4. Hỗ trợ giao việc và theo dõi CAPA
5. Đề xuất kế hoạch tuần/tháng
Khi tạo checklist: chi tiết, thực tế, đánh số từng bước.
Ngôn ngữ: Tiếng Việt, rõ ràng.`,

  employee: `Bạn là AI HSE Employee assistant cho nhân viên/công nhân.
Nhiệm vụ:
1. Hướng dẫn thực hiện SOP theo từng bước
2. Giải thích quy trình an toàn bằng ngôn ngữ đơn giản
3. Trả lời câu hỏi về nguy hiểm tại nơi làm việc
4. Hướng dẫn cách upload bằng chứng/evidence
5. Nhắc quyền và nghĩa vụ của NLĐ
Dùng ngôn ngữ đơn giản, dễ hiểu, có ví dụ thực tế.
Ngôn ngữ: Tiếng Việt thông thường.`,
};

const ROLE_QUICK_PROMPTS = {
  manager: [
    { text: 'Tạo kế hoạch HSE năm 2026 cho nhà máy sản xuất 100 người', action: 'create_plan' },
    { text: 'Phân tích rủi ro và tạo action từ dữ liệu sự cố hiện tại', action: 'analyze_risk' },
    { text: 'Đọc Luật ATVSLĐ 84/2015 và liệt kê 10 nghĩa vụ quan trọng nhất', action: 'read_law' },
    { text: 'Tạo báo cáo KPI HSE tháng 3/2026', action: 'kpi_report' },
  ],
  supervisor: [
    { text: 'Tạo checklist kiểm tra an toàn trước ca làm việc', action: 'create_checklist' },
    { text: 'Nhắc các action sắp đến hạn trong tuần này', action: 'remind' },
    { text: 'Tạo kế hoạch tuần cho team HSE 5 người', action: 'weekly_plan' },
    { text: 'Checklist kiểm tra PCCC hàng tháng', action: 'fire_checklist' },
  ],
  employee: [
    { text: 'Hướng dẫn làm việc trên cao an toàn theo từng bước', action: 'sop_guide' },
    { text: 'Khi gặp sự cố, tôi phải làm gì?', action: 'incident_guide' },
    { text: 'Tôi có quyền từ chối làm việc nguy hiểm không?', action: 'rights' },
    { text: 'Hướng dẫn sử dụng thiết bị bảo hộ đúng cách', action: 'ppe_guide' },
  ],
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string' },
          due_date: { type: 'string' },
          type: { type: 'string' }
        }
      }
    },
    checklist_items: { type: 'array', items: { type: 'string' } },
    sop_content: { type: 'string' },
    citations: { type: 'array', items: { type: 'string' } },
    db_operations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          entity: { type: 'string' },
          data: { type: 'object' }
        }
      }
    }
  },
  required: ['message']
};

async function executeDBOps(ops, qc) {
  if (!ops || !ops.length) return [];
  const results = [];
  for (const op of ops) {
    if (op.type === 'createAction' || (op.type === 'create' && op.entity === 'Action')) {
      const created = await base44.entities.Action.create({
        title: op.data?.title || 'AI Action',
        description: op.data?.description || '',
        type: op.data?.type || 'corrective',
        priority: op.data?.priority || 'medium',
        status: 'open',
        due_date: op.data?.due_date || format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      });
      console.log('[ACTION CREATED]', created.title, created);
      results.push(`✅ Action: ${created.title}`);
      qc.invalidateQueries({ queryKey: ['actions'] });
    }
    if (op.type === 'createChecklist' || (op.type === 'create' && op.entity === 'Checklist')) {
      const created = await base44.entities.Checklist.create({
        title: op.data?.title || 'AI Checklist',
        items: (op.data?.items || []).map((t, i) => ({ id: `item_${i}`, text: t, checked: false })),
        status: 'active',
        ai_generated: true,
        completion_percent: 0,
      });
      console.log('[CHECKLIST CREATED]', created.title, created);
      results.push(`📋 Checklist: ${created.title}`);
      qc.invalidateQueries({ queryKey: ['checklists'] });
    }
    if (op.type === 'createSOP' || (op.type === 'create' && op.entity === 'SOP')) {
      const created = await base44.entities.SOP.create({
        title: op.data?.title || 'AI SOP',
        content: op.data?.content || '',
        category: op.data?.category || 'safety',
        version: '1.0',
        status: 'draft',
      });
      console.log('[SOP CREATED]', created.title, created);
      results.push(`📄 SOP: ${created.title}`);
      qc.invalidateQueries({ queryKey: ['sops'] });
    }
    if (op.type === 'create' && op.entity === 'Regulation') {
      const created = await base44.entities.Regulation.create({
        title: op.data?.title || 'AI Regulation',
        code: op.data?.code || 'AUTO',
        description: op.data?.description || '',
        category: op.data?.category || 'local_law',
        status: 'active',
      });
      console.log('[REGULATION SAVED]', created.title, created);
      results.push(`⚖️ Pháp luật: ${created.title}`);
      qc.invalidateQueries({ queryKey: ['regulations'] });
    }
  }
  return results;
}

export default function AIRoleAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const qc = useQueryClient();
  const role = getUserRole();
  const quickPrompts = ROLE_QUICK_PROMPTS[role] || ROLE_QUICK_PROMPTS.employee;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text = null) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = ROLE_PROMPTS[role] || ROLE_PROMPTS.employee;
      const prompt = `${systemPrompt}

Lịch sử chat:
${messages.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n')}

User: ${userMsg}

Nếu cần tạo Action/Checklist/SOP vào DB, hãy điền vào mảng "db_operations" với format:
[{"type": "createAction", "data": {"title": "...", "description": "...", "priority": "high", "due_date": "2026-04-15"}}]
Hoặc: [{"type": "createChecklist", "data": {"title": "...", "items": ["mục 1", "mục 2"]}}]
Hoặc: [{"type": "createSOP", "data": {"title": "...", "content": "...", "category": "safety"}}]
Hoặc: [{"type": "create", "entity": "Regulation", "data": {"title": "...", "code": "...", "description": "..."}}]

Trả lời đầy đủ trong trường "message".`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: RESPONSE_SCHEMA,
      });

      console.log('[AI RESPONSE]', role, res);

      let dbResults = [];
      if (res.db_operations?.length > 0) {
        dbResults = await executeDBOps(res.db_operations, qc);
      }

      // Also handle direct action array
      if (res.actions?.length > 0) {
        const ops = res.actions.map(a => ({ type: 'createAction', data: a }));
        const more = await executeDBOps(ops, qc);
        dbResults = [...dbResults, ...more];
      }

      // Handle checklist_items
      if (res.checklist_items?.length > 0 && res.sop_content === undefined) {
        const ops = [{ type: 'createChecklist', data: { title: userMsg.slice(0, 60), items: res.checklist_items } }];
        const more = await executeDBOps(ops, qc);
        dbResults = [...dbResults, ...more];
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.message || 'Đã xử lý.',
        citations: res.citations || [],
        dbResults,
      }]);
    } catch (err) {
      console.error('[AI ERROR]', err);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Lỗi: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI HSE — {getRoleLabel(role)}</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-muted-foreground">ISO 45001 · {role === 'manager' ? 'Chế độ Quản lý' : role === 'supervisor' ? 'Chế độ Giám sát' : 'Chế độ Nhân viên'}</p>
              <Badge className={`text-xs ${getRoleColor(role)}`}>{getRoleLabel(role)}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Bot className="w-14 h-14 opacity-15" />
              <div className="text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">AI {getRoleLabel(role)} — Sẵn sàng hỗ trợ</p>
                <p className="text-xs mt-1">AI được tùy chỉnh theo vai trò và có thể ghi dữ liệu vào hệ thống</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-lg">
                {quickPrompts.map((q, i) => (
                  <button key={i} onClick={() => handleSend(q.text)}
                    className="text-left text-xs px-3 py-2.5 bg-muted hover:bg-accent rounded-xl transition-colors border border-transparent hover:border-primary/20 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary shrink-0" />
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] space-y-1.5 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.dbResults?.length > 0 && (
                  <div className="space-y-0.5">
                    {msg.dbResults.map((r, idx) => (
                      <div key={idx} className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">{r}</div>
                    ))}
                  </div>
                )}
                {msg.citations?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.citations.map((c, idx) => <Badge key={idx} variant="outline" className="text-xs font-mono">{c}</Badge>)}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Đang xử lý...</span>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-4 border-t">
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Hỏi AI ${getRoleLabel(role)}...`}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}