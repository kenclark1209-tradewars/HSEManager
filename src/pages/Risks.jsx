import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import RiskForm from '@/components/risks/RiskForm';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { formatRiskScore } from '@/lib/hseUtils';

export default function Risks() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Risk.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Risk.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Risk.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['risks'] }); setDeleteId(null); }
  });

  const handleSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div>
      <PageHeader title={t('risks')} onAdd={() => { setEditing(null); setShowForm(true); }} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('create')} {t('risks')}</DialogTitle></DialogHeader>
          <RiskForm initial={editing || {}} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : risks.length === 0 ? <EmptyState /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <StatusBadge value={r.risk_level || 'medium'} type="severity" />
                      <StatusBadge value={r.status} />
                      <span className="text-xs text-muted-foreground">{t('risk_score')}: {formatRiskScore(r.risk_score)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.location && `${r.location} · `}{t(r.category)}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setShowForm(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
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