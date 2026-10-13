import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { t } from '@/lib/i18n';
import { calculateRiskScore, getRiskLevel, formatRiskScore } from '@/lib/hseUtils';

const CATEGORIES = ['safety', 'health', 'environmental', 'fire', 'chemical', 'ergonomic', 'other'];

export default function RiskForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'safety', likelihood: 3, impact: 3,
    location: '', mitigation_plan: '', owner: '', review_date: '', ...initial
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const score = calculateRiskScore(form.likelihood, form.impact);
  const level = getRiskLevel(score);

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, risk_score: score, risk_level: level }); }} className="space-y-4">
      <div>
        <Label>{t('title')} *</Label>
        <Input value={form.title} onChange={e => update('title', e.target.value)} required />
      </div>
      <div>
        <Label>{t('description')}</Label>
        <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{t('category')}</Label>
          <Select value={form.category} onValueChange={v => update('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('location')}</Label>
          <Input value={form.location} onChange={e => update('location', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{t('likelihood')}: {form.likelihood}</Label>
          <Slider min={1} max={5} step={1} value={[form.likelihood]} onValueChange={v => update('likelihood', v[0])} className="mt-2" />
        </div>
        <div>
          <Label>{t('impact')}: {form.impact}</Label>
          <Slider min={1} max={5} step={1} value={[form.impact]} onValueChange={v => update('impact', v[0])} className="mt-2" />
        </div>
      </div>
      <div className="p-3 bg-muted rounded-lg text-sm">
        {t('risk_score')}: <strong>{formatRiskScore(score)}</strong> — {t(level)}
      </div>
      <div>
        <Label>{t('mitigation_plan')}</Label>
        <Textarea value={form.mitigation_plan} onChange={e => update('mitigation_plan', e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{t('owner')}</Label>
          <Input value={form.owner} onChange={e => update('owner', e.target.value)} />
        </div>
        <div>
          <Label>{t('review_date')}</Label>
          <Input type="date" value={form.review_date} onChange={e => update('review_date', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
}