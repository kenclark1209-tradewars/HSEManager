import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Siren, Plus, Flame, Zap, Shield, AlertTriangle, Calendar, CheckCircle, Edit, Trash2, RefreshCw, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import EmergencyPlanDetail from '@/components/emergency/EmergencyPlanDetail';

const TYPE_LABELS = {
  fire: '🔥 Cháy nổ', chemical_spill: '☣️ Tràn hóa chất', medical_emergency: '🚑 Y tế khẩn cấp',
  natural_disaster: '🌪️ Thiên tai', explosion: '💥 Vụ nổ', evacuation: '🚪 Sơ tán',
  power_failure: '⚡ Mất điện', cyber_incident: '💻 An ninh mạng', other: '⚠️ Khác',
};

const STATUS_STYLE = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = { draft: 'Bản thảo', approved: 'Đã phê duyệt', active: 'Đang áp dụng', archived: 'Lưu trữ' };

const SEVERITY_STYLE = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function PlanForm({ plan, onClose, onSave }) {
  const [form, setForm] = useState(plan || {
    title: '', emergency_type: 'fire', status: 'draft', severity_level: 'high',
    description: '', trigger_conditions: '', evacuation_routes: '', assembly_points: '',
    resources_required: '', communication_plan: '', recovery_steps: '',
    last_drill_date: '', next_drill_date: '', review_date: '',
    location: '', department: '', approved_by: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Tên kế hoạch *</Label>
          <Input value={form.title} onChange={e => set('title', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Loại khẩn cấp</Label>
          <Select value={form.emergency_type} onValueChange={v => set('emergency_type', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Mức độ nghiêm trọng</Label>
          <Select value={form.severity_level} onValueChange={v => set('severity_level', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Thấp</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="high">Cao</SelectItem>
              <SelectItem value="critical">Nghiêm trọng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Trạng thái</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Phòng ban / Khu vực</Label>
          <Input value={form.department} onChange={e => set('department', e.target.value)} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Mô tả tình huống</Label>
          <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Điều kiện kích hoạt</Label>
          <Textarea value={form.trigger_conditions} onChange={e => set('trigger_conditions', e.target.value)} rows={2} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Lộ tuyến sơ tán</Label>
          <Textarea value={form.evacuation_routes} onChange={e => set('evacuation_routes', e.target.value)} rows={2} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Điểm tập kết</Label>
          <Input value={form.assembly_points} onChange={e => set('assembly_points', e.target.value)} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Nguồn lực cần thiết</Label>
          <Textarea value={form.resources_required} onChange={e => set('resources_required', e.target.value)} rows={2} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Kế hoạch truyền thông</Label>
          <Textarea value={form.communication_plan} onChange={e => set('communication_plan', e.target.value)} rows={2} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Ngày diễn tập cuối</Label>
          <Input type="date" value={form.last_drill_date} onChange={e => set('last_drill_date', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Ngày diễn tập tiếp theo</Label>
          <Input type="date" value={form.next_drill_date} onChange={e => set('next_drill_date', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Ngày xem xét</Label>
          <Input type="date" value={form.review_date} onChange={e => set('review_date', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Phê duyệt bởi</Label>
          <Input value={form.approved_by} onChange={e => set('approved_by', e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Lưu</Button>
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['emergency-plans'],
    queryFn: () => base44.entities.EmergencyPlan.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.EmergencyPlan.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emergency-plans'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmergencyPlan.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emergency-plans'] }); setEditItem(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.EmergencyPlan.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-plans'] }),
  });

  const handleSave = (form) => {
    if (editItem) updateMut.mutate({ id: editItem.id, data: form });
    else createMut.mutate(form);
  };

  const filtered = plans.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || p.emergency_type === filterType;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: plans.length,
    active: plans.filter(p => p.status === 'active').length,
    needDrill: plans.filter(p => !p.next_drill_date || new Date(p.next_drill_date) < new Date()).length,
    needReview: plans.filter(p => p.review_date && new Date(p.review_date) < new Date()).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
            <Siren className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Ứng phó Khẩn cấp</h1>
            <p className="text-xs text-muted-foreground">Kế hoạch và quy trình xử lý tình huống khẩn cấp</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm kế hoạch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng kế hoạch', value: stats.total, color: 'text-blue-600 bg-blue-50', icon: Shield },
          { label: 'Đang áp dụng', value: stats.active, color: 'text-green-600 bg-green-50', icon: CheckCircle },
          { label: 'Cần diễn tập', value: stats.needDrill, color: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
          { label: 'Cần xem xét', value: stats.needReview, color: 'text-red-600 bg-red-50', icon: Zap },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Input placeholder="Tìm kế hoạch..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs w-52" />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(plan => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewItem(plan)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-lg">{TYPE_LABELS[plan.emergency_type]?.split(' ')[0] || '⚠️'}</div>
                    <CardTitle className="text-sm font-semibold leading-tight mt-1">{plan.title}</CardTitle>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge className={`text-xs ${STATUS_STYLE[plan.status]}`}>{STATUS_LABELS[plan.status]}</Badge>
                    <Badge className={`text-xs ${SEVERITY_STYLE[plan.severity_level]}`}>{plan.severity_level?.toUpperCase()}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2" onClick={e => e.stopPropagation()}>
                {plan.description && <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>}
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  {plan.next_drill_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Diễn tập: {format(new Date(plan.next_drill_date), 'dd/MM/yyyy')}
                    </div>
                  )}
                  {plan.department && (
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {plan.department}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setViewItem(plan)}>
                    Xem chi tiết
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(plan); }}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(plan.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <Siren className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có kế hoạch ứng phó nào</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm || !!editItem} onOpenChange={() => { setShowForm(false); setEditItem(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Cập nhật kế hoạch' : 'Thêm kế hoạch ứng phó mới'}</DialogTitle>
          </DialogHeader>
          <PlanForm
            plan={editItem}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* Detail view */}
      {viewItem && (
        <EmergencyPlanDetail plan={viewItem} onClose={() => setViewItem(null)} />
      )}
    </div>
  );
}