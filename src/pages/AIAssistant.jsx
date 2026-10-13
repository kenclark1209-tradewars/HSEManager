import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Settings2, Paperclip, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useQueryClient } from '@tanstack/react-query';
import { HSE_EXPERT_SYSTEM_PROMPT, ACTION_SCHEMA, SOP_SCHEMA, INCIDENT_ANALYSIS_SCHEMA, COMPLIANCE_AUDIT_SCHEMA, REMINDER_SCHEMA } from '@/lib/hsePrompts';
import { getAIConfig, getProviderInfo } from '@/lib/aiConfig';
import AIFunctionBar, { FUNCTIONS } from '@/components/ai/AIFunctionBar';
import AIConfigPanel from '@/components/ai/AIConfigPanel';
import { format, addDays } from 'date-fns';

// ─── Intent→Schema map ────────────────────────────────────────────
const INTENT_SCHEMAS = {
  create_action: {
    type: 'object',
    properties: {
      actions: { type: 'array', items: ACTION_SCHEMA },
      message: { type: 'string' }
    },
    required: ['message']
  },
  analyze_incident: {
    type: 'object',
    properties: { ...INCIDENT_ANALYSIS_SCHEMA.properties, message: { type: 'string' } },
    required: ['message']
  },
  write_sop: {
    type: 'object',
    properties: { sop: SOP_SCHEMA, message: { type: 'string' } },
    required: ['message']
  },
  set_reminder: {
    type: 'object',
    properties: { ...REMINDER_SCHEMA.properties, message: { type: 'string' } },
    required: ['message']
  },
  audit_compliance: {
    type: 'object',
    properties: { ...COMPLIANCE_AUDIT_SCHEMA.properties, message: { type: 'string' } },
    required: ['message']
  },
  extract_document: {
    type: 'object',
    properties: {
      extracted_data: { type: 'object' },
      form_fields: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, value: { type: 'string' }, entity: { type: 'string' } } } },
      message: { type: 'string' }
    },
    required: ['message']
  },
  general_answer: {
    type: 'object',
    properties: { message: { type: 'string' }, citations: { type: 'array', items: { type: 'string' } } },
    required: ['message']
  }
};

// ─── AI Invoke ─────────────────────────────────────────────────────
async function invokeAI({ prompt, schema, fileUrls = [] }) {
  const cfg = getAIConfig();
  const params = {
    prompt,
    response_json_schema: schema,
  };
  if (cfg.provider === 'base44_pro') {
    params.model = 'claude_sonnet_4_6';
  }
  if (fileUrls.length > 0) params.file_urls = fileUrls;
  return base44.integrations.Core.InvokeLLM(params);
}

