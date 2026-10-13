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
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const CATS = [
  { value: 'training', label: 'Đào tạo' },
  { value: 'ppe', label: 'PPE / BHLĐ' },
  { value: 'equipment', label: 'Thiết bị an toàn' },
  { value: 'inspection', label: 'Kiểm tra' },
  { value: 'emergency', label: 'Ứng cứu khẩn cấp' },
  { value: 'environmental', label: 'Môi trường' },
  { value: 'other', label: 'Khác' },
];

const CAT_COLORS = {
  training: 'bg-blue-100 text-blue-800',
  ppe: 'bg-orange-100 text-orange-800',
  equipment: 'bg-purple-100 text-purple-800',
  inspection: 'bg-teal-100 text-teal-800',
  emergency: 'bg-red-100 text-red-800',
  environmental: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-700',
};

function BudgetForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', year: new Date().getFullYear(), quarter: '',
    category: 'other', budget_type: 'planned', amount: '',
    currency: 'VND', status: 'draft', description: '',
    approved_by: '', vendor: '', invoice_number: '', payment_date: '', ...initial
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, amount: Number(form.amount) }); }} className="space-y-4">
      <div>
        <Label>Tiêu đề *</Label>
        <Input value={form.title} onChange={e => upd('title', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Danh mục chi tiêu</Label>
          <Select value={form.category} onValueChange={v => upd('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Loại ngân sách</Label>
          <Select value={form.budget_type} onValueChange={v => upd('budget_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Kế hoạch</SelectItem>
              <SelectItem value="actual">Thực chi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Số tiền (VNĐ) *</Label>
          <Input type="number" min="0" value={form.amount} onChange={e => upd('amount', e.target.value)} required />
        </div>
        <div>
          <Label>Năm</Label>
          <Input type="number" value={form.year} onChange={e => upd('year', e.target.value)} />
        </div>
        <div>
          <Label>Quý</Label>
          <Select value={String(form.quarter || '')} onValueChange={v => upd('quarter', v ? Number(v) : '')}>
            <SelectTrigger><SelectValue placeholder="Chọn quý" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Cả năm</SelectItem>
              <SelectItem value="1">Quý 1</SelectItem>
              <SelectItem value="2">Quý 2</SelectItem>
              <SelectItem value="3">Quý 3</SelectItem>
              <SelectItem value="4">Quý 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Trạng thái</Label>
          <Select value={form.status} onValueChange={v => upd('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="spent">Đã chi</SelectItem>
              <SelectItem value="cancelled">Đã huỷ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Mô tả</Label>
        <Textarea rows={2} value={form.description} onChange={e => upd('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Nhà cung cấp</Label><Input value={form.vendor} onChange={e => upd('vendor', e.target.value)} /></div>
        <div><Label>Số hóa đơn</Label><Input value={form.invoice_number} onChange={e => upd('invoice_number', e.target.value)} /></div>
        <div><Label>Ngày thanh toán</Label><Input type="date" value={form.payment_date} onChange={e => upd('payment_date', e.target.value)} /></div>
        <div><Label>Người phê duyệt</Label><Input value={form.approved_by} onChange={e => upd('approved_by', e.target.value)} /></div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}

export default function BudgetPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-created_date', 100),
  });

  const createMut = useMutation({ mutationFn: d => base44.entities.Budget.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.Budget.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setDeleteId(null); } });

  const planned = budgets.filter(b => b.budget_type === 'planned').reduce((s, b) => s + (b.amount || 0), 0);
  const actual = budgets.filter(b => b.budget_type === 'actual').reduce((s, b) => s + (b.amount || 0), 0);
  const usedPct = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  const fmt = v => v ? Number(v).toLocaleString('vi-VN') + ' ₫' : '0 ₫';

  return (
    <div>
      <PageHeader title="Ngân sách HSE" onAdd={() => { setEditing(null); setShowForm(true); }} addLabel="Thêm mục" />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} Ngân Sách</DialogTitle></DialogHeader>
          <BudgetForm initial={editing || {}} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ngân sách KH</p>
              <p className="font-bold text-sm">{fmt(planned)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Thực chi</p>
              <p className="font-bold text-sm">{fmt(actual)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Tỷ lệ sử dụng: <strong className={usedPct > 90 ? 'text-red-600' : 'text-primary'}>{usedPct}%</strong></p>
            <Progress value={usedPct} className={usedPct > 90 ? '[&>div]:bg-red-500' : ''} />
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : budgets.length === 0 ? <EmptyState message="Chưa có dữ liệu ngân sách" /> : (
        <div className="space-y-3">
          {budgets.map(b => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm">{b.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[b.category]}`}>{CATS.find(c => c.value === b.category)?.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.budget_type === 'planned' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{b.budget_type === 'planned' ? 'Kế hoạch' : 'Thực chi'}</span>
                      <StatusBadge value={b.status} />
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="font-bold text-base text-primary">{fmt(b.amount)}</p>
                      {b.vendor && <span className="text-xs text-muted-foreground">NCC: {b.vendor}</span>}
                      {b.year && <span className="text-xs text-muted-foreground">Năm {b.year}{b.quarter ? ` Q${b.quarter}` : ''}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(b); setShowForm(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}