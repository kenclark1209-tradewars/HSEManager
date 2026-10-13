import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Bot, RefreshCw, Play, AlertTriangle, CheckCircle, Shield,
  Zap, Activity, Settings2, Trash2, Eye
} from 'lucide-react';
import { runAIEngine, aiLog } from '@/lib/aiEngine';
import { handleActionOverdue } from '@/lib/hseEngine';
import { format } from 'date-fns';
import { isOverdue } from '@/lib/hseUtils';

const SEV_STYLE = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const TYPE_ICON = {
  risk_warning: '🔴',
  overdue_alert: '⏰',
  incident_pattern: '🔁',
  compliance_gap: '🛡️',
  sop_outdated: '📋',
  kpi_breach: '🚨',
  reminder: '🔔',
};

export default function AIMonitor() {
  const [running, setRunning] = useState(false);
  const [scanningOverdue, setScanningOverdue] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const qc = useQueryClient();

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['ai-alerts-all'],
    queryFn: () => base44.entities.AIAlert.list('-created_date', 100),
    refetchInterval: 15000,
  });

  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: () => base44.entities.Incident.list('-created_date', 100) });
  const { data: actions = [] } = useQuery({ queryKey: ['actions'], queryFn: () => base44.entities.Action.list('-created_date', 100) });
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: () => base44.entities.Risk.list('-created_date', 50) });
  const { data: cfgList = [] } = useQuery({ queryKey: ['ai-config'], queryFn: () => base44.entities.AIConfig.filter({ key: 'global' }) });
  const cfg = cfgList[0] || { enabled: true, mode: 'proactive', overdue_threshold: 3, incident_spike_threshold: 3, auto_create_actions: true, auto_create_alerts: true };

  const saveCfgMut = useMutation({
    mutationFn: async (data) => {
      if (cfgList[0]) return base44.entities.AIConfig.update(cfgList[0].id, data);
      return base44.entities.AIConfig.create({ key: 'global', ...data });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-config'] }),
  });

  const ackMut = useMutation({
    mutationFn: id => base44.entities.AIAlert.update(id, { status: 'acknowledged' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-alerts-all'] }),
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.AIAlert.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-alerts-all'] }),
  });

  const handleRunEngine = async () => {
    setRunning(true);
    setLogs([]);
    const origLog = console.log;
    const captured = [];
    console.log = (...args) => {
      captured.push(args.join(' '));
      origLog(...args);
    };
    try {
      const result = await runAIEngine();
      setLastResult(result);
      setLogs(captured);
      qc.invalidateQueries({ queryKey: ['ai-alerts-all'] });
      qc.invalidateQueries({ queryKey: ['ai-alerts'] });
      qc.invalidateQueries({ queryKey: ['actions'] });
    } finally {
      console.log = origLog;
      setRunning(false);
    }
  };

  // KPI stats
  const openIncidents = incidents.filter(i => i.status !== 'closed').length;
  const overdueActions = actions.filter(a => a.status !== 'closed' && isOverdue(a.due_date)).length;
  const highRisks = risks.filter(r => ['high', 'extreme'].includes(r.risk_level)).length;
  const activeAlerts = alerts.filter(a => a.status === 'active').length;

  const kpis = [
    { label: 'Sự cố đang mở', value: openIncidents, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Actions quá hạn', value: overdueActions, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Rủi ro cao', value: highRisks, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'AI Alerts đang hoạt động', value: activeAlerts, icon: Bot, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI HSE Manager — KPI Monitor</h1>
            <p className="text-xs text-muted-foreground">Giám sát tự động & Cảnh báo thông minh</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            setScanningOverdue(true);
            try {
              const r = await handleActionOverdue();
              qc.invalidateQueries({ queryKey: ['ai-alerts-all'] });
              alert(`Quét xong: ${r.overdueCount} overdue, tạo ${r.alertsCreated} alerts`);
            } finally { setScanningOverdue(false); }
          }} disabled={scanningOverdue} className="gap-2">
            {scanningOverdue ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Quét Overdue
          </Button>
          <Button onClick={handleRunEngine} disabled={running} className="gap-2">
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Đang quét...' : 'Chạy AI Engine'}
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className={`text-2xl font-bold ${k.value > 0 ? k.color : 'text-foreground'}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Alerts list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" /> AI Alerts ({alerts.length})
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">{activeAlerts} active</Badge>
              <Badge variant="secondary" className="text-xs">{alerts.filter(a => a.status === 'acknowledged').length} acked</Badge>
            </div>
          </div>

          {loadingAlerts ? (
            <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : alerts.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Chưa có cảnh báo — Nhấn "Chạy AI Engine" để quét
            </CardContent></Card>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {alerts.map(alert => (
                <Card key={alert.id} className={`border ${alert.status === 'acknowledged' ? 'opacity-50' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{TYPE_ICON[alert.type] || '⚠️'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{alert.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${SEV_STYLE[alert.severity]}`}>
                            {alert.severity}
                          </span>
                          {alert.status === 'acknowledged' && <Badge variant="secondary" className="text-xs">Đã biết</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{alert.created_date && format(new Date(alert.created_date), 'HH:mm dd/MM/yyyy')}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {alert.status === 'active' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => ackMut.mutate(alert.id)} title="Đã biết">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(alert.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Config + Logs */}
        <div className="space-y-4">
          {/* AI Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Cài đặt AI Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Bật AI tự động</Label>
                <Switch checked={!!cfg.enabled} onCheckedChange={v => saveCfgMut.mutate({ ...cfg, enabled: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tự tạo Actions</Label>
                <Switch checked={!!cfg.auto_create_actions} onCheckedChange={v => saveCfgMut.mutate({ ...cfg, auto_create_actions: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Tự tạo Alerts</Label>
                <Switch checked={!!cfg.auto_create_alerts} onCheckedChange={v => saveCfgMut.mutate({ ...cfg, auto_create_alerts: v })} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Chế độ AI</Label>
                <Select value={cfg.mode || 'proactive'} onValueChange={v => saveCfgMut.mutate({ ...cfg, mode: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passive">Passive — chỉ cảnh báo</SelectItem>
                    <SelectItem value="proactive">Proactive — tự động hành động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Ngưỡng overdue (actions)</Label>
                <Input type="number" className="h-8 text-xs" value={cfg.overdue_threshold || 3}
                  onChange={e => saveCfgMut.mutate({ ...cfg, overdue_threshold: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Ngưỡng tăng sự cố (7 ngày)</Label>
                <Input type="number" className="h-8 text-xs" value={cfg.incident_spike_threshold || 3}
                  onChange={e => saveCfgMut.mutate({ ...cfg, incident_spike_threshold: Number(e.target.value) })} />
              </div>
            </CardContent>
          </Card>

          {/* Engine Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" /> Engine Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {logs.map((log, i) => (
                    <p key={i} className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{log}</p>
                  ))}
                </div>
                {lastResult && (
                  <div className="mt-2 pt-2 border-t text-xs text-emerald-700">
                    ✅ Quét hoàn thành — Open: {lastResult.kpi?.openIncidents} | Overdue: {lastResult.kpi?.overdueActions} | HighRisk: {lastResult.kpi?.highRisks}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}