// ─── Execute intents ───────────────────────────────────────────────
async function executeIntent(intent, response, qc) {
  const today = new Date();

  if (intent === 'create_action') {
    const actions = response.actions || [];
    const created = [];
    for (const a of actions) {
      if (!a.title) a.title = `Action ${format(today, 'dd/MM/yyyy')}`;
      await base44.entities.Action.create({
        title: a.title,
        description: a.description || '',
        type: a.type || 'corrective',
        priority: a.priority || 'medium',
        status: 'open',
        assigned_to: a.assigned_to || '',
        due_date: a.due_date || format(addDays(today, 7), 'yyyy-MM-dd'),
      });
      created.push(a.title);
    }
    qc.invalidateQueries({ queryKey: ['actions'] });
    return `✅ Đã tạo **${created.length} hành động**:\n${created.map(t => `- ${t}`).join('\n')}`;
  }

  if (intent === 'analyze_incident') {
    return null; // Analysis is display-only, returned in message
  }

  if (intent === 'write_sop') {
    const sop = response.sop;
    if (sop?.title && sop?.content) {
      await base44.entities.SOP.create({
        title: sop.title,
        description: sop.description || '',
        content: sop.content,
        category: sop.category || 'safety',
        version: sop.version || '1.0',
        status: 'draft',
      });
      qc.invalidateQueries({ queryKey: ['sops'] });
      return `✅ Đã tạo SOP: **${sop.title}** (trạng thái: Bản nháp)\n\n> Vào menu **Quy trình (SOP)** để xem xét và phê duyệt.`;
    }
    return null;
  }

  if (intent === 'set_reminder') {
    const reminders = response.reminders || [];
    for (const r of reminders) {
      if (!r.title) continue;
      await base44.entities.Action.create({
        title: `[NHẮC VIỆC] ${r.title}`,
        description: r.description || '',
        type: r.type || 'preventive',
        priority: r.priority || 'medium',
        status: 'open',
        assigned_to: r.assigned_to || '',
        due_date: r.due_date || format(addDays(today, 30), 'yyyy-MM-dd'),
      });
    }
    qc.invalidateQueries({ queryKey: ['actions'] });
    return reminders.length > 0 ? `🔔 Đã tạo **${reminders.length} nhắc nhở** vào hệ thống Actions.` : null;
  }

  if (intent === 'audit_compliance') {
    const items = response.items || [];
    let created = 0;
    for (const item of items) {
      if (!item.title) continue;
      await base44.entities.Compliance.create({
        title: item.title,
        regulation_code: item.regulation_code || '',
        requirement: item.requirement || '',
        compliance_status: item.compliance_status || 'partial',
        gap_description: item.gap_description || '',
        action_plan: item.action_plan || '',
        deadline: item.deadline || '',
        responsible_person: item.responsible_person || '',
      });
      created++;
    }
    qc.invalidateQueries({ queryKey: ['compliance'] });
    return created > 0 ? `🛡️ Đã lưu **${created} mục tuân thủ** vào hệ thống Compliance.` : null;
  }

  return null;
}

