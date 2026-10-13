import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Clock, Scale, FileText, ListChecks,
  ClipboardCheck, BookMarked, TrendingUp, ExternalLink, ArrowRight
} from 'lucide-react';
import LegalRefBadge from '@/components/legal/LegalRefBadge';
import LegalAutoUpdatePanel from '@/components/legal/LegalAutoUpdatePanel';
import ApplicabilitySettingsButton from '@/components/legal/ApplicabilitySettingsButton';
import { daysUntil } from '@/lib/compliance';

function ComplianceScoreCard({ score, label, description, color }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{score}%</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${score >= 80 ? 'bg-emerald-100' : score >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}>
            {score >= 80 ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : score >= 60 ? <Clock className="w-6 h-6 text-amber-600" /> : <AlertTriangle className="w-6 h-6 text-red-600" />}
          </div>
        </div>
        <Progress value={score} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function CriticalAlertBanner({ alerts }) {
  if (!alerts.length) return null;
  const immediate = alerts.filter(a => a.urgency === 'IMMEDIATE' && a.status === 'ACTIVE');
  if (!immediate.length) return null;

  return (
    <div className="bg-red-50 border border-red-300 rounded-xl p-4">
      <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
        <AlertTriangle className="w-5 h-5" />
        {immediate.length} CẢNH BÁO KHẨN CẤP — Cần hành động ngay
      </div>
      {immediate.map(a => (
        <div key={a.id} className="text-sm text-red-700 mb-1 flex items-start gap-2">
          <span className="shrink-0">•</span>
          <span>{a.change_summary?.substring(0, 120)}...</span>
        </div>
      ))}
      <Link to="/legal/alerts">
        <Button size="sm" variant="destructive" className="mt-2">
          Xem và xử lý tất cả cảnh báo <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

function CategoryLegalStatus({ categories }) {
  const critical = categories.filter(c => c.risk_level === 'CRITICAL');
  const pending = categories.filter(c => c.has_pending_law_update);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          Trạng thái pháp lý 41 hạng mục
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{critical.length}</p>
            <p className="text-xs text-red-700">Hạng mục CRITICAL</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
            <p className="text-xs text-amber-700">Chờ cập nhật luật</p>
          </div>
        </div>
        <div className="space-y-2">
          {pending.slice(0, 4).map(cat => (
            <div key={cat.id} className="flex items-start gap-2 text-xs p-2 bg-amber-50 rounded">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{cat.name_vi || cat.name_en}</p>
                <p className="text-muted-foreground line-clamp-1">{cat.pending_update_description}</p>
              </div>
            </div>
          ))}
        </div>
        <Link to="/legal/categories">
          <Button variant="outline" size="sm" className="w-full text-xs mt-1">
            Xem ma trận đầy đủ <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function LibraryStats({ sops, checklists, forms, clauses }) {
  const items = [
    { icon: FileText, label: 'SOP đã tạo', value: sops.length, approved: sops.filter(s => s.status === 'APPROVED').length, path: '/library/sops', color: 'text-blue-600' },
    { icon: ListChecks, label: 'Checklist đã tạo', value: checklists.length, active: checklists.filter(c => c.status === 'ACTIVE').length, path: '/library/checklists', color: 'text-emerald-600' },
    { icon: ClipboardCheck, label: 'Biểu mẫu đã tạo', value: forms.length, active: forms.filter(f => f.status === 'ACTIVE').length, path: '/library/forms', color: 'text-purple-600' },
    { icon: Scale, label: 'Điều khoản đã index', value: clauses.length, mandatory: clauses.filter(c => c.obligation_type === 'MANDATORY').length, path: '/legal/clauses', color: 'text-orange-600' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-primary" />
          Thư viện Tài liệu HSE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(item => (
          <Link key={item.path} to={item.path} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.approved !== undefined && `${item.approved} phê duyệt / `}
                  {item.active !== undefined && `${item.active} active / `}
                  {item.mandatory !== undefined && `${item.mandatory} bắt buộc / `}
                  {item.value} tổng
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentLegalDocs({ docs }) {
  const active = docs.filter(d => d.status === 'HIEU_LUC').sort((a, b) => {
    const da = a.effective_date || a.issued_date || '';
    const db = b.effective_date || b.issued_date || '';
    return db.localeCompare(da);
  }).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Văn bản pháp luật gần đây nhất
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {active.map(doc => (
          <div key={doc.id} className="flex items-start justify-between gap-3 p-2 rounded hover:bg-muted/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-semibold text-primary">{doc.doc_code}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{doc.doc_name}</p>
              {doc.effective_date && <p className="text-xs text-muted-foreground">HHL: {doc.effective_date}</p>}
            </div>
            {doc.official_url && (
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => window.open(doc.official_url, '_blank')}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
        <Link to="/legal/registry">
          <Button variant="outline" size="sm" className="w-full text-xs mt-1">
            Xem toàn bộ kho văn bản <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function LegalComplianceDashboard() {
  const qc = useQueryClient();
  const { data: alerts = [] } = useQuery({
    queryKey: ['legal-alerts'],
    queryFn: () => base44.entities.LegalAlert.list('-created_date', 100),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['legal-docs-all'],
    queryFn: () => base44.entities.LegalDocument.list('-effective_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sops = [] } = useQuery({
    queryKey: ['sops'],
    queryFn: () => base44.entities.SOP.list('-created_date', 100),
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['hse-checklists'],
    queryFn: () => base44.entities.HSEChecklist.list('-created_date', 100),
  });

  const { data: forms = [] } = useQuery({
    queryKey: ['hse-forms'],
    queryFn: () => base44.entities.HSEForm.list('-created_date', 100),
  });

  const { data: clauses = [] } = useQuery({
    queryKey: ['legal-clauses'],
    queryFn: () => base44.entities.LegalClause.list('-created_date', 200),
  });

  const { data: tracker = [] } = useQuery({
    queryKey: ['compliance-tracker'],
    queryFn: () => base44.entities.ComplianceTracker.list('-expiration_date', 200),
  });

  // Calculate scores
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const immediateAlerts = activeAlerts.filter(a => a.urgency === 'IMMEDIATE');
  const pendingCategories = categories.filter(c => c.has_pending_law_update);

  // Evidence-based Legal Compliance Score:
  // (số nghĩa vụ có file bằng chứng hợp lệ & còn hạn) / (tổng nghĩa vụ áp dụng) * 100
  const validClauseCodes = new Set(
    tracker
      .filter(t => t.evidence_file_uri && daysUntil(t.expiration_date) >= 0 && t.linked_clause_code)
      .map(t => t.linked_clause_code)
  );
  const applicableObligations = clauses.length;
  const evidencedObligations = clauses.filter(c => validClauseCodes.has(c.clause_code)).length;
  const legalScore = applicableObligations === 0 ? 0 : Math.round((evidencedObligations / applicableObligations) * 100);

  const docScore = docs.length === 0 ? 0 : Math.round(
    (docs.filter(d => d.status === 'HIEU_LUC').length / docs.length) * 100
  );

  const sopScore = sops.length === 0 ? 0 : Math.round(
    (sops.filter(s => s.status === 'APPROVED').length / sops.length) * 100
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Legal Compliance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Tổng quan tuân thủ pháp lý và tiến độ xây dựng hệ thống tài liệu HSE</p>
        </div>
        <ApplicabilitySettingsButton />
      </div>

      <LegalAutoUpdatePanel
        docs={docs}
        onUpdated={() => {
          qc.invalidateQueries({ queryKey: ['legal-docs-all'] });
          qc.invalidateQueries({ queryKey: ['legal-alerts'] });
        }}
      />

      <CriticalAlertBanner alerts={alerts} />

      {/* Compliance Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ComplianceScoreCard
          score={legalScore}
          label="Legal Compliance Score"
          description={`${evidencedObligations}/${applicableObligations} nghĩa vụ có bằng chứng còn hạn`}
          color={legalScore >= 80 ? 'text-emerald-600' : legalScore >= 60 ? 'text-amber-600' : 'text-red-600'}
        />
        <ComplianceScoreCard
          score={docScore}
          label="Tỷ lệ văn bản còn hiệu lực"
          description={`${docs.filter(d => d.status === 'HIEU_LUC').length}/${docs.length} văn bản đang hiệu lực`}
          color="text-blue-600"
        />
        <ComplianceScoreCard
          score={sopScore}
          label="Tỷ lệ SOP đã phê duyệt"
          description={`${sops.filter(s => s.status === 'APPROVED').length}/${sops.length} SOP được phê duyệt`}
          color="text-purple-600"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <CategoryLegalStatus categories={categories} />
          <LibraryStats sops={sops} checklists={checklists} forms={forms} clauses={clauses} />
        </div>
        <div className="space-y-5">
          <RecentLegalDocs docs={docs} />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: '🔥 Review SOP PCCC (NĐ 105/2025)', path: '/library/sops', urgent: true },
                { label: '⚗️ Cập nhật SDS theo GHS Rev.10', path: '/library/forms', urgent: true },
                { label: '⚡ Update SOP LOTO (QCVN 25:2025)', path: '/library/sops', urgent: true },
                { label: '📋 Trích xuất điều khoản mới', path: '/legal/clauses', urgent: false },
                { label: '📊 Ma trận 41 hạng mục', path: '/legal/categories', urgent: false },
              ].map(action => (
                <Link key={action.path + action.label} to={action.path}>
                  <Button
                    variant={action.urgent ? 'outline' : 'ghost'}
                    size="sm"
                    className={`w-full justify-start text-xs h-8 ${action.urgent ? 'border-amber-200 hover:bg-amber-50' : ''}`}
                  >
                    {action.label}
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}