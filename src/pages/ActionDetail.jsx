import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import StatusBadge from '@/components/shared/StatusBadge';
import FileUploader from '@/components/shared/FileUploader';
import EffectivenessVerification from '@/components/actions/EffectivenessVerification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getUserRole, getNextStatus, ACTION_WORKFLOW, getRoleLabel, canClose } from '@/lib/roleUtils';
import RoleSwitcher from '@/components/shared/RoleSwitcher';

const WORKFLOW_STEPS = ['open', 'in_progress', 'pending_approval', 'effectiveness_monitoring', 'closed'];
const LEGACY_STEP_INDEX = { assigned: 0, completed: 2 };
const STEP_LABELS = {
  open: 'Mở', assigned: 'Đã giao', in_progress: 'Đang xử lý',
  pending_approval: 'Chờ duyệt hoàn thành', completed: 'Hoàn thành',
  effectiveness_monitoring: 'Theo dõi hiệu quả', closed: 'Đóng hoàn toàn',
};

export default function ActionDetail() {
  const id = window.location.pathname.split('/').pop();
  const qc = useQueryClient();
  const role = getUserRole();

  const { data: action, isLoading } = useQuery({
    queryKey: ['action', id],
    queryFn: () => base44.entities.Action.filter({ id }),
    select: (data) => data?.[0],
    enabled: !!id,
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', 'action', id],
    queryFn: () => base44.entities.Attachment.filter({ module: 'action', module_id: id }),
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: (data) => base44.entities.Action.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action', id] });
      qc.invalidateQueries({ queryKey: ['actions'] });
    },
  });

  const handleTransition = () => {
    if (!action) return;
    const nextStatus = getNextStatus(action.status, role);
    if (!nextStatus) {
      toast.error(`Vai trò ${getRoleLabel(role)} không được phép thực hiện bước này`);
      return;
    }

    // Validate: in_progress → pending_approval requires evidence
    if (nextStatus === 'pending_approval' && attachments.length === 0) {
      toast.error('Phải có bằng chứng (evidence) trước khi nộp phê duyệt');
      return;
    }

    // Only manager can close
    if (nextStatus === 'closed' && !canClose('action', role)) {
      toast.error('Chỉ Quản lý mới được đóng hành động');
      return;
    }

    const updateData = { status: nextStatus };
    if (nextStatus === 'pending_approval' || nextStatus === 'completed') updateData.completed_date = new Date().toISOString().split('T')[0];
    if (nextStatus === 'closed') {
      updateData.closed_by = role;
      updateData.completed_date = updateData.completed_date || new Date().toISOString().split('T')[0];
    }
    if (nextStatus === 'pending_approval') updateData.approved_by = '';

    console.log(`[ACTION WORKFLOW] ${action.status} → ${nextStatus}`, updateData);
    updateMut.mutate(updateData);
    toast.success(`Đã chuyển trạng thái: ${STEP_LABELS[nextStatus]}`);
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!action) return <div className="text-center py-12 text-muted-foreground">Không tìm thấy</div>;

  const nextStatus = getNextStatus(action.status, role);
  const step = ACTION_WORKFLOW[action.status];
  const currentStepIdx = WORKFLOW_STEPS.indexOf(action.status) >= 0
    ? WORKFLOW_STEPS.indexOf(action.status)
    : (LEGACY_STEP_INDEX[action.status] ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/actions"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{action.title}</h1>
          <div className="flex gap-2 mt-1 flex-wrap">
            <StatusBadge value={action.priority} type="priority" />
            <StatusBadge value={action.status} />
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <RoleSwitcher />
          {nextStatus && (
            <Button onClick={handleTransition} disabled={updateMut.isPending} className="gap-2 text-sm">
              <ChevronRight className="w-4 h-4" />
              {step?.label}: {STEP_LABELS[nextStatus]}
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-0">
            {WORKFLOW_STEPS.map((s, i) => {
              const isPast = i < currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const isFuture = i > currentStepIdx;
              return (
                <div key={s} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast ? 'bg-primary text-primary-foreground' :
                      isCurrent ? 'bg-primary/20 border-2 border-primary text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    <span className={`text-[9px] text-center leading-tight max-w-[50px] ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-3 ${isPast ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>{t('description')}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{action.description || '-'}</p>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div><span className="text-muted-foreground">Loại:</span> <span className="font-medium">{t(action.type)}</span></div>
                <div><span className="text-muted-foreground">{t('assigned_to')}:</span> <span className="font-medium">{action.assigned_to || '-'}</span></div>
                <div><span className="text-muted-foreground">{t('due_date')}:</span> <span className="font-medium">
                  {action.due_date && !isNaN(new Date(action.due_date)) ? format(new Date(action.due_date), 'dd/MM/yyyy') : '-'}
                </span></div>
                <div><span className="text-muted-foreground">{t('status')}:</span> <span className="font-medium">{STEP_LABELS[action.status] || action.status}</span></div>
                {action.assigned_by && <div><span className="text-muted-foreground">Giao bởi:</span> <span className="font-medium">{action.assigned_by}</span></div>}
                {action.closed_by && <div><span className="text-muted-foreground">Đóng bởi:</span> <span className="font-medium">{action.closed_by}</span></div>}
              </div>

              {/* Role permission notice */}
              {!nextStatus && action.status !== 'closed' && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                  💡 Vai trò <strong>{getRoleLabel(role)}</strong> không có quyền chuyển trạng thái hiện tại. Liên hệ người có quyền phù hợp.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('evidence')} / {t('attachments')}</CardTitle></CardHeader>
            <CardContent>
              {attachments.length === 0 && action.status === 'in_progress' && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-xs">Cần upload bằng chứng trước khi nộp phê duyệt</span>
                </div>
              )}
              <FileUploader
                module="action"
                moduleId={id}
                attachments={attachments}
                onUploadComplete={() => qc.invalidateQueries({ queryKey: ['attachments', 'action', id] })}
              />
            </CardContent>
          </Card>

          {(action.status === 'effectiveness_monitoring' || action.status === 'closed') && (
            <EffectivenessVerification
              action={action}
              saving={updateMut.isPending}
              onSave={(data) => { updateMut.mutate(data); toast.success('Đã lưu đánh giá hiệu quả'); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}