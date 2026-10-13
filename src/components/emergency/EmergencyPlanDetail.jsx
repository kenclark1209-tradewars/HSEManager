import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, MapPin, Calendar, Shield, AlertTriangle, Users } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_LABELS = {
  fire: '🔥 Cháy nổ', chemical_spill: '☣️ Tràn hóa chất', medical_emergency: '🚑 Y tế khẩn cấp',
  natural_disaster: '🌪️ Thiên tai', explosion: '💥 Vụ nổ', evacuation: '🚪 Sơ tán',
  power_failure: '⚡ Mất điện', cyber_incident: '💻 An ninh mạng', other: '⚠️ Khác',
};

const SEVERITY_STYLE = {
  low: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};

function Section({ title, content }) {
  if (!content) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
      <p className="text-sm">{content}</p>
    </div>
  );
}

export default function EmergencyPlanDetail({ plan, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="text-3xl">{TYPE_LABELS[plan.emergency_type]?.split(' ')[0] || '⚠️'}</div>
            <div>
              <DialogTitle className="text-lg">{plan.title}</DialogTitle>
              <div className="flex gap-2 mt-1">
                <Badge className={SEVERITY_STYLE[plan.severity_level]}>{plan.severity_level?.toUpperCase()}</Badge>
                <Badge variant="outline">{TYPE_LABELS[plan.emergency_type]}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            {plan.department && <div className="flex items-center gap-1"><Shield className="w-3 h-3" />{plan.department}</div>}
            {plan.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{plan.location}</div>}
            {plan.last_drill_date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Diễn tập: {format(new Date(plan.last_drill_date), 'dd/MM/yyyy')}</div>}
            {plan.next_drill_date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Tiếp theo: {format(new Date(plan.next_drill_date), 'dd/MM/yyyy')}</div>}
            {plan.approved_by && <div className="flex items-center gap-1"><Users className="w-3 h-3" />Phê duyệt: {plan.approved_by}</div>}
            {plan.review_date && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Xem xét: {format(new Date(plan.review_date), 'dd/MM/yyyy')}</div>}
          </div>

          <Section title="Mô tả tình huống" content={plan.description} />
          <Section title="Điều kiện kích hoạt" content={plan.trigger_conditions} />

          <Separator />

          {/* Immediate actions */}
          {plan.immediate_actions && plan.immediate_actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Các bước hành động tức thì</p>
              <div className="space-y-2">
                {plan.immediate_actions.map((action, idx) => (
                  <div key={idx} className="flex gap-3 p-2 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shrink-0 font-bold">
                      {action.step || idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.action}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                        {action.responsible && <span>👤 {action.responsible}</span>}
                        {action.time_limit_minutes && <span>⏱ {action.time_limit_minutes} phút</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <Section title="Lộ tuyến sơ tán" content={plan.evacuation_routes} />
          <Section title="Điểm tập kết" content={plan.assembly_points} />
          <Section title="Nguồn lực cần thiết" content={plan.resources_required} />
          <Section title="Kế hoạch truyền thông" content={plan.communication_plan} />
          <Section title="Các bước phục hồi" content={plan.recovery_steps} />

          {/* Emergency contacts */}
          {plan.emergency_contacts && plan.emergency_contacts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Liên hệ khẩn cấp</p>
              <div className="space-y-1">
                {plan.emergency_contacts.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-muted/30 rounded text-sm">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium">{c.role}:</span>
                    <span>{c.name}</span>
                    {c.phone && <span className="text-primary font-mono">{c.phone}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}