import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Plus, Search, BookOpen, AlertTriangle, CheckCircle2, Clock, Globe, Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const STATUS_CONFIG = {
  HIEU_LUC: { label: 'Hiệu lực', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  CHUA_CO_HIEU_LUC: { label: 'Chưa có hiệu lực', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
  HET_HIEU_LUC: { label: 'Hết hiệu lực', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  TAM_DINH_CHI: { label: 'Tạm đình chỉ', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
};

const TYPE_LABELS = {
  LUAT: 'Luật', NGHI_DINH: 'Nghị định', THONG_TU: 'Thông tư',
  QUYET_DINH: 'Quyết định', QCVN: 'QCVN', TCVN: 'TCVN', TIEU_CHUAN_QT: 'TC Quốc tế'
};

function DocForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    doc_code: '', doc_type: 'NGHI_DINH', doc_number: '', doc_name: '',
    issuing_body: '', issued_date: '', effective_date: '', expiry_date: '',
    status: 'HIEU_LUC', official_url: '', summary: '',
    applicable_categories: [], country: 'VN', is_mandatory: true, ...initial,
    applicable_categories: initial.applicable_categories?.join(', ') || '',
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, applicable_categories: form.applicable_categories.split(',').map(s => s.trim()).filter(Boolean) }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Mã văn bản *</Label><Input value={form.doc_code} onChange={e => upd('doc_code', e.target.value)} required placeholder="VD: ND-105-2025" /></div>
        <div><Label>Loại văn bản *</Label>
          <Select value={form.doc_type} onValueChange={v => upd('doc_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Số hiệu văn bản</Label><Input value={form.doc_number} onChange={e => upd('doc_number', e.target.value)} placeholder="VD: 105/2025/NĐ-CP" /></div>
      <div><Label>Tên văn bản *</Label><Input value={form.doc_name} onChange={e => upd('doc_name', e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Cơ quan ban hành</Label><Input value={form.issuing_body} onChange={e => upd('issuing_body', e.target.value)} /></div>
        <div><Label>Trạng thái *</Label>
          <Select value={form.status} onValueChange={v => upd('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Ngày ban hành</Label><Input type="date" value={form.issued_date} onChange={e => upd('issued_date', e.target.value)} /></div>
        <div><Label>Ngày có hiệu lực</Label><Input type="date" value={form.effective_date} onChange={e => upd('effective_date', e.target.value)} /></div>
      </div>
      <div><Label>Link văn bản gốc</Label><Input value={form.official_url} onChange={e => upd('official_url', e.target.value)} placeholder="https://thuvienphapluat.vn/..." /></div>
      <div><Label>Tóm tắt nội dung</Label><Textarea rows={3} value={form.summary} onChange={e => upd('summary', e.target.value)} /></div>
      <div><Label>Hạng mục áp dụng (cách nhau bằng dấu phẩy)</Label><Input value={form.applicable_categories} onChange={e => upd('applicable_categories', e.target.value)} placeholder="FIRE_SAFETY, EMERGENCY_ACTION" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Quốc gia</Label>
          <Select value={form.country} onValueChange={v => upd('country', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="VN">Việt Nam</SelectItem><SelectItem value="INTERNATIONAL">Quốc tế</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}

export default function LegalRegistryPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['legal-docs-all'],
    queryFn: () => base44.entities.LegalDocument.list('-effective_date', 200),
  });

  const createMut = useMutation({ mutationFn: d => base44.entities.LegalDocument.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal-docs-all'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.LegalDocument.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal-docs-all'] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.LegalDocument.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal-docs-all'] }); setDeleteId(null); } });

  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.doc_name?.toLowerCase().includes(q) || d.doc_code?.toLowerCase().includes(q) || d.doc_number?.toLowerCase().includes(q);
    const matchType = filterType === 'all' || d.doc_type === filterType;
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: docs.length,
    active: docs.filter(d => d.status === 'HIEU_LUC').length,
    expired: docs.filter(d => d.status === 'HET_HIEU_LUC').length,
    pending: docs.filter(d => d.status === 'CHUA_CO_HIEU_LUC').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kho Văn Bản Pháp Luật</h1>
          <p className="text-sm text-muted-foreground mt-1">Legal Document Registry — cơ sở dữ liệu pháp lý cho toàn bộ hệ thống HSE</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Thêm văn bản
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng văn bản', value: stats.total, color: 'text-foreground' },
          { label: 'Đang hiệu lực', value: stats.active, color: 'text-emerald-600' },
          { label: 'Hết hiệu lực', value: stats.expired, color: 'text-red-600' },
          { label: 'Chưa có hiệu lực', value: stats.pending, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm văn bản..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Loại văn bản" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const st = STATUS_CONFIG[doc.status] || STATUS_CONFIG.HIEU_LUC;
            const StatusIcon = st.icon;
            return (
              <Card key={doc.id} className={`hover:shadow-md transition-shadow ${doc.status === 'HET_HIEU_LUC' ? 'border-red-200 bg-red-50/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${doc.country === 'INTERNATIONAL' ? 'bg-purple-100' : 'bg-primary/10'}`}>
                        {doc.country === 'INTERNATIONAL' ? <Globe className="w-4 h-4 text-purple-600" /> : <BookOpen className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold text-primary">{doc.doc_code}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${st.color}`}>
                            <StatusIcon className="w-3 h-3" />{st.label}
                          </span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_LABELS[doc.doc_type] || doc.doc_type}</span>
                          {doc.country === 'INTERNATIONAL' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Quốc tế</span>}
                        </div>
                        <p className="font-medium text-sm">{doc.doc_name}</p>
                        {doc.doc_number && <p className="text-xs text-muted-foreground">{doc.doc_number} — {doc.issuing_body}</p>}
                        {doc.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.summary}</p>}
                        {doc.status === 'HET_HIEU_LUC' && doc.replaced_by_doc && (
                          <p className="text-xs text-red-600 mt-1 font-medium">⚠ Đã bị thay thế bởi: {doc.replaced_by_doc}</p>
                        )}
                        {doc.applicable_categories?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.applicable_categories.slice(0, 4).map(c => (
                              <span key={c} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{c}</span>
                            ))}
                            {doc.applicable_categories.length > 4 && <span className="text-xs text-muted-foreground">+{doc.applicable_categories.length - 4}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.official_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(doc.official_url, '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(doc); setShowForm(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(doc.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground">Không tìm thấy văn bản nào</div>}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} Văn Bản Pháp Luật</DialogTitle></DialogHeader>
          <DocForm initial={editing || {}} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}