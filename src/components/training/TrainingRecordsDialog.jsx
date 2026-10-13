import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Award, CheckCircle, XCircle } from 'lucide-react';
import { format, addMonths } from 'date-fns';

export default function TrainingRecordsDialog({ training, onClose }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    participant_name: '', participant_email: '', department: '', position: '',
    attendance_status: 'attended', score: '', passed: false, certificate_issued: false,
    certificate_number: '', notes: '',
  });

  const { data: records = [] } = useQuery({
    queryKey: ['training-records', training.id],
    queryFn: () => base44.entities.TrainingRecord.filter({ training_id: training.id }),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.TrainingRecord.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-records', training.id] }); setShowAdd(false); resetForm(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.TrainingRecord.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['training-records', training.id] }),
  });

  const resetForm = () => setForm({
    participant_name: '', participant_email: '', department: '', position: '',
    attendance_status: 'attended', score: '', passed: false, certificate_issued: false,
    certificate_number: '', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const score = form.score ? Number(form.score) : undefined;
    const passed = score !== undefined ? score >= (training.pass_score || 70) : form.passed;
    const certExpiry = passed && training.certificate_validity_months && training.actual_date
      ? format(addMonths(new Date(training.actual_date), training.certificate_validity_months), 'yyyy-MM-dd')
      : undefined;
    createMut.mutate({
      ...form,
      training_id: training.id,
      training_title: training.title,
      score,
      passed,
      certificate_expiry: certExpiry,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Danh sách học viên — {training.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Stats */}
          <div className="flex gap-3 text-sm">
            <Badge variant="outline">{records.length} học viên</Badge>
            <Badge className="bg-green-100 text-green-700">{records.filter(r => r.passed).length} đạt</Badge>
            <Badge className="bg-amber-100 text-amber-700">{records.filter(r => r.certificate_issued).length} chứng chỉ</Badge>
          </div>

          {/* Records list */}
          <div className="space-y-2">
            {records.map(r => (
              <div key={r.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{r.participant_name}</span>
                    {r.passed ? (
                      <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Đạt</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="w-3 h-3 mr-1" />Không đạt</Badge>
                    )}
                    {r.certificate_issued && <Badge className="bg-amber-100 text-amber-700 text-xs"><Award className="w-3 h-3 mr-1" />Chứng chỉ</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.department && `${r.department} · `}{r.score !== undefined && `Điểm: ${r.score}% · `}
                    {r.certificate_expiry && `HH: ${format(new Date(r.certificate_expiry), 'dd/MM/yyyy')}`}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMut.mutate(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add form */}
          {showAdd ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-semibold">Thêm học viên</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Họ tên *</Label>
                  <Input value={form.participant_name} onChange={e => set('participant_name', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={form.participant_email} onChange={e => set('participant_email', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Phòng ban</Label>
                  <Input value={form.department} onChange={e => set('department', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Điểm (%)</Label>
                  <Input type="number" value={form.score} onChange={e => set('score', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Tham dự</Label>
                  <Select value={form.attendance_status} onValueChange={v => set('attendance_status', v)}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attended">Tham dự</SelectItem>
                      <SelectItem value="absent">Vắng mặt</SelectItem>
                      <SelectItem value="partial">Một phần</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Mã chứng chỉ</Label>
                  <Input value={form.certificate_number} onChange={e => set('certificate_number', e.target.value)} className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Hủy</Button>
                <Button size="sm" onClick={handleSave} disabled={!form.participant_name}>Thêm</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Thêm học viên
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}