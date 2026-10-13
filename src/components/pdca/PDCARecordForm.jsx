import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, ListChecks, Scale, Shield } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'in_progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'reviewed', label: 'Đã xem xét' },
];

function LinkToggle({ items, selectedIds, onChange, label, icon: LinkIcon, color, getLabel }) {
  if (!items.length) return null;
  return (
    <div>
      <Label className="flex items-center gap-1.5 mb-1.5">
        <LinkIcon className={`w-3.5 h-3.5 ${color}`} />{label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isSelected ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-background hover:border-primary'
              }`}
            >
              {getLabel(item)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PDCARecordForm({ initial = {}, categoryId, categoryName, phase, onSubmit, onCancel, regulations, sops, risks, checklists }) {
  const [form, setForm] = useState({
    hse_category_id: categoryId || '',
    hse_category_name: categoryName || '',
    phase: phase || 'plan',
    title: '',
    description: '',
    objectives: '',
    targets: '',
    responsible_person: '',
    due_date: '',
    status: 'draft',
    completion_percent: 0,
    linked_regulation_ids: [],
    linked_sop_ids: [],
    linked_risk_ids: [],
    linked_checklist_ids: [],
    ai_generated: false,
    notes: '',
    ...initial,
  });

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (field, id) => {
    const arr = form[field] || [];
    upd(field, arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
      <div>
        <Label>Tiêu đề *</Label>
        <Input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="Nhập tiêu đề kế hoạch..." required />
      </div>
      <div>
        <Label>Mô tả</Label>
        <Textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={2} placeholder="Mô tả chi tiết..." />
      </div>
      <div>
        <Label>Mục tiêu cụ thể</Label>
        <Textarea value={form.objectives} onChange={e => upd('objectives', e.target.value)} rows={2} placeholder="Mục tiêu đo lường được (SMART)..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Người phụ trách</Label>
          <Input value={form.responsible_person} onChange={e => upd('responsible_person', e.target.value)} placeholder="Họ tên..." />
        </div>
        <div>
          <Label>Hạn chót</Label>
          <Input type="date" value={form.due_date} onChange={e => upd('due_date', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Trạng thái</Label>
          <Select value={form.status} onValueChange={v => upd('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>% Hoàn thành</Label>
          <Input type="number" min={0} max={100} value={form.completion_percent} onChange={e => upd('completion_percent', parseInt(e.target.value) || 0)} />
        </div>
      </div>

      {/* Linked items */}
      <LinkToggle items={sops} selectedIds={form.linked_sop_ids || []} onChange={id => toggle('linked_sop_ids', id)}
        label="Liên kết SOP" icon={FileText} color="text-indigo-500" getLabel={s => s.sop_code || s.title?.substring(0, 25)} />

      <LinkToggle items={checklists} selectedIds={form.linked_checklist_ids || []} onChange={id => toggle('linked_checklist_ids', id)}
        label="Liên kết Checklist" icon={ListChecks} color="text-emerald-500" getLabel={c => c.checklist_code} />

      <LinkToggle items={regulations} selectedIds={form.linked_regulation_ids || []} onChange={id => toggle('linked_regulation_ids', id)}
        label="Liên kết Pháp lý" icon={Scale} color="text-blue-500" getLabel={r => r.code} />

      <LinkToggle items={risks} selectedIds={form.linked_risk_ids || []} onChange={id => toggle('linked_risk_ids', id)}
        label="Liên kết Rủi ro" icon={Shield} color="text-red-500" getLabel={r => r.title?.substring(0, 30)} />

      <div>
        <Label>Ghi chú</Label>
        <Textarea value={form.notes} onChange={e => upd('notes', e.target.value)} rows={2} placeholder="Ghi chú thêm..." />
      </div>

      <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-background pb-1">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}