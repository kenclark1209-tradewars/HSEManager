import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Scale, FileText, Shield, ListChecks, Calendar, User, CheckCircle2, Clock, Circle } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft: { label: 'Nháp', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-50' },
  in_progress: { label: 'Đang thực hiện', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  completed: { label: 'Hoàn thành', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  reviewed: { label: 'Đã xem xét', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function PDCARecordCard({ record, onEdit, onDelete, regulations, sops, risks, checklists }) {
  const linkedRegs = (regulations || []).filter(r => (record.linked_regulation_ids || []).includes(r.id));
  const linkedSops = (sops || []).filter(s => (record.linked_sop_ids || []).includes(s.id));
  const linkedRisks = (risks || []).filter(r => (record.linked_risk_ids || []).includes(r.id));
  const linkedChecklists = (checklists || []).filter(c => (record.linked_checklist_ids || []).includes(c.id));

  const st = STATUS_CONFIG[record.status] || STATUS_CONFIG.draft;
  const StatusIcon = st.icon;

  const isOverdue = record.due_date && new Date(record.due_date) < new Date() && record.status !== 'completed' && record.status !== 'reviewed';

  return (
    <Card className={`hover:shadow-md transition-all border-l-4 ${isOverdue ? 'border-l-red-400' : 'border-l-transparent'}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{record.title}</p>
              {record.ai_generated && (
                <Badge variant="outline" className="text-xs gap-1 py-0">
                  <Bot className="w-2.5 h-2.5" />AI
                </Badge>
              )}
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.color}`}>
                <StatusIcon className="w-3 h-3" />
                {st.label}
              </span>
              {isOverdue && <span className="text-xs text-red-600 font-medium">⚠ Quá hạn</span>}
            </div>
            {record.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(record)} className="h-7 text-xs px-2">Sửa</Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(record.id)} className="h-7 text-xs px-2 text-destructive">Xoá</Button>
          </div>
        </div>

        {/* Objectives */}
        {record.objectives && (
          <div className="text-xs bg-muted/40 rounded-lg p-2">
            <span className="font-medium text-muted-foreground">🎯 Mục tiêu: </span>
            {record.objectives}
          </div>
        )}

        {/* Progress bar */}
        {record.completion_percent > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Tiến độ</span>
              <span className="font-medium">{record.completion_percent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${record.completion_percent}%`,
                  background: record.completion_percent === 100 ? '#22c55e' : 'hsl(var(--primary))'
                }}
              />
            </div>
          </div>
        )}

        {/* Linked items */}
        {(linkedRegs.length > 0 || linkedSops.length > 0 || linkedRisks.length > 0 || linkedChecklists.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {linkedRegs.map(r => (
              <Badge key={r.id} variant="outline" className="text-xs gap-1 font-mono py-0">
                <Scale className="w-2.5 h-2.5 text-blue-500" />{r.code}
              </Badge>
            ))}
            {linkedSops.map(s => (
              <Badge key={s.id} variant="outline" className="text-xs gap-1 py-0">
                <FileText className="w-2.5 h-2.5 text-indigo-500" />{s.sop_code || s.title?.substring(0, 20)}
              </Badge>
            ))}
            {linkedChecklists.map(c => (
              <Badge key={c.id} variant="outline" className="text-xs gap-1 py-0">
                <ListChecks className="w-2.5 h-2.5 text-emerald-500" />{c.checklist_code}
              </Badge>
            ))}
            {linkedRisks.map(r => (
              <Badge key={r.id} variant="outline" className="text-xs gap-1 py-0">
                <Shield className="w-2.5 h-2.5 text-red-500" />{r.title?.substring(0, 20)}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {record.responsible_person && (
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{record.responsible_person}</span>
          )}
          {record.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <Calendar className="w-3 h-3" />
              {format(new Date(record.due_date), 'dd/MM/yyyy')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}