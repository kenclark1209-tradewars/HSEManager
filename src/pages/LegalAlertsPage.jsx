import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Bell, BookOpen, RefreshCw } from 'lucide-react';

const URGENCY_CONFIG = {
  IMMEDIATE: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-700 border-red-300' },
  '30_DAYS': { label: 'Trong 30 ngày', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  '90_DAYS': { label: 'Trong 90 ngày', color: 'bg-blue-100 text-blue-700 border-blue-300' },
};

const ALERT_TYPE_CONFIG = {
  NEW_LAW: { label: 'Luật mới', icon: Bell, color: 'text-blue-600' },
  LAW_REPLACED: { label: 'Luật thay thế', icon: RefreshCw, color: 'text-amber-600' },
  EXPIRING_SOON: { label: 'Sắp hết HHL', icon: Clock, color: 'text-orange-600' },
  OBSOLETE_REF: { label: 'Tham chiếu lỗi thời', icon: AlertTriangle, color: 'text-red-600' },
  PENDING_UPDATE: { label: 'Chờ cập nhật', icon: Clock, color: 'text-purple-600' },
};

function AlertCard({ alert, onAcknowledge, onResolve }) {
  const urgency = URGENCY_CONFIG[alert.urgency] || URGENCY_CONFIG['30_DAYS'];
  const alertType = ALERT_TYPE_CONFIG[alert.alert_type] || ALERT_TYPE_CONFIG.PENDING_UPDATE;
  const Icon = alertType.icon;

  return (
    <Card className={`border-l-4 ${alert.urgency === 'IMMEDIATE' ? 'border-l-red-500' : alert.urgency === '30_DAYS' ? 'border-l-amber-500' : 'border-l-blue-500'} ${alert.status === 'RESOLVED' ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${alertType.color}`} />
              <span className="text-sm font-semibold">{alertType.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${urgency.color}`}>{urgency.label}</span>
              {alert.status === 'ACKNOWLEDGED' && <span className="text-xs bg-secondary px-2 py-0.5 rounded">Đã xác nhận</span>}
              {alert.status === 'RESOLVED' && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Đã xử lý</span>}
            </div>
            <p className="text-sm leading-relaxed">{alert.change_summary}</p>
            {alert.action_required && (
              <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                <span className="font-semibold">Hành động cần thực hiện: </span>{alert.action_required}
              </div>
            )}
            {alert.affected_categories?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Hạng mục ảnh hưởng:</span>
                {alert.affected_categories.map(c => (
                  <span key={c} className="text-xs bg-secondary px-2 py-0.5 rounded-full font-medium">{c}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {alert.official_url && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => window.open(alert.official_url, '_blank')}>
                <ExternalLink className="w-3 h-3 mr-1" /> Văn bản gốc
              </Button>
            )}
            {alert.status === 'ACTIVE' && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onAcknowledge(alert.id)}>
                <CheckCircle2 className="w-3 h-3 mr-1" /> Xác nhận
              </Button>
            )}
            {alert.status !== 'RESOLVED' && (
              <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={() => onResolve(alert.id)}>
                Đã xử lý
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LegalAlertsPage() {
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['legal-alerts'],
    queryFn: () => base44.entities.LegalAlert.list('-created_date', 100),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalAlert.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['legal-alerts'] }),
  });

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const acknowledgedAlerts = alerts.filter(a => a.status === 'ACKNOWLEDGED');
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');
  const pendingCategories = categories.filter(c => c.has_pending_law_update);

  const handleAcknowledge = (id) => updateMut.mutate({ id, data: { status: 'ACKNOWLEDGED' } });
  const handleResolve = (id) => updateMut.mutate({ id, data: { status: 'RESOLVED' } });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          Cảnh Báo Cập Nhật Pháp Luật
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi và xử lý các thay đổi pháp lý ảnh hưởng đến hệ thống HSE</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cần xử lý', value: activeAlerts.length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Đã xác nhận', value: acknowledgedAlerts.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Đã xử lý', value: resolvedAlerts.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'HM chờ update', value: pendingCategories.length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <Card key={s.label} className={s.bg}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Cần xử lý {activeAlerts.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeAlerts.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="acknowledged">Đã xác nhận ({acknowledgedAlerts.length})</TabsTrigger>
          <TabsTrigger value="categories">Hạng mục chờ ({pendingCategories.length})</TabsTrigger>
          <TabsTrigger value="resolved">Đã xử lý ({resolvedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {isLoading ? <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            : activeAlerts.length === 0 ? <div className="text-center py-8 text-emerald-600 font-medium">✓ Không có cảnh báo cần xử lý</div>
            : activeAlerts.map(a => <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />)}
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-3 mt-4">
          {acknowledgedAlerts.map(a => <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />)}
          {acknowledgedAlerts.length === 0 && <div className="text-center py-8 text-muted-foreground">Không có cảnh báo đã xác nhận</div>}
        </TabsContent>

        <TabsContent value="categories" className="space-y-3 mt-4">
          {pendingCategories.map(cat => (
            <Card key={cat.id} className="border-l-4 border-l-purple-400">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{cat.name_en}</p>
                    <p className="text-xs text-muted-foreground">{cat.name_vi}</p>
                    {cat.pending_update_description && (
                      <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2">{cat.pending_update_description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cat.primary_law_codes?.map(c => (
                        <span key={c} className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingCategories.length === 0 && <div className="text-center py-8 text-muted-foreground">Không có hạng mục nào cần cập nhật</div>}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-3 mt-4">
          {resolvedAlerts.map(a => <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />)}
          {resolvedAlerts.length === 0 && <div className="text-center py-8 text-muted-foreground">Chưa có cảnh báo nào được xử lý</div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}