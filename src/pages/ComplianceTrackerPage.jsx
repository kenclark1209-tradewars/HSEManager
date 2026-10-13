import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmptyState from '@/components/shared/EmptyState';
import ComplianceTrackerForm from '@/components/legal/ComplianceTrackerForm';
import EvidencePreviewDialog from '@/components/legal/EvidencePreviewDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, AlertTriangle, Clock, Pencil, Trash2, Eye, Paperclip } from 'lucide-react';
import { TRACKER_CATEGORIES, getExpiryStatus } from '@/lib/compliance';
import { format } from 'date-fns';
import { toast } from 'sonner';

const fmtDate = d => (d && !isNaN(new Date(d)) ? format(new Date(d), 'dd/MM/yyyy') : '—');

export default function ComplianceTrackerPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [preview, setPreview] = useState(null);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['compliance-tracker'],
    queryFn: () => base44.entities.ComplianceTracker.list('-expiration_date', 200),
  });

  const { data: clauses = [] } = useQuery({
    queryKey: ['legal-clauses'],
    queryFn: () => base44.entities.LegalClause.list('-created_date', 200),
  });

  const createMut = useMutation({
    mutationFn: d => base44.entities.ComplianceTracker.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance-tracker'] }); setShowForm(false); toast.success('Đã thêm hồ sơ theo dõi'); }
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ComplianceTracker.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance-tracker'] }); setShowForm(false); setEditing(null); toast.success('Đã cập nhật hồ sơ'); }
  });
  const deleteMut = useMutation({
    mutationFn: id => base44.entities.ComplianceTracker.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance-tracker'] }); setDeleteId(null); }
  });

  const handleSubmit = d => (editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d));

  const handleRowUpload = async (item, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    await base44.entities.ComplianceTracker.update(item.id, { evidence_file_uri: file_uri, evidence_file_name: file.name });
    qc.invalidateQueries({ queryKey: ['compliance-tracker'] });
    toast.success('Đã tải lên bằng chứng');
  };

  const statuses = items.map(i => ({ item: i, st: getExpiryStatus(i.expiration_date) }));
  const total = items.length;
  const greenCount = statuses.filter(s => s.st.level === 'ok').length;
  const yellowCount = statuses.filter(s => s.st.level === 'warning').length;
  const redCount = statuses.filter(s => s.st.level === 'expired' || s.st.level === 'critical').length;

  const KPIS = [
    { label: 'Tổng hồ sơ theo dõi', value: total, icon: ShieldCheck, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Còn hạn (Xanh)', value: greenCount, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sắp hết hạn ≤ 60 ngày (Vàng)', value: yellowCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Quá hạn / Rủi ro cao (Đỏ)', value: redCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Theo dõi Hạn & Bằng chứng"
        onAdd={() => { setEditing(null); setShowForm(true); }}
        addLabel="Thêm hồ sơ"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${k.bg}`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <EmptyState message="Chưa có hồ sơ theo dõi. Bấm 'Thêm hồ sơ' để bắt đầu." />
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên hồ sơ / Thiết bị</TableHead>
                  <TableHead>Hạng mục</TableHead>
                  <TableHead>Thực hiện gần nhất</TableHead>
                  <TableHead>Ngày hết hạn</TableHead>
                  <TableHead>Trạng thái & Đếm ngược</TableHead>
                  <TableHead>Bằng chứng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map(({ item, st }) => {
                  const catLabel = TRACKER_CATEGORIES.find(c => c.value === item.category)?.label || item.category;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="min-w-0">
                          <p className="truncate">{item.item_name}</p>
                          {item.issuing_authority && <p className="text-xs text-muted-foreground">{item.issuing_authority}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{catLabel}</Badge></TableCell>
                      <TableCell className="text-sm">{fmtDate(item.last_done_date)}</TableCell>
                      <TableCell className="text-sm">{fmtDate(item.expiration_date)}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${st.className}`}>{st.label}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md border cursor-pointer hover:bg-muted text-xs whitespace-nowrap" title="Tải lên bằng chứng">
                            <Paperclip className="w-3 h-3" /> Tải lên
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleRowUpload(item, e)} />
                          </label>
                          {item.evidence_file_uri && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Xem nhanh" onClick={() => setPreview(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(item); setShowForm(true); }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} hồ sơ theo dõi</DialogTitle></DialogHeader>
          <ComplianceTrackerForm
            initial={editing || {}}
            clauses={clauses}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <EvidencePreviewDialog
        open={!!preview}
        onOpenChange={o => { if (!o) setPreview(null); }}
        fileUri={preview?.evidence_file_uri}
        fileName={preview?.evidence_file_name}
      />

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}