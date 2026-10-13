import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, X, CheckSquare, XSquare, MinusSquare, ClipboardList, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { isOverdue } from '@/lib/hseUtils';
import { toast } from 'sonner';
import ActionForm from '@/components/actions/ActionForm';

const INSPECTION_TYPES = [
  { value: 'routine', label: 'Định kỳ thường xuyên' },
  { value: 'scheduled', label: 'Theo kế hoạch' },
  { value: 'unscheduled', label: 'Đột xuất' },
  { value: 'regulatory', label: 'Kiểm tra cơ quan' },
  { value: 'internal_audit', label: 'Kiểm toán nội bộ' },
];

const DEFAULT_CHECKLIST = [
  'Lối thoát hiểm được thông thoáng',
  'Thiết bị PCCC đầy đủ, còn hạn',
  'PPE được sử dụng đúng cách',
  'Thiết bị điện an toàn',
  'Sàn làm việc sạch sẽ, không trơn trượt',
  'Biển cảnh báo được gắn đầy đủ',
  'Hóa chất được lưu trữ đúng quy định',
];

function InspectionForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', inspection_type: 'routine', status: 'planned',
    location: '', department: '', inspector: '',
    planned_date: '', actual_date: '', findings: '', notes: '',
    checklist_items: DEFAULT_CHECKLIST.map(item => ({ item, result: 'na', note: '' })),
    ...initial,
    checklist_items: (initial.checklist_items?.length > 0 ? initial.checklist_items : DEFAULT_CHECKLIST.map(item => ({ item, result: 'na', note: '' }))),
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addItem = () => upd('checklist_items', [...form.checklist_items, { item: '', result: 'na', note: '' }]);
  const updateItem = (i, k, v) => {
    const items = [...form.checklist_items];
    items[i] = { ...items[i], [k]: v };
    upd('checklist_items', items);
  };
  const removeItem = (i) => upd('checklist_items', form.checklist_items.filter((_, idx) => idx !== i));

  const score = form.checklist_items.length > 0
    ? Math.round((form.checklist_items.filter(i => i.result === 'pass').length / form.checklist_items.filter(i => i.result !== 'na').length || 0) * 100)
    : 0;

  return (
    <form onSubmit={e => {
      e.preventDefault();
      const nc = form.checklist_items.filter(i => i.result === 'fail').length;
      onSubmit({ ...form, score, non_conformities_count: nc });
    }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tiêu đề *</Label>
          <Input value={form.title} onChange={e => upd('title', e.target.value)} required />
        </div>
        <div>
          <Label>Loại kiểm tra</Label>
          <Select value={form.inspection_type} onValueChange={v => upd('inspection_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{INSPECTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Địa điểm</Label>
          <Input value={form.location} onChange={e => upd('location', e.target.value)} />
        </div>
        <div>
          <Label>Kiểm tra viên</Label>
          <Input value={form.inspector} onChange={e => upd('inspector', e.target.value)} />
        </div>
        <div>
          <Label>Ngày kế hoạch</Label>
          <Input type="date" value={form.planned_date} onChange={e => upd('planned_date', e.target.value)} />
        </div>
        <div>
          <Label>Ngày thực hiện</Label>
          <Input type="date" value={form.actual_date} onChange={e => upd('actual_date', e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Danh sách kiểm tra</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Điểm: <strong>{score}%</strong></span>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 h-7 text-xs">
              <Plus className="w-3 h-3" /> Thêm mục
            </Button>
          </div>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto border rounded-lg p-2">
          {form.checklist_items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input className="flex-1 h-8 text-xs" value={item.item} onChange={e => updateItem(i, 'item', e.target.value)} placeholder="Mục kiểm tra..." />
              <div className="flex gap-1">
                {[
                  { v: 'pass', icon: CheckSquare, c: 'text-emerald-600' },
                  { v: 'fail', icon: XSquare, c: 'text-red-600' },
                  { v: 'na', icon: MinusSquare, c: 'text-gray-400' },
                ].map(({ v, icon: Icon, c }) => (
                  <button key={v} type="button" onClick={() => updateItem(i, 'result', v)}
                    className={`${item.result === v ? c : 'text-muted-foreground/30'} hover:${c} transition-colors`}>
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Phát hiện / Kết quả</Label>
        <Textarea rows={3} value={form.findings} onChange={e => upd('findings', e.target.value)} />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}

export default function InspectionPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [capaInspection, setCapaInspection] = useState(null);
  const [capaItem, setCapaItem] = useState(null);
  const qc = useQueryClient();

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: d => base44.entities.Inspection.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inspections'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Inspection.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inspections'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.Inspection.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inspections'] }); setDeleteId(null); }
  });

  const createActionMut = useMutation({
    mutationFn: async ({ inspectionId, data }) => {
      const created = await base44.entities.Action.create({ ...data, status: 'open' });
      const insp = inspections.find(x => x.id === inspectionId);
      const linked = [...(insp?.linked_action_ids || []), created.id];
      await base44.entities.Inspection.update(inspectionId, { linked_action_ids: linked });
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inspections'] });
      qc.invalidateQueries({ queryKey: ['actions'] });
      setCapaInspection(null);
      setCapaItem(null);
      toast.success('Đã tạo CAPA khắc phục');
    }
  });

  const handleCreateCapa = (data) => {
    if (!capaInspection) return;
    createActionMut.mutate({ inspectionId: capaInspection.id, data });
  };

  const handleSubmit = d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d);

  const typeLabel = v => INSPECTION_TYPES.find(t => t.value === v)?.label || v;

  return (
    <div>
      <PageHeader title="Kiểm tra HSE" onAdd={() => { setEditing(null); setShowForm(true); }} addLabel="Tạo kiểm tra" />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Tạo'} Phiếu Kiểm Tra</DialogTitle></DialogHeader>
          <InspectionForm initial={editing || {}} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      <Dialog open={!!capaInspection} onOpenChange={o => { if (!o) { setCapaInspection(null); setCapaItem(null); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tạo CAPA khắc phục</DialogTitle></DialogHeader>
          {capaInspection && !capaItem && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Chọn mục không đạt để tạo hành động khắc phục:</p>
              {capaInspection.checklist_items.filter(i => i.result === 'fail').map((it, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCapaItem(it)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors text-sm"
                >
                  {it.item || `Mục ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
          {capaInspection && capaItem && (
            <ActionForm
              initial={{
                title: `Khắc phục: ${capaItem.item}`,
                description: `Phát hiện không đạt từ phiếu kiểm tra "${capaInspection.title}"`,
                type: 'corrective',
                priority: 'high',
                linked_inspection_id: capaInspection.id,
              }}
              onSubmit={handleCreateCapa}
              onCancel={() => { setCapaInspection(null); setCapaItem(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : inspections.length === 0 ? <EmptyState message="Chưa có phiếu kiểm tra" /> : (
        <div className="space-y-3">
          {inspections.map(insp => {
            const overdue = insp.status === 'planned' && isOverdue(insp.planned_date);
            return (
              <Card key={insp.id} className={`hover:shadow-md transition-shadow ${overdue ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm">{insp.title}</p>
                          {overdue && <Badge variant="destructive" className="text-xs">Quá hạn</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{typeLabel(insp.inspection_type)}</span>
                          <StatusBadge value={insp.status} />
                          {insp.score != null && insp.score > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${insp.score >= 80 ? 'bg-emerald-100 text-emerald-800' : insp.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              Điểm: {insp.score}%
                            </span>
                          )}
                          {insp.non_conformities_count > 0 && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{insp.non_conformities_count} không phù hợp</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {insp.location && <span>📍 {insp.location}</span>}
                          {insp.inspector && <span>👤 {insp.inspector}</span>}
                          {insp.planned_date && <span>📅 KH: {format(new Date(insp.planned_date), 'dd/MM/yyyy')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {insp.checklist_items?.some(i => i.result === 'fail') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-7 text-xs"
                          onClick={() => { setCapaInspection(insp); setCapaItem(null); }}
                        >
                          <Wrench className="w-3 h-3" /> Tạo CAPA khắc phục
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(insp); setShowForm(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(insp.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}