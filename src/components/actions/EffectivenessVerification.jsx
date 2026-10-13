import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardCheck } from 'lucide-react';

export default function EffectivenessVerification({ action, onSave, saving }) {
  const [form, setForm] = useState({
    verification_date: action.verification_date || '',
    verified_by: action.verified_by || '',
    verification_result: action.verification_result || '',
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" /> Đánh giá hiệu quả
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Theo dõi hiệu quả 30–60 ngày trước khi đóng hoàn toàn (ISO 45001).
        </p>
        <div>
          <Label>Ngày đánh giá hiệu quả</Label>
          <Input type="date" value={form.verification_date} onChange={e => upd('verification_date', e.target.value)} />
        </div>
        <div>
          <Label>Người đánh giá hiệu quả</Label>
          <Input value={form.verified_by} onChange={e => upd('verified_by', e.target.value)} />
        </div>
        <div>
          <Label>Kết luận hiệu quả</Label>
          <Select value={form.verification_result} onValueChange={v => upd('verification_result', v)}>
            <SelectTrigger><SelectValue placeholder="Chọn kết luận" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="passed">Đạt</SelectItem>
              <SelectItem value="failed">Chưa đạt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => onSave(form)} disabled={saving}>Lưu đánh giá</Button>
        </div>
      </CardContent>
    </Card>
  );
}