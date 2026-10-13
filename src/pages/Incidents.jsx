import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import IncidentForm from '@/components/incidents/IncidentForm';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { incidentToImprovement } from '@/lib/hseEngine';

export default function Incidents() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Incident.create({ ...data, status: 'open' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Incident.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Incident.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incidents'] }); setDeleteId(null); }
  });

  const handleSubmit = async (data) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      const inc = await base44.entities.Incident.create({ ...data, status: 'open' });
      qc.invalidateQueries({ queryKey: ['incidents'] });
      setShowForm(false);
      // Auto-trigger engine on new incident
      console.log('[HSE-ENGINE][TRIGGER] New incident → handleIncident:', inc.title);
      incidentToImprovement(inc).then(result => {
        qc.invalidateQueries({ queryKey: ['actions'] });
        console.log(`[HSE-ENGINE] handleIncident done: ${result.actions?.length} actions created`);
      }).catch(err => console.error('[HSE-ENGINE] handleIncident error:', err));
    }
  };

  return (
    <div>
      <PageHeader title={t('incidents')} onAdd={() => { setEditing(null); setShowForm(true); }} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? t('edit') : t('create')} {t('incidents')}</DialogTitle>
          </DialogHeader>
          <IncidentForm initial={editing || {}} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : incidents.length === 0 ? <EmptyState /> : (
        <div className="space-y-3">
          {incidents.map(inc => (
            <Card key={inc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{inc.title}</p>
                      <StatusBadge value={inc.severity} type="severity" />
                      <StatusBadge value={inc.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {inc.location && `${inc.location} · `}
                      {inc.date_occurred && format(new Date(inc.date_occurred), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/incidents/${inc.id}`}><Eye className="w-4 h-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(inc); setShowForm(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(inc.id)}>
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