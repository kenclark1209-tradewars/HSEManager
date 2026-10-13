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
import { Plus, Search, ClipboardCheck, Pencil, Trash2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import LegalRefBadge from '@/components/legal/LegalRefBadge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const FREQ_LABELS = {
  EACH_EVENT: 'Mỗi sự kiện', DAILY: 'Hàng ngày', WEEKLY: 'Hàng tuần',
  MONTHLY: 'Hàng tháng', QUARTERLY: 'Hàng quý', ANNUALLY: 'Hàng năm',
};

const STATUS_COLORS = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  OBSOLETE: 'bg-red-100 text-red-600',
};

function FormCard({ form, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary font-semibold">{form.form_code}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[form.status] || STATUS_COLORS.DRAFT}`}>{form.status}</span>
              <span className="text-xs bg-muted px-2 py-0.5 rounded">{FREQ_LABELS[form.frequency_of_use] || form.frequency_of_use}</span>
              {form.retention_period_years && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Lưu {form.retention_period_years} năm</span>}
            </div>
            <p className="font-semibold text-sm">{form.form_name}</p>
            {form.form_name_en && <p className="text-xs text-muted-foreground">{form.form_name_en}</p>}
            {form.law_form_reference && (
              <p className="text-xs text-amber-700 mt-1">📋 {form.law_form_reference}</p>
            )}
            {form.legal_refs?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.legal_refs.slice(0, 4).map((ref, i) => (
                  <LegalRefBadge key={i} docCode={ref.doc_code} articleNumber={ref.article_number} note={ref.note} compact />
                ))}
              </div>
            )}
            {form.fields?.length > 0 && (
              <div className="mt-2">
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {form.fields.length} trường dữ liệu
                </button>
                {expanded && (
                  <div className="mt-2 space-y-1 ml-2 border-l-2 border-muted pl-3 max-h-48 overflow-y-auto">
                    {form.fields.map((field, i) => (
                      <div key={i} className="text-xs flex items-start gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${field.is_mandatory ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {field.is_mandatory ? 'BẮT BUỘC' : 'Tuỳ chọn'}
                        </span>
                        <span className="font-medium">{field.field_name_vi || field.field_name}</span>
                        <span className="text-muted-foreground">({field.field_type})</span>
                        {field.legal_refs?.length > 0 && field.legal_refs.map((ref, j) => (
                          <LegalRefBadge key={j} docCode={ref.doc_code} compact />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(form)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(form.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormEntityForm({ initial = {}, categories = [], onSubmit, onCancel }) {
  const [form, setForm] = useState({
    form_code: '', category_code: '', form_name: '', form_name_en: '',
    law_form_reference: '', legal_refs: [], version: '1.0',
    status: 'ACTIVE', frequency_of_use: 'EACH_EVENT',
    fields: [], sop_code: '', retention_period_years: '', ...initial
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Mã Biểu Mẫu *</Label><Input value={form.form_code} onChange={e => upd('form_code', e.target.value)} required placeholder="VD: BM-PCCC-01" /></div>
        <div><Label>Hạng mục *</Label>
          <Select value={form.category_code} onValueChange={v => upd('category_code', v)}>
            <SelectTrigger><SelectValue placeholder="Chọn hạng mục" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.category_code}>{c.name_vi || c.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Tên biểu mẫu (Tiếng Việt) *</Label><Input value={form.form_name} onChange={e => upd('form_name', e.target.value)} required /></div>
      <div><Label>Tên biểu mẫu (Tiếng Anh)</Label><Input value={form.form_name_en} onChange={e => upd('form_name_en', e.target.value)} /></div>
      <div><Label>Tham chiếu mẫu theo luật</Label><Input value={form.law_form_reference} onChange={e => upd('law_form_reference', e.target.value)} placeholder="VD: Mẫu PC02 theo NĐ 105/2025" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Trạng thái</Label>
          <Select value={form.status} onValueChange={v => upd('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Đang dùng</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="OBSOLETE">Lỗi thời</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Tần suất dùng</Label>
          <Select value={form.frequency_of_use} onValueChange={v => upd('frequency_of_use', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(FREQ_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Thời hạn lưu (năm)</Label><Input type="number" value={form.retention_period_years} onChange={e => upd('retention_period_years', Number(e.target.value))} placeholder="VD: 5" /></div>
      </div>
      <div><Label>Mã SOP liên kết</Label><Input value={form.sop_code} onChange={e => upd('sop_code', e.target.value)} placeholder="VD: SOP-FIRE-001" /></div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu Biểu Mẫu</Button>
      </div>
    </form>
  );
}

export default function FormLibraryPage() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['hse-forms'],
    queryFn: () => base44.entities.HSEForm.list('-created_date', 100),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const createMut = useMutation({ mutationFn: d => base44.entities.HSEForm.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-forms'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.HSEForm.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-forms'] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.HSEForm.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-forms'] }); setDeleteId(null); } });

  const filtered = forms.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.form_name?.toLowerCase().includes(q) || f.form_code?.toLowerCase().includes(q);
    const matchCat = filterCat === 'all' || f.category_code === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thư Viện Biểu Mẫu HSE</h1>
          <p className="text-sm text-muted-foreground mt-1">Form/Biểu mẫu có căn cứ pháp lý, thời hạn lưu trữ theo luật</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Biểu Mẫu
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm biểu mẫu..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Hạng mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hạng mục</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.category_code}>{c.name_vi || c.name_en}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <FormCard key={f.id} form={f} onEdit={fm => { setEditing(fm); setShowForm(true); }} onDelete={setDeleteId} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có biểu mẫu. Nhấn "Thêm Biểu Mẫu" để tạo mới.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} Biểu Mẫu HSE</DialogTitle></DialogHeader>
          <FormEntityForm
            initial={editing || {}}
            categories={categories}
            onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}