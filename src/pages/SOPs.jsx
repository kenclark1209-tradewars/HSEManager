import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import SOPForm from '@/components/sops/SOPForm';
import FileUploader from '@/components/shared/FileUploader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Eye, FileText } from 'lucide-react';

export default function SOPs() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: sops = [], isLoading } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list('-created_date', 100),
  });

  const { data: viewAttachments = [] } = useQuery({
    queryKey: ['attachments', 'sop', viewing?.id],
    queryFn: () => base44.entities.Attachment.filter({ module: 'sop', module_id: viewing?.id }),
    enabled: !!viewing?.id,
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.SOP.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sops'] }); setShowForm(false); }
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SOP.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sops'] }); setShowForm(false); setEditing(null); }
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.SOP.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sops'] }); setDeleteId(null); }
  });

  const handleSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  return (
    <div>
      <PageHeader title={t('sops')} onAdd={() => { setEditing(null); setShowForm(true); }} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('create')} SOP</DialogTitle></DialogHeader>
          <SOPForm initial={editing || {}} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />{viewing.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <StatusBadge value={viewing.status} />
                  <span className="text-xs text-muted-foreground">v{viewing.version}</span>
                </div>
                {viewing.description && <p className="text-sm text-muted-foreground">{viewing.description}</p>}
                {viewing.content && <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">{viewing.content}</div>}
                <FileUploader
                  module="sop"
                  moduleId={viewing.id}
                  attachments={viewAttachments}
                  onUploadComplete={() => qc.invalidateQueries({ queryKey: ['attachments', 'sop', viewing.id] })}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : sops.length === 0 ? <EmptyState /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sops.map(sop => (
            <Card key={sop.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{sop.title}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <StatusBadge value={sop.status} />
                      <span className="text-xs text-muted-foreground">v{sop.version || '1.0'}</span>
                      <span className="text-xs text-muted-foreground">{t(sop.category)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(sop)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(sop); setShowForm(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(sop.id)}>
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