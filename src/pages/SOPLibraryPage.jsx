import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Pencil, Trash2, Sparkles, ChevronDown, ChevronRight, FileStack } from 'lucide-react';
import LegalRefBadge from '@/components/legal/LegalRefBadge';
import AIGeneratorPanel from '@/components/legal/AIGeneratorPanel';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SOPTemplatePicker from '@/components/sops/SOPTemplatePicker';

const STATUS_CONFIG = {
  DRAFT: { label: 'Bản nháp', color: 'bg-gray-100 text-gray-600' },
  UNDER_REVIEW: { label: 'Đang xem xét', color: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: 'Đã phê duyệt', color: 'bg-emerald-100 text-emerald-700' },
  OBSOLETE: { label: 'Lỗi thời', color: 'bg-red-100 text-red-600' },
};

function SOPCard({ sop, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_CONFIG[sop.status] || STATUS_CONFIG.DRAFT;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary font-semibold">{sop.sop_code}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded">v{sop.version}</span>
              {sop.ai_generated && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1"><Sparkles className="w-3 h-3" />AI</span>}
            </div>
            <p className="font-semibold text-sm">{sop.title}</p>
            {sop.scope && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">Phạm vi: {sop.scope}</p>}
            {/* Legal refs */}
            {sop.legal_refs?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sop.legal_refs.slice(0, 4).map((ref, i) => (
                  <LegalRefBadge key={i} docCode={ref.doc_code} articleNumber={ref.article_number} note={ref.note} compact />
                ))}
              </div>
            )}
            {/* Steps preview */}
            {sop.steps?.length > 0 && (
              <div className="mt-2">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {sop.steps.length} bước thực hiện
                </button>
                {expanded && (
                  <div className="mt-2 space-y-2 ml-2 border-l-2 border-muted pl-3">
                    {sop.steps.map((step, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium">{step.step_number}. {step.step_title}</span>
                        {step.responsible_role && <span className="ml-2 text-muted-foreground">({step.responsible_role})</span>}
                        {step.legal_refs?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {step.legal_refs.map((ref, j) => (
                              <LegalRefBadge key={j} docCode={ref.doc_code} articleNumber={ref.article_number} compact />
                            ))}
                          </div>
                        )}
                        {step.warning && <p className="text-amber-600 mt-0.5">⚠ {step.warning}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(sop)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(sop.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SOPForm({ initial = {}, categories = [], onSubmit, onCancel }) {
  const [form, setForm] = useState({
    sop_code: '', category_code: '', title: '', purpose: '', scope: '',
    version: '1.0', status: 'DRAFT', approved_by: '', approved_date: '',
    next_review_date: '', legal_refs: [], steps: [], ai_generated: false, ...initial
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Mã SOP *</Label><Input value={form.sop_code} onChange={e => upd('sop_code', e.target.value)} required placeholder="VD: SOP-FIRE-001" /></div>
        <div><Label>Hạng mục *</Label>
          <Select value={form.category_code} onValueChange={v => upd('category_code', v)}>
            <SelectTrigger><SelectValue placeholder="Chọn hạng mục" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.category_code}>{c.name_vi || c.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Tiêu đề SOP *</Label><Input value={form.title} onChange={e => upd('title', e.target.value)} required /></div>
      <div><Label>Mục đích</Label><Textarea rows={2} value={form.purpose} onChange={e => upd('purpose', e.target.value)} /></div>
      <div><Label>Phạm vi áp dụng</Label><Input value={form.scope} onChange={e => upd('scope', e.target.value)} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Phiên bản</Label><Input value={form.version} onChange={e => upd('version', e.target.value)} /></div>
        <div><Label>Trạng thái</Label>
          <Select value={form.status} onValueChange={v => upd('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Ngày xem xét lại</Label><Input type="date" value={form.next_review_date} onChange={e => upd('next_review_date', e.target.value)} /></div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu SOP</Button>
      </div>
    </form>
  );
}

export default function SOPLibraryPage() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const qc = useQueryClient();

  const { data: sops = [], isLoading } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list('-created_date', 100),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const createMut = useMutation({ mutationFn: d => base44.entities.SOP.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sops'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.SOP.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sops'] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.SOP.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sops'] }); setDeleteId(null); } });

  const filtered = sops.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.sop_code?.toLowerCase().includes(q);
    const matchCat = filterCat === 'all' || s.category_code === filterCat;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thư Viện SOP</h1>
          <p className="text-sm text-muted-foreground mt-1">Quy trình chuẩn vận hành có căn cứ pháp lý</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <FileStack className="w-4 h-4 mr-2" /> Tạo từ mẫu
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Thêm SOP
          </Button>
        </div>
      </div>

      <AIGeneratorPanel
        type="SOP"
        onResult={data => {
          setEditing(null);
          setShowForm(true);
          setTimeout(() => {
            setEditing({ ...data, status: 'DRAFT', version: '1.0' });
            setShowForm(true);
          }, 100);
        }}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm SOP..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Hạng mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hạng mục</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.category_code}>{c.name_vi || c.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sop => (
            <SOPCard key={sop.id} sop={sop} onEdit={s => { setEditing(s); setShowForm(true); }} onDelete={setDeleteId} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có SOP. Nhấn "Thêm SOP" để tạo mới.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} SOP</DialogTitle></DialogHeader>
          <SOPForm initial={editing || {}} categories={categories} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <SOPTemplatePicker
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onPick={(data) => {
          setShowTemplates(false);
          setEditing(data);
          setShowForm(true);
        }}
        categories={categories}
      />

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}