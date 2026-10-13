import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Plus, Users, Calendar, Award, CheckCircle, Clock, XCircle, RefreshCw, Trash2, Edit } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import TrainingRecordsDialog from '@/components/training/TrainingRecordsDialog';

const CATEGORY_LABELS = {
  safety_induction: 'An toàn nhập môn', fire_safety: 'PCCC', first_aid: 'Sơ cứu',
  chemical_handling: 'Hóa chất', ppe_usage: 'PPE', emergency_response: 'Ứng phó khẩn cấp',
  iso_45001: 'ISO 45001', environmental: 'Môi trường', other: 'Khác',
};

const STATUS_STYLE = {
  planned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS = { planned: 'Kế hoạch', in_progress: 'Đang diễn ra', completed: 'Hoàn thành', cancelled: 'Hủy' };

function TrainingForm({ training, onClose, onSave }) {
  const [form, setForm] = useState(training || {
    title: '', category: 'safety_induction', training_type: 'classroom',
    status: 'planned', trainer: '', department: '', location: '',
    planned_date: '', duration_hours: 8, max_participants: 20,
    pass_score: 70, certificate_validity_months: 12, notes: '', cost: 0,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Tên khóa đào tạo *</Label>
          <Input value={form.title} onChange={e => set('title', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Loại đào tạo</Label>
          <Select value={form.category} onValueChange={v => set('category', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Hình thức</Label>
          <Select value={form.training_type} onValueChange={v => set('training_type', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="classroom">Lớp học</SelectItem>
              <SelectItem value="online">Trực tuyến</SelectItem>
              <SelectItem value="on_the_job">Tại chỗ</SelectItem>
              <SelectItem value="drill">Diễn tập</SelectItem>
              <SelectItem value="refresher">Ôn luyện</SelectItem>
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
          <Label className="text-xs">Ngày dự kiến</Label>
          <Input type="date" value={form.planned_date} onChange={e => set('planned_date', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Giảng viên / Tổ chức</Label>
          <Input value={form.trainer} onChange={e => set('trainer', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Phòng ban</Label>
          <Input value={form.department} onChange={e => set('department', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Địa điểm</Label>
          <Input value={form.location} onChange={e => set('location', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Thời lượng (giờ)</Label>
          <Input type="number" value={form.duration_hours} onChange={e => set('duration_hours', Number(e.target.value))} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Số học viên tối đa</Label>
          <Input type="number" value={form.max_participants} onChange={e => set('max_participants', Number(e.target.value))} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Điểm đạt (%)</Label>
          <Input type="number" value={form.pass_score} onChange={e => set('pass_score', Number(e.target.value))} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Hiệu lực chứng chỉ (tháng)</Label>
          <Input type="number" value={form.certificate_validity_months} onChange={e => set('certificate_validity_months', Number(e.target.value))} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Chi phí (VNĐ)</Label>
          <Input type="number" value={form.cost} onChange={e => set('cost', Number(e.target.value))} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Ghi chú</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="mt-1" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title}>Lưu</Button>
      </div>
    </div>
  );
}

export default function TrainingPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [recordsFor, setRecordsFor] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => base44.entities.Training.list('-created_date', 100),
  });

  const { data: records = [] } = useQuery({
    queryKey: ['training-records'],
    queryFn: () => base44.entities.TrainingRecord.list('-created_date', 500),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Training.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainings'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Training.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['trainings'] }); setEditItem(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Training.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trainings'] }),
  });

  const handleSave = (form) => {
    if (editItem) updateMut.mutate({ id: editItem.id, data: form });
    else createMut.mutate(form);
  };

  const filtered = trainings.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getRecordCount = (trainingId) => records.filter(r => r.training_id === trainingId).length;
  const getPassCount = (trainingId) => records.filter(r => r.training_id === trainingId && r.passed).length;

  const stats = {
    total: trainings.length,
    completed: trainings.filter(t => t.status === 'completed').length,
    planned: trainings.filter(t => t.status === 'planned').length,
    totalParticipants: records.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Quản lý Đào tạo</h1>
            <p className="text-xs text-muted-foreground">Theo dõi chương trình đào tạo HSE và chứng chỉ</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm khóa đào tạo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng khóa', value: stats.total, icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
          { label: 'Hoàn thành', value: stats.completed, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Kế hoạch', value: stats.planned, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Học viên', value: stats.totalParticipants, icon: Users, color: 'text-purple-600 bg-purple-50' },
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
        <Input placeholder="Tìm khóa đào tạo..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs w-52" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(training => {
            const recCount = getRecordCount(training.id);
            const passCount = getPassCount(training.id);
            return (
              <Card key={training.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-tight">{training.title}</CardTitle>
                    <Badge className={`text-xs shrink-0 ${STATUS_STYLE[training.status]}`}>{STATUS_LABELS[training.status]}</Badge>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-1">
                    <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[training.category] || training.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {training.planned_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(training.planned_date), 'dd/MM/yyyy')}
                      </div>
                    )}
                    {training.trainer && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {training.trainer}
                      </div>
                    )}
                    {training.duration_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {training.duration_hours}h
                      </div>
                    )}
                    {recCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {passCount}/{recCount} đạt
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setRecordsFor(training)}>
                      <Users className="w-3 h-3 mr-1" /> Học viên
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditItem(training)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMut.mutate(training.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có khóa đào tạo nào</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm || !!editItem} onOpenChange={() => { setShowForm(false); setEditItem(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Cập nhật khóa đào tạo' : 'Thêm khóa đào tạo mới'}</DialogTitle>
          </DialogHeader>
          <TrainingForm
            training={editItem}
            onClose={() => { setShowForm(false); setEditItem(null); }}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* Training Records Dialog */}
      {recordsFor && (
        <TrainingRecordsDialog
          training={recordsFor}
          onClose={() => setRecordsFor(null)}
        />
      )}
    </div>
  );
}