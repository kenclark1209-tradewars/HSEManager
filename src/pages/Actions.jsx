import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { isOverdue } from '@/lib/hseUtils';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ActionForm from '@/components/actions/ActionForm';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Actions() {
  const params = new URLSearchParams(window.location.search);
  const incidentId = params.get('incident_id');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Action.create({ ...data, status: 'open' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actions'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Action.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actions'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Action.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actions'] }); setDeleteId(null); }
  });

  const handleSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const defaultForm = incidentId ? { linked_incident_id: incidentId } : {};

  return (
    <div>
      <PageHeader title={t('actions')} onAdd={() => { setEditing(null); setShowForm(true); }} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('create')} {t('actions')}</DialogTitle></DialogHeader>
          <ActionForm initial={editing || defaultForm} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : actions.length === 0 ? <EmptyState /> : (
        <div className="space-y-3">
          {actions.map(act => (
            <Card key={act.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{act.title}</p>
                      <StatusBadge value={act.priority} type="priority" />
                      <StatusBadge value={act.status} />
                      {isOverdue(act.due_date) && act.status !== 'closed' && (
                        <span className="flex items-center gap-1 text-xs text-destructive font-medium"><Clock className="w-3 h-3" /> Overdue</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {act.assigned_to && `${t('assigned_to')}: ${act.assigned_to}`}
                      {act.due_date && !isNaN(new Date(act.due_date)) && ` · ${t('due_date')}: ${format(new Date(act.due_date), 'dd/MM/yyyy')}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/actions/${act.id}`}><Eye className="w-4 h-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(act); setShowForm(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(act.id)}>
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