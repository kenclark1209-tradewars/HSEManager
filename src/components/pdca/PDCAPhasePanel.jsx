import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Bot, Loader2, Scale, Shield, Zap, RefreshCw, FileText, ListChecks, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PDCARecordCard from './PDCARecordCard';
import PDCARecordForm from './PDCARecordForm';

function PlanHelper({ sops, checklists, risks, regulations }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
      <InfoCard icon={FileText} label="SOP có sẵn" count={sops.length} items={sops.slice(0, 3).map(s => s.sop_code || s.title)} color="indigo" path="/library/sops" />
      <InfoCard icon={ListChecks} label="Checklist có sẵn" count={checklists.length} items={checklists.slice(0, 3).map(c => c.checklist_code)} color="emerald" path="/library/checklists" />
      <InfoCard icon={Shield} label="Rủi ro cao" count={risks.filter(r => ['high', 'extreme'].includes(r.risk_level)).length}
        items={risks.filter(r => ['high', 'extreme'].includes(r.risk_level)).slice(0, 3).map(r => r.title)} color="red" path="/risks" />
      <InfoCard icon={Scale} label="Quy định pháp lý" count={regulations.length}
        items={regulations.slice(0, 3).map(r => r.code)} color="blue" path="/legal/registry" />
    </div>
  );
}

function DoHelper({ sops, checklists }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <InfoCard icon={FileText} label="SOP cần triển khai" count={sops.filter(s => s.status !== 'APPROVED').length}
        items={sops.filter(s => s.status !== 'APPROVED').slice(0, 3).map(s => `${s.sop_code} — ${s.status}`)} color="indigo" path="/library/sops" />
      <InfoCard icon={ListChecks} label="Checklist đang active" count={checklists.filter(c => c.status === 'ACTIVE').length}
        items={checklists.filter(c => c.status === 'ACTIVE').slice(0, 3).map(c => c.name_vi || c.name)} color="emerald" path="/library/checklists" />
    </div>
  );
}

function CheckHelper({ actions }) {
  const open = actions.filter(a => a.status === 'open').length;
  const done = actions.filter(a => a.status === 'closed').length;
  const total = actions.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
      <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-amber-900">CAPA: {done}/{total} đã đóng ({pct}%)</p>
        <div className="h-1.5 bg-amber-100 rounded-full mt-1 overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link to="/actions">
        <Button size="sm" variant="outline" className="h-6 text-xs border-amber-300">
          {open} đang mở →
        </Button>
      </Link>
    </div>
  );
}

function ActHelper() {
  return (
    <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs">
      <RefreshCw className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-purple-900">
        <p className="font-semibold mb-0.5">Giai đoạn ACT — Cải tiến & Chuẩn hóa</p>
        <p className="text-purple-700">Đánh giá kết quả Check, xác định bài học kinh nghiệm, chuẩn hóa quy trình, và quay lại PLAN để bắt đầu vòng PDCA mới.</p>
      </div>
      <Link to="/ai">
        <Button size="sm" variant="outline" className="h-6 text-xs border-purple-300 shrink-0">
          <Bot className="w-3 h-3 mr-1" />AI tư vấn
        </Button>
      </Link>
    </div>
  );
}

