import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { TRACKER_CATEGORIES } from '@/lib/compliance';
import { Paperclip, Loader2 } from 'lucide-react';

export default function ComplianceTrackerForm({ initial = {}, clauses = [], onSubmit, onCancel }) {
  const [form, setForm] = useState({
    item_name: '', category: 'equipment_inspection', last_done_date: '', expiration_date: '',
    issuing_authority: '', renewal_owner: '', notes: '', linked_clause_code: '',
    evidence_file_uri: '', evidence_file_name: '',
    ...initial,
  });
  const [uploading, setUploading] = useState(false);
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      upd('evidence_file_uri', file_uri);
      upd('evidence_file_name', file.name);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div>
        <Label>Tên hồ sơ / Thiết bị *</Label>
        <Input value={form.item_name} onChange={e => upd('item_name', e.target.value)} required placeholder="VD: Nồi hơi xưởng 1" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Hạng mục</Label>
          <Select value={form.category} onValueChange={v => upd('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TRACKER_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Nghĩa vụ liên kết</Label>
          <Select value={form.linked_clause_code || 'none'} onValueChange={v => upd('linked_clause_code', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Không liên kết" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Không liên kết</SelectItem>
              {clauses.map(c => <SelectItem key={c.id} value={c.clause_code}>{c.clause_code} — {c.clause_title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>Ngày thực hiện gần nhất</Label><Input type="date" value={form.last_done_date} onChange={e => upd('last_done_date', e.target.value)} /></div>
        <div><Label>Ngày hết hạn</Label><Input type="date" value={form.expiration_date} onChange={e => upd('expiration_date', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>Cơ quan/Đơn vị cấp</Label><Input value={form.issuing_authority} onChange={e => upd('issuing_authority', e.target.value)} placeholder="VD: Sở LĐTBXH" /></div>
        <div><Label>Người phụ trách gia hạn</Label><Input value={form.renewal_owner} onChange={e => upd('renewal_owner', e.target.value)} /></div>
      </div>
      <div>
        <Label>File bằng chứng (PDF, JPG, PNG)</Label>
        <div className="flex items-center gap-2 mt-1">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-muted text-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            {uploading ? 'Đang tải...' : 'Tải lên file'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {form.evidence_file_name && <span className="text-xs text-muted-foreground truncate">{form.evidence_file_name}</span>}
        </div>
      </div>
      <div><Label>Ghi chú</Label><Textarea rows={2} value={form.notes} onChange={e => upd('notes', e.target.value)} /></div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
}