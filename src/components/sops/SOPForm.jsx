import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';

const CATEGORIES = ['safety', 'health', 'environmental', 'emergency', 'general'];
const STATUSES = ['draft', 'review', 'approved', 'archived'];

export default function SOPForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', description: '', content: '', version: '1.0',
    status: 'draft', category: 'general', review_date: '', ...initial
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div>
        <Label>{t('title')} *</Label>
        <Input value={form.title} onChange={e => update('title', e.target.value)} required />
      </div>
      <div>
        <Label>{t('description')}</Label>
        <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} />
      </div>
      <div>
        <Label>{t('content')}</Label>
        <Textarea value={form.content} onChange={e => update('content', e.target.value)} rows={6} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Label>{t('status')}</Label>
          <Select value={form.status} onValueChange={v => update('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('version')}</Label>
          <Input value={form.version} onChange={e => update('version', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>{t('review_date')}</Label>
        <Input type="date" value={form.review_date} onChange={e => update('review_date', e.target.value)} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
}