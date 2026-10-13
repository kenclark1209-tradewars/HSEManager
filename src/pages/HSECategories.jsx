import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
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
import { Pencil, Trash2, Plus, Tag, User, Grid } from 'lucide-react';

const TYPES = [
  { value: 'department', label: 'Phòng/Ban' },
  { value: 'activity', label: 'Hoạt động' },
  { value: 'hazard_type', label: 'Loại mối nguy' },
  { value: 'project', label: 'Dự án' },
  { value: 'area', label: 'Khu vực' },
];

const TYPE_COLORS = {
  department: 'bg-blue-100 text-blue-800',
  activity: 'bg-green-100 text-green-800',
  hazard_type: 'bg-red-100 text-red-800',
  project: 'bg-purple-100 text-purple-800',
  area: 'bg-amber-100 text-amber-800',
};

function CategoryForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '', code: '', description: '', type: 'department',
    color: '#3b82f6', status: 'active', responsible_person: '', ...initial
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tên hạng mục *</Label>
          <Input value={form.name} onChange={e => upd('name', e.target.value)} required placeholder="VD: Phân xưởng sản xuất" />
        </div>
        <div>
          <Label>Mã hạng mục</Label>
          <Input value={form.code} onChange={e => upd('code', e.target.value)} placeholder="VD: PX-SX-01" />
        </div>
      </div>
      <div>
        <Label>Loại hạng mục</Label>
        <Select value={form.type} onValueChange={v => upd('type', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Mô tả</Label>
        <Textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Người phụ trách</Label>
          <Input value={form.responsible_person} onChange={e => upd('responsible_person', e.target.value)} />
        </div>
        <div>
          <Label>Màu nhãn</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={form.color} onChange={e => upd('color', e.target.value)} className="w-10 h-10 rounded cursor-pointer border" />
            <Input value={form.color} onChange={e => upd('color', e.target.value)} className="flex-1" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}

export default function HSECategories() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: cats = [], isLoading } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: d => base44.entities.HSECategory.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-categories'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HSECategory.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-categories'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.HSECategory.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hse-categories'] }); setDeleteId(null); }
  });

  const grouped = TYPES.reduce((acc, t) => {
    acc[t.value] = cats.filter(c => c.type === t.value);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Hạng Mục HSE" onAdd={() => { setEditing(null); setShowForm(true); }} addLabel="Thêm Hạng Mục" />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} Hạng Mục</DialogTitle></DialogHeader>
          <CategoryForm initial={editing || {}} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : cats.length === 0 ? <EmptyState message="Chưa có hạng mục HSE nào" /> : (
        <div className="space-y-6">
          {TYPES.map(type => grouped[type.value]?.length > 0 && (
            <div key={type.value}>
              <div className="flex items-center gap-2 mb-3">
                <Grid className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">{type.label}</h2>
                <Badge variant="outline" className="text-xs">{grouped[type.value].length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[type.value].map(cat => (
                  <Card key={cat.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '20', borderColor: cat.color, borderWidth: 1 }}>
                          <Tag className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-sm truncate">{cat.name}</p>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(cat); setShowForm(true); }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(cat.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {cat.code && <p className="text-xs font-mono text-muted-foreground">{cat.code}</p>}
                          {cat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>}
                          {cat.responsible_person && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />{cat.responsible_person}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}