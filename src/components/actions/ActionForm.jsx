import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from '@/lib/i18n';

const TYPES = ['corrective', 'preventive', 'improvement'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function ActionForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', description: '', type: 'corrective', priority: 'medium',
    assigned_to: '', due_date: '', linked_incident_id: '', linked_risk_id: '',
    linked_inspection_id: '',
    ...initial
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
        <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={v => update('type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map(s => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('priority')}</Label>
          <Select value={form.priority} onValueChange={v => update('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(s => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('assigned_to')}</Label>
          <Input value={form.assigned_to} onChange={e => update('assigned_to', e.target.value)} />
        </div>
        <div>
          <Label>{t('due_date')}</Label>
          <Input type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
}