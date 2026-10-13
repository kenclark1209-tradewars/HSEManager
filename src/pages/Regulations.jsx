import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, ExternalLink, Bot, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { regulationToRiskAction } from '@/lib/hseEngine';
import { toast } from 'sonner';

const CATS = ['iso', 'local_law', 'internal', 'industry_standard'];

function RegForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: '', code: '', description: '', category: 'iso',
    status: 'active', effective_date: '', document_url: '', ...initial
  });
  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{t('title')} *</Label>
          <Input value={form.title} onChange={e => update('title', e.target.value)} required />
        </div>
        <div>
          <Label>{t('code')} *</Label>
          <Input value={form.code} onChange={e => update('code', e.target.value)} required placeholder="VD: ISO 45001:2018" />
        </div>
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
              {CATS.map(c => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('effective_date')}</Label>
          <Input type="date" value={form.effective_date} onChange={e => update('effective_date', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>{t('document_url')}</Label>
        <Input value={form.document_url} onChange={e => update('document_url', e.target.value)} placeholder="https://..." />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
}

export default function Regulations() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const qc = useQueryClient();

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['regulations'],
    queryFn: () => base44.entities.Regulation.list('-created_date', 100),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Regulation.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['regulations'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Regulation.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['regulations'] }); setDeleteId(null); }
  });

  const handleSubmit = async (data) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      const reg = await base44.entities.Regulation.create(data);
      qc.invalidateQueries({ queryKey: ['regulations'] });
      setShowForm(false);
      // Auto-trigger engine on new law
      console.log('[HSE-ENGINE][TRIGGER] New regulation → handleNewLaw:', reg.code);
      regulationToRiskAction(reg).then(result => {
        toast.success(`[Auto] Tạo ${result.risks?.length || 0} rủi ro, ${result.actions?.length || 0} hành động từ "${reg.code}"`);
        qc.invalidateQueries({ queryKey: ['risks'] });
        qc.invalidateQueries({ queryKey: ['actions'] });
      }).catch(err => console.error('[HSE-ENGINE] handleNewLaw error:', err));
    }
  };

  const handleAnalyze = async (reg) => {
    setAnalyzingId(reg.id);
    try {
      const result = await regulationToRiskAction(reg);
      toast.success(`Tạo ${result.risks?.length || 0} rủi ro, ${result.actions?.length || 0} hành động từ "${reg.code}"`);
      qc.invalidateQueries({ queryKey: ['risks'] });
      qc.invalidateQueries({ queryKey: ['actions'] });
    } catch (err) {
      toast.error('Lỗi phân tích: ' + err.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div>
      <PageHeader title={t('regulations')} onAdd={() => { setEditing(null); setShowForm(true); }} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('create')} {t('regulations')}</DialogTitle></DialogHeader>
          <RegForm initial={editing || {}} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : regs.length === 0 ? <EmptyState /> : (
        <div className="space-y-3">
          {regs.map(reg => (
            <Card key={reg.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{reg.title}</p>
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{reg.code}</span>
                      <StatusBadge value={reg.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(reg.category)}
                      {reg.effective_date && ` · ${format(new Date(reg.effective_date), 'dd/MM/yyyy')}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {reg.document_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={reg.document_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="AI phân tích → Tạo Risk & Action" onClick={() => handleAnalyze(reg)} disabled={analyzingId === reg.id}>
                      {analyzingId === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 text-primary" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(reg); setShowForm(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(reg.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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