// ─── Message Bubble ────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'items-end flex flex-col' : ''}`}>
        {msg.fn && !isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="outline" className="text-xs">{FUNCTIONS.find(f => f.id === msg.fn)?.label || msg.fn}</Badge>
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2.5 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-background [&_code]:px-1 [&_code]:rounded [&_pre]:bg-background [&_pre]:p-3 [&_pre]:rounded-lg [&_table]:text-xs [&_th]:font-semibold [&_td]:py-1">
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {msg.citations?.length > 0 && (
          <div className="mt-1 ml-1">
            <button onClick={() => setCollapsed(c => !c)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              {msg.citations.length} căn cứ pháp lý
            </button>
            {!collapsed && (
              <div className="flex flex-wrap gap-1 mt-1">
                {msg.citations.map((c, i) => <Badge key={i} variant="outline" className="text-xs font-mono">{c}</Badge>)}
              </div>
            )}
          </div>
        )}
        {msg.actionResult && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{msg.actionResult}</span>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFunction, setActiveFunction] = useState('general_answer');
  const [showConfig, setShowConfig] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const qc = useQueryClient();
  const aiConfig = getAIConfig();
  const providerInfo = getProviderInfo(aiConfig.provider);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleFunctionSelect = (fnId) => {
    setActiveFunction(fnId);
    const fn = FUNCTIONS.find(f => f.id === fnId);
    if (fn?.prompt && !input) setInput(fn.prompt);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFile({ name: file.name, url: file_url });
    setUploadingFile(false);
    if (!input) setInput('Đọc tài liệu này và trích xuất thông tin để điền vào hệ thống HSE:');
    setActiveFunction('extract_document');
  };

  const handleSend = async () => {
    if ((!input.trim() && !uploadedFile) || loading) return;
    const userMsg = input.trim();
    const fileUrls = uploadedFile ? [uploadedFile.url] : [];
    const fn = activeFunction;

    setInput('');
    setUploadedFile(null);
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMsg + (uploadedFile ? `\n📎 ${uploadedFile.name}` : ''),
      fn
    }]);
    setLoading(true);

    try {
      const schema = INTENT_SCHEMAS[fn] || INTENT_SCHEMAS.general_answer;
      const fnLabel = FUNCTIONS.find(f => f.id === fn)?.label || fn;

      const systemCtx = `${HSE_EXPERT_SYSTEM_PROMPT}

CHỨC NĂNG HIỆN TẠI: ${fnLabel}
${fn === 'analyze_incident' ? 'Hãy phân tích theo phương pháp 5 Whys + phân loại nguyên nhân kỹ thuật/con người/hệ thống. Đề xuất hành động SMART cụ thể.' : ''}
${fn === 'write_sop' ? 'Viết SOP theo format chuẩn ISO: Mục đích, Phạm vi, Định nghĩa, Tài liệu tham chiếu, Trách nhiệm, Quy trình từng bước, Kiểm soát, Hồ sơ.' : ''}
${fn === 'audit_compliance' ? 'Kiểm tra dựa trên Luật 84/2015/QH13, Nghị định 39/2016, Thông tư 07/2016 và ISO 45001:2018. Đánh giá từng điều khoản.' : ''}
${fn === 'set_reminder' ? 'Lập danh sách nhắc nhở theo chu kỳ pháp định VN: kiểm định 12 tháng, huấn luyện 6 tháng-2 năm tùy nhóm, quan trắc MTLĐ 6 tháng/lần.' : ''}
${fn === 'extract_document' ? 'Đọc tài liệu đính kèm. Trích xuất thông tin có cấu trúc và ánh xạ vào các trường dữ liệu của hệ thống (Incident, Risk, Action, Compliance).' : ''}`;

      const response = await invokeAI({
        prompt: `${systemCtx}\n\nYêu cầu của người dùng: ${userMsg}`,
        schema,
        fileUrls,
      });

      // Execute side effects
      let actionResult = null;
      try {
        actionResult = await executeIntent(fn, response, qc);
      } catch (e) {
        console.error('executeIntent error', e);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message || 'Đã xử lý xong.',
        citations: response.citations || [],
        fn,
        actionResult,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Lỗi:** ${err.message || 'Vui lòng thử lại.'}\n\nKiểm tra cấu hình AI hoặc kết nối mạng.`,
        fn,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    { fn: 'analyze_incident', text: 'Phân tích: Công nhân bị điện giật tại khu vực máy nén khí' },
    { fn: 'write_sop', text: 'Viết SOP làm việc trên cao (trên 2m) theo Thông tư 39/2016' },
    { fn: 'audit_compliance', text: 'Audit tuân thủ Luật ATVSLĐ cho nhà máy sản xuất 50 NLĐ' },
    { fn: 'set_reminder', text: 'Lập lịch kiểm định, huấn luyện, quan trắc cho năm 2026' },
    { fn: 'create_action', text: 'Tạo CAPA cho phát hiện dầu rò rỉ gần nguồn nhiệt khu A' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">HSE AI Assistant</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-muted-foreground">{providerInfo.label} — ISO 45001 Expert</p>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowConfig(c => !c)} className="gap-2 text-xs">
          <Settings2 className="w-3.5 h-3.5" />
          Cấu hình AI
        </Button>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="mb-3">
          <AIConfigPanel onClose={() => setShowConfig(false)} />
        </div>
      )}

      {/* Function Bar */}
      <AIFunctionBar activeFunction={activeFunction} onSelect={handleFunctionSelect} />

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm space-y-4">
              <Bot className="w-14 h-14 opacity-15" />
              <div className="text-center">
                <p className="font-medium text-foreground">HSE Manager AI</p>
                <p className="text-xs">Chuyên gia An toàn lao động Việt Nam — ISO 45001</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map((q, i) => (
                  <button key={i} onClick={() => { setActiveFunction(q.fn); setInput(q.text); }}
                    className="text-left text-xs px-3 py-2.5 bg-muted hover:bg-accent rounded-xl transition-colors border border-transparent hover:border-primary/20">
                    <span className="font-medium text-primary">[{FUNCTIONS.find(f => f.id === q.fn)?.label}]</span>{' '}
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Đang phân tích chuyên sâu...</span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Input area */}
        <div className="p-4 border-t space-y-2">
          {uploadedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-xs">
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              <span className="flex-1 truncate">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)}><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg" onChange={handleFileUpload} />
            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} title="Đính kèm tài liệu">
              {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`[${FUNCTIONS.find(f => f.id === activeFunction)?.label}] Nhập yêu cầu...`}
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || (!input.trim() && !uploadedFile)} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}