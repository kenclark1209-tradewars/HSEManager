import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRIES, COMPANY_SIZES, FACTORS } from '@/lib/applicability';

export default function BusinessProfileDialog({ open, onOpenChange, profile, onSave, saving }) {
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [factors, setFactors] = useState([]);

  useEffect(() => {
    if (open) {
      setIndustry(profile?.industry || '');
      setCompanySize(profile?.company_size || '');
      setFactors(profile?.factors || []);
    }
  }, [open, profile]);

  const toggleFactor = (v) =>
    setFactors(f => (f.includes(v) ? f.filter(x => x !== v) : [...f, v]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Cài đặt Phạm vi Doanh nghiệp</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground -mt-1">
          Hạng mục không liên quan sẽ được gắn nhãn "Không áp dụng (N/A)" và không tính vào mẫu số khi tính % tuân thủ.
        </p>

        <div className="space-y-3">
          <div>
            <Label>Ngành nghề</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger><SelectValue placeholder="Chọn ngành nghề" /></SelectTrigger>
              <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quy mô lao động</Label>
            <Select value={companySize} onValueChange={setCompanySize}>
              <SelectTrigger><SelectValue placeholder="Chọn quy mô" /></SelectTrigger>
              <SelectContent>{COMPANY_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Các yếu tố đặc thù</Label>
            <div className="space-y-2">
              {FACTORS.map(f => (
                <label key={f.value} className="flex items-start gap-2 cursor-pointer text-sm">
                  <Checkbox checked={factors.includes(f.value)} onCheckedChange={() => toggleFactor(f.value)} className="mt-0.5" />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button type="button" disabled={saving} onClick={() => onSave({ industry, company_size: companySize, factors })}>
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}