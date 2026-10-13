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
import { Plus, Search, ClipboardList, Pencil, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import LegalRefBadge from '@/components/legal/LegalRefBadge';
import AIGeneratorPanel from '@/components/legal/AIGeneratorPanel';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const FREQ_LABELS = {
  DAILY: 'Hàng ngày', WEEKLY: 'Hàng tuần', MONTHLY: 'Hàng tháng',
  QUARTERLY: 'Hàng quý', ANNUALLY: 'Hàng năm',
  BEFORE_WORK: 'Trước ca làm', AFTER_INCIDENT: 'Sau sự cố',
};

function ChecklistCard({ cl, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const criticalItems = cl.items?.filter(i => i.is_critical) || [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary font-semibold">{cl.checklist_code}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{FREQ_LABELS[cl.frequency] || cl.frequency}</span>
              {criticalItems.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{criticalItems.length} mục critical</span>}
            </div>
            <p className="font-semibold text-sm">{cl.name_vi || cl.name}</p>
            {cl.legal_refs?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {cl.legal_refs.slice(0, 3).map((ref, i) => (
                  <LegalRefBadge key={i} docCode={ref.doc_code} articleNumber={ref.article_number} note={ref.note} compact />
                ))}
              </div>
            )}
            {cl.items?.length > 0 && (
              <div className="mt-2">
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {cl.items.length} mục kiểm tra
                </button>
                {expanded && (
                  <div className="mt-2 space-y-1.5 ml-2 border-l-2 border-muted pl-3 max-h-64 overflow-y-auto">
                    {cl.items.map((item, i) => (
                      <div key={i} className={`text-xs p-1.5 rounded ${item.is_critical ? 'bg-red-50 border border-red-100' : ''}`}>
                        <div className="flex items-start gap-2">
                          {item.is_critical && <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />}
                          <div className="flex-1">
                            <span className="font-medium">{item.question_vi || item.question}</span>
                            <span className="ml-2 text-muted-foreground">({item.answer_type})</span>
                            {item.legal_refs?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.legal_refs.map((ref, j) => (
                                  <LegalRefBadge key={j} docCode={ref.doc_code} articleNumber={ref.article_number} compact />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cl)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(cl.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistForm({ initial = {}, categories = [], onSubmit, onCancel }) {
  const [form, setForm] = useState({
    checklist_code: '', category_code: '', name: '', name_vi: '',
    frequency: 'MONTHLY', legal_refs: [], items: [],
    auto_create_capa_if_fail: true, status: 'ACTIVE', ...initial
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Mã Checklist *</Label><Input value={form.checklist_code} onChange={e => upd('checklist_code', e.target.value)} required placeholder="VD: CL-FIRE-MONTHLY-01" /></div>
        <div><Label>Hạng mục *</Label>
          <Select value={form.category_code} onValueChange={v => upd('category_code', v)}>
            <SelectTrigger><SelectValue placeholder="Chọn hạng mục" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.category_code}>{c.name_vi || c.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Tên Checklist (Tiếng Việt)</Label><Input value={form.name_vi} onChange={e => upd('name_vi', e.target.value)} /></div>
      <div><Label>Tên Checklist (Tiếng Anh)</Label><Input value={form.name} onChange={e => upd('name', e.target.value)} required /></div>
      <div><Label>Tần suất *</Label>
        <Select value={form.frequency} onValueChange={v => upd('frequency', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(FREQ_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu Checklist</Button>
      </div>
    </form>
  );
}

export default function ChecklistLibraryPage() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['hse-checklists'],
    queryFn: () => base44.entities.HSEChecklist.list('-created_date', 100),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const createMut = useMutation({ mutationFn: d => base44.entities.HSEChecklist.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-checklists'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.HSEChecklist.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-checklists'] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.HSEChecklist.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-checklists'] }); setDeleteId(null); } });

  const filtered = checklists.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.name_vi?.toLowerCase().includes(q) || c.checklist_code?.toLowerCase().includes(q);
    const matchCat = filterCat === 'all' || c.category_code === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thư Viện Checklist</h1>
          <p className="text-sm text-muted-foreground mt-1">Danh mục kiểm tra có căn cứ pháp lý từng mục</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Checklist
        </Button>
      </div>

      <AIGeneratorPanel
        type="CHECKLIST"
        onResult={data => {
          setEditing({ ...data, status: 'ACTIVE' });
          setShowForm(true);
        }}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm checklist..." value={search} onChange={e => setSearch(e.target.value)} />
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
          {filtered.map(cl => (
            <ChecklistCard key={cl.id} cl={cl} onEdit={c => { setEditing(c); setShowForm(true); }} onDelete={setDeleteId} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có checklist. Nhấn "Thêm Checklist" để tạo mới.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} Checklist</DialogTitle></DialogHeader>
          <ChecklistForm initial={editing || {}} categories={categories} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}