function InfoCard({ icon: CardIcon, label, count, items, color, path }) {
  const colorMap = {
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-800',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    red: 'bg-red-50 border-red-100 text-red-800',
    blue: 'bg-blue-50 border-blue-100 text-blue-800',
  };
  const iconColor = { indigo: 'text-indigo-600', emerald: 'text-emerald-600', red: 'text-red-600', blue: 'text-blue-600' };

  return (
    <div className={`rounded-lg border p-2.5 ${colorMap[color]}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <CardIcon className={`w-3.5 h-3.5 ${iconColor[color]}`} />
        <span className="font-semibold text-xs">{label}</span>
        <Badge variant="outline" className="ml-auto text-xs py-0 h-4">{count}</Badge>
      </div>
      {items.map((item, i) => (
        <p key={i} className="text-xs truncate opacity-80">• {item}</p>
      ))}
      {items.length === 0 && <p className="text-xs opacity-50">Chưa có dữ liệu</p>}
      <Link to={path} className="block text-xs mt-1.5 underline opacity-70 hover:opacity-100">Xem tất cả →</Link>
    </div>
  );
}

export default function PDCAPhasePanel({ phase, categoryId, categoryName }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const qc = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['pdca-records', categoryId, phase.key],
    queryFn: () => categoryId
      ? base44.entities.PDCARecord.filter({ hse_category_id: categoryId, phase: phase.key })
      : base44.entities.PDCARecord.filter({ phase: phase.key }),
  });

  const { data: sops = [] } = useQuery({ queryKey: ['sops'], queryFn: () => base44.entities.SOP.list('-updated_date', 100) });
  const { data: checklists = [] } = useQuery({ queryKey: ['hse-checklists'], queryFn: () => base44.entities.HSEChecklist.list('-created_date', 100) });
  const { data: regulations = [] } = useQuery({ queryKey: ['regulations'], queryFn: () => base44.entities.Regulation.list('-created_date', 50) });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list('-created_date', 100) });
  const { data: actions = [] } = useQuery({ queryKey: ['actions'], queryFn: () => base44.entities.Action.list('-due_date', 100) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pdca-records'] });
    qc.invalidateQueries({ queryKey: ['pdca-completion'] });
  };

  const createMut = useMutation({
    mutationFn: d => base44.entities.PDCARecord.create(d),
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); toast.success('Đã tạo mục PDCA'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PDCARecord.update(id, data),
    onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); toast.success('Đã cập nhật'); },
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.PDCARecord.delete(id),
    onSuccess: () => { invalidate(); toast.success('Đã xoá'); },
  });

  const handleAIGenerate = async () => {
    if (!categoryId) return toast.error('Vui lòng chọn hạng mục HSE trước');
    setAiLoading(true);
    try {
      // Get category SOP and Checklist context
      const catSops = sops.filter(s => s.category_code === categoryName);
      const catChecklists = checklists.filter(c => c.category_code === categoryName);

      const prompt = `Bạn là chuyên gia HSE tư vấn vòng lặp PDCA cho hạng mục "${categoryName}".
Giai đoạn hiện tại: ${phase.label} — ${phase.desc}

SOP hiện có: ${catSops.map(s => s.sop_code + ': ' + s.title).join(', ') || 'Chưa có'}
Checklist hiện có: ${catChecklists.map(c => c.checklist_code + ': ' + c.name_vi).join(', ') || 'Chưa có'}
Rủi ro cao: ${risks.filter(r => ['high', 'extreme'].includes(r.risk_level)).slice(0, 3).map(r => r.title).join(', ') || 'Không có'}

Hãy tạo 2-3 mục PDCA cho giai đoạn ${phase.label} này, mỗi mục bao gồm:
- title: Tiêu đề ngắn gọn, cụ thể
- description: Mô tả 1-2 câu
- objectives: Mục tiêu SMART (đo lường được)
- responsible_person: Vai trò phụ trách (VD: HSE Manager, Trưởng ca...)
- due_date: Hạn hợp lý (YYYY-MM-DD, trong vòng 3 tháng từ hôm nay 2026-04-09)
- completion_percent: 0

Trả về JSON array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  objectives: { type: 'string' },
                  responsible_person: { type: 'string' },
                  due_date: { type: 'string' },
                  completion_percent: { type: 'number' },
                },
              },
            },
          },
        },
      });

      const items = result?.items || [];
      for (const item of items) {
        await base44.entities.PDCARecord.create({
          ...item,
          hse_category_id: categoryId,
          hse_category_name: categoryName,
          phase: phase.key,
          status: 'draft',
          ai_generated: true,
        });
      }
      invalidate();
      toast.success(`AI đã tạo ${items.length} mục ${phase.label}`);
    } catch (err) {
      toast.error('Lỗi AI: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const completedCount = records.filter(r => ['completed', 'reviewed'].includes(r.status)).length;

  return (
    <div className="space-y-3">
      {/* Phase toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{records.length}</span> mục ·{' '}
          <span className="font-medium text-emerald-600">{completedCount}</span> hoàn thành
        </div>
        <div className="flex gap-2">
          {categoryId && (
            <Button variant="outline" size="sm" onClick={handleAIGenerate} disabled={aiLoading} className="gap-1.5 text-xs h-8">
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              AI Đề xuất
            </Button>
          )}
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="gap-1.5 text-xs h-8">
            <Plus className="w-3.5 h-3.5" /> Thêm
          </Button>
        </div>
      </div>

      {/* Phase-specific context helper */}
      {phase.key === 'plan' && <PlanHelper sops={sops} checklists={checklists} risks={risks} regulations={regulations} />}
      {phase.key === 'do' && <DoHelper sops={sops} checklists={checklists} />}
      {phase.key === 'check' && <CheckHelper actions={actions} />}
      {phase.key === 'act' && <ActHelper />}

      {/* Records list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm">Chưa có mục {phase.label} nào</p>
          {categoryId && <p className="text-xs mt-1">Nhấn "AI Đề xuất" để tạo tự động từ SOP & Checklist</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {records.map(rec => (
            <PDCARecordCard
              key={rec.id}
              record={rec}
              onEdit={r => { setEditing(r); setShowForm(true); }}
              onDelete={id => deleteMut.mutate(id)}
              regulations={regulations}
              sops={sops}
              risks={risks}
              checklists={checklists}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} mục {phase.label}</DialogTitle>
          </DialogHeader>
          <PDCARecordForm
            initial={editing || {}}
            categoryId={categoryId}
            categoryName={categoryName}
            phase={phase.key}
            onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            regulations={regulations}
            sops={sops}
            risks={risks}
            checklists={checklists}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}