import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, ShieldCheck, ShieldAlert, ShieldX, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { isOverdue } from '@/lib/hseUtils';

const STATUS_MAP = {
  compliant: { label: 'Tuân thủ', color: 'bg-emerald-100 text-emerald-800', icon: ShieldCheck },
  partial: { label: 'Một phần', color: 'bg-amber-100 text-amber-800', icon: ShieldAlert },
  non_compliant: { label: 'Không tuân thủ', color: 'bg-red-100 text-red-800', icon: ShieldX },
  not_applicable: { label: 'Không áp dụng', color: 'bg-gray-100 text-gray-600', icon: Shield },
};

function ComplianceForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', regulation_code: '', requirement: '',
    compliance_status: 'partial', deadline: '',
    responsible_person: '', evidence: '', gap_description: '',
    action_plan: '', next_review_date: '', notes: '', ...initial
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <Label>Tiêu đề yêu cầu tuân thủ *</Label>
        <Input value={form.title} onChange={e => upd('title', e.target.value)} required placeholder="VD: Kiểm định thiết bị nâng hạng nặng" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Mã quy định</Label>
          <Input value={form.regulation_code} onChange={e => upd('regulation_code', e.target.value)} placeholder="VD: ISO 45001 Cl.8.1" />
        </div>
        <div>
          <Label>Trạng thái tuân thủ</Label>
          <Select value={form.compliance_status} onValueChange={v => upd('compliance_status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_MAP).map(([v, s]) => <SelectItem key={v} value={v}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Yêu cầu cụ thể</Label>
        <Textarea rows={3} value={form.requirement} onChange={e => upd('requirement', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Người phụ trách</Label>
          <Input value={form.responsible_person} onChange={e => upd('responsible_person', e.target.value)} />
        </div>
        <div>
          <Label>Hạn chót</Label>
          <Input type="date" value={form.deadline} onChange={e => upd('deadline', e.target.value)} />
        </div>
      </div>
      {form.compliance_status !== 'compliant' && (
        <div>
          <Label>Mô tả khoảng cách (Gap)</Label>
          <Textarea rows={2} value={form.gap_description} onChange={e => upd('gap_description', e.target.value)} placeholder="Hiện trạng so với yêu cầu..." />
        </div>
      )}
      <div>
        <Label>Kế hoạch hành động</Label>
        <Textarea rows={2} value={form.action_plan} onChange={e => upd('action_plan', e.target.value)} />
      </div>
      <div>
        <Label>Bằng chứng tuân thủ</Label>
        <Input value={form.evidence} onChange={e => upd('evidence', e.target.value)} placeholder="Tài liệu, chứng chỉ..." />
      </div>
      <div>
        <Label>Ngày xem xét tiếp theo</Label>
        <Input type="date" value={form.next_review_date} onChange={e => upd('next_review_date', e.target.value)} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}

export default function CompliancePage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => base44.entities.Compliance.list('-created_date', 100),
  });

  const createMut = useMutation({ mutationFn: d => base44.entities.Compliance.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.Compliance.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance'] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.Compliance.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance'] }); setDeleteId(null); } });

  const total = items.length;
  const compliant = items.filter(i => i.compliance_status === 'compliant').length;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <div>
      <PageHeader title="Tuân thủ & Pháp lý" onAdd={() => { setEditing(null); setShowForm(true); }} addLabel="Thêm yêu cầu" />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} Yêu Cầu Tuân Thủ</DialogTitle></DialogHeader>
          <ComplianceForm initial={editing || {}} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      {total > 0 && (
        <Card className="mb-5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tỷ lệ tuân thủ tổng thể</span>
              <span className={`font-bold text-lg ${pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
            </div>
            <Progress value={pct} className={pct >= 80 ? '[&>div]:bg-emerald-500' : pct >= 60 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'} />
            <div className="flex gap-4 mt-3 text-xs">
              {Object.entries(STATUS_MAP).map(([v, s]) => {
                const count = items.filter(i => i.compliance_status === v).length;
                return count > 0 ? (
                  <span key={v} className={`px-2 py-0.5 rounded-full ${s.color}`}>{s.label}: {count}</span>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : items.length === 0 ? <EmptyState message="Chưa có yêu cầu tuân thủ" /> : (
        <div className="space-y-3">
          {items.map(item => {
            const st = STATUS_MAP[item.compliance_status] || STATUS_MAP.partial;
            const StatusIcon = st.icon;
            const overdue = isOverdue(item.deadline) && item.compliance_status !== 'compliant';
            return (
              <Card key={item.id} className={`hover:shadow-md transition-shadow ${overdue ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${st.color}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm">{item.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                          {item.regulation_code && <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{item.regulation_code}</span>}
                        </div>
                        {item.requirement && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.requirement}</p>}
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {item.responsible_person && <span>👤 {item.responsible_person}</span>}
                          {item.deadline && !isNaN(new Date(item.deadline)) && <span className={overdue ? 'text-destructive font-medium' : ''}>📅 Hạn: {format(new Date(item.deadline), 'dd/MM/yyyy')}</span>}
                        </div>
                        {item.gap_description && (
                          <p className="text-xs mt-1 text-amber-700 bg-amber-50 px-2 py-1 rounded">⚠ Gap: {item.gap_description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setShowForm(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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