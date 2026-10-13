import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import ApplicabilitySettingsButton from '@/components/legal/ApplicabilitySettingsButton';
import { getNotApplicableCodes } from '@/lib/applicability';

const RISK_COLOR = {
  CRITICAL: 'bg-red-100 border-red-300 hover:bg-red-50',
  HIGH: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  MEDIUM: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  LOW: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
};

const RISK_BADGE = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
};

export default function HSECategoryMatrixPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['legal-alerts'],
    queryFn: () => base44.entities.LegalAlert.list('-created_date', 100),
  });

  const { data: profile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: async () => {
      const list = await base44.entities.BusinessProfile.filter({ key: 'global' });
      return list[0] || null;
    },
  });

  const naCodes = getNotApplicableCodes(profile);
  const applicable = categories.filter(c => !naCodes.has(c.category_code));
  const naCount = categories.length - applicable.length;
  const compliantCount = applicable.filter(c => !c.has_pending_law_update && c.risk_level !== 'CRITICAL').length;
  const complianceScore = applicable.length === 0 ? 0 : Math.round((compliantCount / applicable.length) * 100);

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const pendingCount = categories.filter(c => c.has_pending_law_update).length;
  const criticalCount = categories.filter(c => c.risk_level === 'CRITICAL').length;

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ma Trận 41 Hạng Mục HSE</h1>
          <p className="text-sm text-muted-foreground mt-1">Tổng quan tuân thủ pháp lý — click vào hạng mục để xem chi tiết</p>
        </div>
        <ApplicabilitySettingsButton />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Tổng hạng mục', value: categories.length, color: 'text-foreground' },
          { label: 'Hạng mục áp dụng', value: applicable.length, color: 'text-blue-600' },
          { label: 'Không áp dụng (N/A)', value: naCount, color: 'text-gray-500' },
          { label: '% Tuân thủ', value: `${complianceScore}%`, color: complianceScore >= 80 ? 'text-emerald-600' : complianceScore >= 60 ? 'text-amber-600' : 'text-red-600' },
          { label: 'Rủi ro CRITICAL', value: criticalCount, color: 'text-red-600' },
          { label: 'Chờ cập nhật luật', value: pendingCount, color: 'text-amber-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 font-semibold text-amber-800 mb-2">
            <AlertTriangle className="w-4 h-4" /> {activeAlerts.length} cảnh báo pháp lý đang chờ xử lý
          </div>
          <div className="space-y-1">
            {activeAlerts.slice(0, 3).map(a => (
              <p key={a.id} className="text-xs text-amber-700">• {a.change_summary?.substring(0, 100)}...</p>
            ))}
          </div>
          <Link to="/legal/alerts" className="text-xs text-amber-600 underline mt-2 inline-block">Xem tất cả cảnh báo →</Link>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {categories.map(cat => {
          const isNA = naCodes.has(cat.category_code);
          return (
            <Card
              key={cat.id}
              className={cn(
                'cursor-pointer border transition-all',
                isNA ? 'bg-gray-50 border-dashed border-gray-300 opacity-70' : (RISK_COLOR[cat.risk_level] || RISK_COLOR.MEDIUM)
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">#{String(cat.display_number).padStart(2, '0')}</span>
                  <div className="flex items-center gap-1">
                    {isNA ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-semibold">N/A</span>
                    ) : cat.has_pending_law_update ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Có luật mới chờ cập nhật" />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs font-semibold leading-tight mb-1 line-clamp-2">{cat.name_vi || cat.name_en}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {isNA ? (
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-500">Không áp dụng</span>
                  ) : (
                    <>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${RISK_BADGE[cat.risk_level]}`}>{cat.risk_level}</span>
                      {cat.primary_law_codes?.slice(0, 1).map(c => (
                        <span key={c} className="text-xs font-mono bg-white/60 px-1 py-0.5 rounded border truncate max-w-full">{c.replace('LUAT-', '').replace('ND-', 'NĐ').substring(0, 12)}</span>
                      ))}
                    </>
                  )}
                </div>
                {!isNA && cat.has_pending_law_update && (
                  <p className="text-xs text-amber-600 mt-1.5 line-clamp-2 italic">{cat.pending_update_description?.substring(0, 50)}...</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
        {Object.entries(RISK_BADGE).map(([level, style]) => (
          <span key={level} className="flex items-center gap-1">
            <span className={`px-2 py-0.5 rounded font-medium ${style}`}>{level}</span>
          </span>
        ))}
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Có luật mới chờ cập nhật</span>
        <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-semibold">N/A</span> Không áp dụng (loại khỏi mẫu số)</span>
      </div>
    </div>
  );
}