import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pencil, Trash2, Download, FileBarChart, Send } from 'lucide-react';
import { format } from 'date-fns';

const REPORT_TYPES = [
  { value: 'regulatory', label: 'Báo cáo cơ quan chức năng', color: 'bg-red-100 text-red-800' },
  { value: 'periodic_monthly', label: 'Định kỳ tháng', color: 'bg-blue-100 text-blue-800' },
  { value: 'periodic_quarterly', label: 'Định kỳ quý', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'periodic_annual', label: 'Định kỳ năm', color: 'bg-purple-100 text-purple-800' },
  { value: 'ad_hoc', label: 'Đột xuất', color: 'bg-orange-100 text-orange-800' },
];

function ReportForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', report_type: 'periodic_monthly', period_from: '', period_to: '',
    status: 'draft', prepared_by: '', submitted_to: '', summary: '',
    total_incidents: 0, total_lti: 0, total_near_miss: 0,
    total_actions_open: 0, total_actions_closed: 0, notes: '', ...initial
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <Label>Tiêu đề báo cáo *</Label>
        <Input value={form.title} onChange={e => upd('title', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Loại báo cáo</Label>
          <Select value={form.report_type} onValueChange={v => upd('report_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Trạng thái</Label>
          <Select value={form.status} onValueChange={v => upd('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="review">Đang xem xét</SelectItem>
              <SelectItem value="approved">Đã phê duyệt</SelectItem>
              <SelectItem value="submitted">Đã nộp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Từ ngày</Label>
          <Input type="date" value={form.period_from} onChange={e => upd('period_from', e.target.value)} />
        </div>
        <div>
          <Label>Đến ngày</Label>
          <Input type="date" value={form.period_to} onChange={e => upd('period_to', e.target.value)} />
        </div>
        <div>
          <Label>Người lập báo cáo</Label>
          <Input value={form.prepared_by} onChange={e => upd('prepared_by', e.target.value)} />
        </div>
        <div>
          <Label>Gửi đến (cơ quan/người)</Label>
          <Input value={form.submitted_to} onChange={e => upd('submitted_to', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Tóm tắt nội dung</Label>
        <Textarea rows={4} value={form.summary} onChange={e => upd('summary', e.target.value)} />
      </div>
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs font-bold mb-2 text-muted-foreground">CHỈ SỐ KỲ BÁO CÁO</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: 'total_incidents', l: 'Tổng sự cố' },
            { k: 'total_lti', l: 'LTI' },
            { k: 'total_near_miss', l: 'Near Miss' },
            { k: 'total_actions_open', l: 'Hành động đang mở' },
            { k: 'total_actions_closed', l: 'Hành động đã đóng' },
          ].map(({ k, l }) => (
            <div key={k}>
              <Label className="text-xs">{l}</Label>
              <Input type="number" min="0" value={form[k]} onChange={e => upd(k, Number(e.target.value))} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Ghi chú</Label>
        <Textarea rows={2} value={form.notes} onChange={e => upd('notes', e.target.value)} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}

export default function ReportsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const qc = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => base44.entities.Report.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: d => base44.entities.Report.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Report.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.Report.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); setDeleteId(null); }
  });

  const filtered = activeTab === 'all' ? reports : reports.filter(r => r.report_type === activeTab);

  const rtInfo = (type) => REPORT_TYPES.find(t => t.value === type) || REPORT_TYPES[0];

  return (
    <div>
      <PageHeader title="Báo cáo HSE" onAdd={() => { setEditing(null); setShowForm(true); }} addLabel="Tạo báo cáo" />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Tạo'} Báo Cáo</DialogTitle></DialogHeader>
          <ReportForm initial={editing || {}} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all" className="text-xs">Tất cả ({reports.length})</TabsTrigger>
          {REPORT_TYPES.map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-xs">
              {t.label} ({reports.filter(r => r.report_type === t.value).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? <EmptyState message="Chưa có báo cáo" /> : (
        <div className="space-y-3">
          {filtered.map(r => {
            const rt = rtInfo(r.report_type);
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileBarChart className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{r.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rt.color}`}>{rt.label}</span>
                          <StatusBadge value={r.status} />
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {r.period_from && r.period_to && (
                            <span>{format(new Date(r.period_from), 'dd/MM/yyyy')} → {format(new Date(r.period_to), 'dd/MM/yyyy')}</span>
                          )}
                          {r.prepared_by && <span>Người lập: {r.prepared_by}</span>}
                          {r.submitted_to && <span className="flex items-center gap-1"><Send className="w-3 h-3" />{r.submitted_to}</span>}
                        </div>
                        {(r.total_incidents > 0 || r.total_lti > 0) && (
                          <div className="flex gap-3 mt-2">
                            <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">🔴 {r.total_incidents} sự cố</span>
                            {r.total_lti > 0 && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">{r.total_lti} LTI</span>}
                            {r.total_near_miss > 0 && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{r.total_near_miss} Near Miss</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {r.file_url && <Button variant="ghost" size="icon" asChild><a href={r.file_url} target="_blank"><Download className="w-4 h-4" /></a></Button>}
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setShowForm(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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