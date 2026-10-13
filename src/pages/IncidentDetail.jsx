import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { canCloseIncident } from '@/lib/hseUtils';
import StatusBadge from '@/components/shared/StatusBadge';
import FileUploader from '@/components/shared/FileUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RiskForm from '@/components/risks/RiskForm';
import { 
  ArrowLeft, CheckCircle, AlertTriangle, User, Search, 
  Wrench, FileText, Clock, MapPin, Building, Paperclip, Download, ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { exportIncidentToExcel } from '@/lib/exportIncidentExcel';
import { incidentToImprovement } from '@/lib/hseEngine';
import { Bot, Loader2 } from 'lucide-react';

const InfoRow = ({ label, value, highlight }) => (
  <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground w-36 shrink-0 mt-0.5">{label}</span>
    <span className={`text-sm font-medium flex-1 ${highlight ? 'text-destructive' : ''}`}>{value || '—'}</span>
  </div>
);

const Section = ({ title, children, icon: Icon }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
    {children}
  </div>
);

const WhyStep = ({ n, value }) => value ? (
  <div className="flex gap-3 items-start">
    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{n}</div>
    <div className="flex-1 p-2.5 bg-muted rounded-lg text-sm">{value}</div>
  </div>
) : null;

const RISK_CAT_MAP = {
  injury: 'safety', near_miss: 'safety', property_damage: 'safety',
  environmental: 'environmental', fire: 'fire', chemical: 'chemical',
  electrical: 'safety', other: 'other',
};

const SEVERITY_LABELS = {
  near_miss: 'Suýt xảy ra',
  first_aid: 'Sơ cứu',
  medical_treatment: 'Điều trị y tế',
  lost_time: 'Mất ngày công (LTI)',
  permanent_disability: 'Thương tật vĩnh viễn',
  fatality: 'Tử vong',
};

export default function IncidentDetail() {
  const pathParts = window.location.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  const qc = useQueryClient();
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => base44.entities.Incident.filter({ id }),
    select: data => data?.[0],
    enabled: !!id,
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions', 'incident', id],
    queryFn: () => base44.entities.Action.filter({ linked_incident_id: id }),
    enabled: !!id,
  });

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', 'incident', id],
    queryFn: () => base44.entities.Attachment.filter({ module: 'incident', module_id: id }),
    enabled: !!id,
  });

  const closeMut = useMutation({
    mutationFn: () => base44.entities.Incident.update(id, {
      status: 'closed',
      closed_date: new Date().toISOString().split('T')[0],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['incident', id] }); toast.success('Đã đóng sự cố'); },
  });

  const createRiskMut = useMutation({
    mutationFn: (data) => base44.entities.Risk.create(data),
    onSuccess: (risk) => {
      if (risk?.id) {
        base44.entities.Incident.update(id, { linked_risk_id: risk.id })
          .then(() => qc.invalidateQueries({ queryKey: ['incident', id] }));
      }
      setShowRiskForm(false);
      toast.success('Đã thêm rủi ro vào Bảng rủi ro (HIRA)');
    },
  });

  const handleClose = () => {
    if (!canCloseIncident(actions.length)) {
      toast.error(t('cannot_close_incident'));
      return;
    }
    closeMut.mutate();
  };

  const handleAIAnalyze = async () => {
    if (!incident) return;
    setAiAnalyzing(true);
    try {
      const result = await incidentToImprovement(incident);
      toast.success(`Phân tích xong: ${result.actions?.length || 0} hành động khắc phục đã tạo`);
      qc.invalidateQueries({ queryKey: ['actions', 'incident', id] });
      qc.invalidateQueries({ queryKey: ['incident', id] });
    } catch (err) {
      toast.error('Lỗi AI: ' + err.message);
    } finally {
      setAiAnalyzing(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!incident) return <div className="text-center py-16 text-muted-foreground">Không tìm thấy sự cố</div>;

  const sevColor = { near_miss: 'bg-blue-100 text-blue-800', first_aid: 'bg-amber-100 text-amber-800', medical_treatment: 'bg-orange-100 text-orange-800', lost_time: 'bg-red-100 text-red-800', permanent_disability: 'bg-red-200 text-red-900', fatality: 'bg-gray-900 text-white' };

  const riskInitial = {
    title: incident.title,
    description: [
      incident.root_cause_summary && `Nguyên nhân gốc rễ: ${incident.root_cause_summary}`,
      incident.unsafe_conditions && `Điều kiện không an toàn: ${incident.unsafe_conditions}`,
      incident.unsafe_acts && `Hành vi không an toàn: ${incident.unsafe_acts}`,
    ].filter(Boolean).join('\n'),
    category: RISK_CAT_MAP[incident.category] || 'safety',
    location: incident.location || '',
    mitigation_plan: incident.preventive_measures || '',
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link to="/incidents"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {incident.report_no && <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{incident.report_no}</span>}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${sevColor[incident.severity] || 'bg-gray-100 text-gray-700'}`}>
              {SEVERITY_LABELS[incident.severity] || incident.severity}
            </span>
            <StatusBadge value={incident.status} />
            {incident.is_lti && <Badge variant="destructive" className="text-xs">LTI</Badge>}
          </div>
          <h1 className="text-xl font-bold leading-tight">{incident.title}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            {incident.date_occurred && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(incident.date_occurred), 'dd/MM/yyyy')}{incident.time_occurred && ` ${incident.time_occurred}`}</span>}
            {incident.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.location}</span>}
            {incident.department && <span className="flex items-center gap-1"><Building className="w-3 h-3" />{incident.department}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { exportIncidentToExcel(incident); toast.success('Đã xuất file Excel!'); }}
          >
            <Download className="w-4 h-4" /> Tải về Excel
          </Button>
          {incident.status !== 'closed' && (
            <Button variant="outline" className="gap-2 text-primary border-primary/30" onClick={handleAIAnalyze} disabled={aiAnalyzing}>
              {aiAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              AI Phân tích
            </Button>
          )}
          {incident.status !== 'closed' && (
            <Button onClick={handleClose} variant="outline" className="gap-2" disabled={closeMut.isPending}>
              <CheckCircle className="w-4 h-4" /> Đóng sự cố
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="text-xs">Tổng quan</TabsTrigger>
          <TabsTrigger value="victim" className="text-xs">Nạn nhân</TabsTrigger>
          <TabsTrigger value="investigation" className="text-xs">Điều tra</TabsTrigger>
          <TabsTrigger value="rootcause" className="text-xs">Nguyên nhân</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Hành động</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Thông tin chung</CardTitle></CardHeader>
                <CardContent className="space-y-0">
                  <InfoRow label="Loại sự cố" value={incident.incident_type} />
                  <InfoRow label="Danh mục" value={t(incident.category)} />
                  <InfoRow label="Địa điểm" value={incident.location} />
                  <InfoRow label="Phòng/Ban" value={incident.department} />
                  <InfoRow label="Hoạt động CV" value={incident.work_activity} />
                  <InfoRow label="Người báo cáo" value={`${incident.reported_by || ''} ${incident.reported_by_position ? `(${incident.reported_by_position})` : ''}`} />
                  <InfoRow label="Người giám sát" value={incident.supervisor_name} />
                  <InfoRow label="Nhân chứng" value={incident.witnesses} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Mô tả sự cố</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{incident.description || '—'}</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Paperclip className="w-4 h-4" />Tệp đính kèm ({attachments.length})</CardTitle></CardHeader>
                <CardContent>
                  <FileUploader module="incident" moduleId={id} attachments={attachments} onUploadComplete={() => qc.invalidateQueries({ queryKey: ['attachments', 'incident', id] })} />
                </CardContent>
              </Card>
              {incident.property_damage_cost > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-sm">
                    <p className="font-semibold text-red-800">Thiệt hại tài sản</p>
                    <p className="text-red-600">{incident.property_damage_description}</p>
                    <p className="font-bold text-red-900 mt-1">{Number(incident.property_damage_cost).toLocaleString('vi-VN')} VNĐ</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Victim Tab */}
        <TabsContent value="victim">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" />Thông tin nạn nhân & Chấn thương</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Section title="Thông tin cá nhân">
                    <InfoRow label="Họ tên" value={incident.victim_name} />
                    <InfoRow label="Tuổi" value={incident.victim_age} />
                    <InfoRow label="Giới tính" value={incident.victim_gender === 'male' ? 'Nam' : incident.victim_gender === 'female' ? 'Nữ' : incident.victim_gender} />
                    <InfoRow label="Vị trí" value={incident.victim_position} />
                    <InfoRow label="Phòng/Ban" value={incident.victim_department} />
                    <InfoRow label="Kinh nghiệm" value={incident.victim_experience_years ? `${incident.victim_experience_years} năm` : null} />
                  </Section>
                </div>
                <div>
                  <Section title="Thông tin chấn thương">
                    <InfoRow label="Tính chất" value={incident.nature_of_injury} />
                    <InfoRow label="Bộ phận bị thương" value={incident.body_part_affected} />
                    <InfoRow label="Điều trị" value={incident.treatment_provided} />
                    <InfoRow label="Ngày mất việc" value={incident.lost_time_days ? `${incident.lost_time_days} ngày` : '0 ngày'} />
                    <InfoRow label="LTI" value={incident.is_lti ? '✓ Có' : '✗ Không'} highlight={incident.is_lti} />
                  </Section>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investigation Tab */}
        <TabsContent value="investigation">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Search className="w-4 h-4" />Điều tra sự cố</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Section title="Trình tự sự kiện">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted rounded-lg p-3">{incident.sequence_of_events || '—'}</p>
                </Section>
                <Section title="Nguyên nhân trực tiếp">
                  {incident.unsafe_acts && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-bold text-red-700 mb-1">⚠ Hành vi không an toàn</p>
                      <p className="text-sm">{incident.unsafe_acts}</p>
                    </div>
                  )}
                  {incident.unsafe_conditions && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs font-bold text-orange-700 mb-1">⚠ Điều kiện không an toàn</p>
                      <p className="text-sm">{incident.unsafe_conditions}</p>
                    </div>
                  )}
                </Section>
                <Section title="Đội điều tra">
                  <InfoRow label="Thành viên" value={incident.investigation_team} />
                  <InfoRow label="Bắt đầu" value={incident.investigation_start_date && format(new Date(incident.investigation_start_date), 'dd/MM/yyyy')} />
                  <InfoRow label="Kết thúc" value={incident.investigation_end_date && format(new Date(incident.investigation_end_date), 'dd/MM/yyyy')} />
                </Section>
                {incident.investigation_findings && (
                  <Section title="Kết quả điều tra">
                    <p className="text-sm whitespace-pre-wrap">{incident.investigation_findings}</p>
                  </Section>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Root Cause Tab */}
        <TabsContent value="rootcause">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Phân tích nguyên nhân gốc rễ</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <Section title="Phương pháp 5 Why">
                  <div className="space-y-2">
                    {[1,2,3,4,5].map(n => <WhyStep key={n} n={n} value={incident[`root_cause_why${n}`]} />)}
                    {![1,2,3,4,5].some(n => incident[`root_cause_why${n}`]) && <p className="text-sm text-muted-foreground italic">Chưa phân tích</p>}
                  </div>
                </Section>

                <Section title="Phân loại nguyên nhân">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: '🔧', label: 'Kỹ thuật', val: incident.root_cause_technical },
                      { icon: '👤', label: 'Con người', val: incident.root_cause_human },
                      { icon: '🏢', label: 'Hệ thống', val: incident.root_cause_systemic },
                      { icon: '📋', label: 'Quy trình', val: incident.root_cause_procedural },
                      { icon: '📚', label: 'Đào tạo', val: incident.root_cause_training },
                    ].map(({ icon, label, val }) => val ? (
                      <div key={label} className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-bold mb-1">{icon} {label}</p>
                        <p className="text-sm">{val}</p>
                      </div>
                    ) : null)}
                  </div>
                </Section>

                {incident.root_cause_summary && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-xs font-bold text-primary mb-1">✅ KẾT LUẬN NGUYÊN NHÂN GỐC RỄ</p>
                    <p className="text-sm font-medium">{incident.root_cause_summary}</p>
                  </div>
                )}

                {incident.preventive_measures && (
                  <Section title="Biện pháp phòng ngừa">
                    <p className="text-sm whitespace-pre-wrap">{incident.preventive_measures}</p>
                  </Section>
                )}
                {incident.lessons_learned && (
                  <Section title="Bài học kinh nghiệm">
                    <p className="text-sm whitespace-pre-wrap bg-amber-50 border border-amber-200 p-3 rounded-lg">{incident.lessons_learned}</p>
                  </Section>
                )}

                <div className="pt-3 border-t">
                  <Button className="gap-2" onClick={() => setShowRiskForm(true)}>
                    <ShieldAlert className="w-4 h-4" /> Cập nhật vào Bảng Rủi ro (HIRA)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Wrench className="w-4 h-4" />Hành động khắc phục ({actions.length})</CardTitle>
              <Button size="sm" asChild>
                <Link to={`/actions?incident_id=${id}`}>+ Thêm hành động</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-4 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{t('cannot_close_incident')}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {actions.map(a => (
                    <Link key={a.id} to={`/actions/${a.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(a.type)} · {a.assigned_to}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 ml-3">
                        <StatusBadge value={a.priority} type="priority" />
                        <StatusBadge value={a.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showRiskForm} onOpenChange={setShowRiskForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Thêm rủi ro vào Bảng rủi ro (HIRA)</DialogTitle></DialogHeader>
          <RiskForm
            initial={riskInitial}
            onSubmit={(data) => createRiskMut.mutate(data)}
            onCancel={() => setShowRiskForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}