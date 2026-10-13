import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Zap, Shield, Activity, Clock } from 'lucide-react';
import { format, subDays, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function KPICard({ title, value, subtitle, trend, icon: Icon, color }) {
  const isUp = trend > 0;
  const isGood = (title.includes('Hoàn thành') || title.includes('Đạt')) ? isUp : !isUp;
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}% so với tháng trước
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AIInsightsDashboard() {
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents-insights'], queryFn: () => base44.entities.Incident.list('-created_date', 500) });
  const { data: actions = [] } = useQuery({ queryKey: ['actions-insights'], queryFn: () => base44.entities.Action.list('-created_date', 500) });
  const { data: risks = [] } = useQuery({ queryKey: ['risks-insights'], queryFn: () => base44.entities.Risk.list('-created_date', 200) });
  const { data: inspections = [] } = useQuery({ queryKey: ['inspections-insights'], queryFn: () => base44.entities.Inspection.list('-created_date', 200) });
  const { data: aiLogs = [] } = useQuery({ queryKey: ['ai-logs-insights'], queryFn: () => base44.entities.AIActionQueue.list('-created_date', 200) });

  // Monthly incident trend (last 6 months)
  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    return months.map(month => {
      const label = format(month, 'MM/yyyy');
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthIncidents = incidents.filter(i => {
        if (!i.created_date) return false;
        const d = new Date(i.created_date);
        return d >= start && d <= end;
      });
      const monthActions = actions.filter(a => {
        if (!a.created_date) return false;
        const d = new Date(a.created_date);
        return d >= start && d <= end;
      });
      return {
        month: label,
        'Sự cố': monthIncidents.length,
        'Near Miss': monthIncidents.filter(i => i.severity === 'near_miss').length,
        'LTI': monthIncidents.filter(i => i.is_lti).length,
        'Hành động': monthActions.length,
        'Đóng': monthActions.filter(a => a.status === 'closed').length,
      };
    });
  }, [incidents, actions]);

  // Incident by category
  const categoryData = useMemo(() => {
    const counts = {};
    incidents.forEach(i => { counts[i.category || 'other'] = (counts[i.category || 'other'] || 0) + 1; });
    const labels = { injury: 'Thương tích', near_miss: 'Near Miss', property_damage: 'Thiệt hại', fire: 'Cháy nổ', chemical: 'Hóa chất', electrical: 'Điện', environmental: 'Môi trường', other: 'Khác' };
    return Object.entries(counts).map(([k, v]) => ({ name: labels[k] || k, value: v }));
  }, [incidents]);

  // Risk matrix data
  const riskMatrixData = useMemo(() => {
    return [
      { subject: 'An toàn', score: risks.filter(r => r.category === 'safety').length },
      { subject: 'Sức khỏe', score: risks.filter(r => r.category === 'health').length },
      { subject: 'Môi trường', score: risks.filter(r => r.category === 'environmental').length },
      { subject: 'Cháy nổ', score: risks.filter(r => r.category === 'fire').length },
      { subject: 'Hóa chất', score: risks.filter(r => r.category === 'chemical').length },
      { subject: 'Ergonomic', score: risks.filter(r => r.category === 'ergonomic').length },
    ];
  }, [risks]);

  // AI performance
  const aiPerf = useMemo(() => {
    const total = aiLogs.length;
    const executed = aiLogs.filter(l => l.status === 'EXECUTED').length;
    const rejected = aiLogs.filter(l => l.status === 'REJECTED').length;
    const pending = aiLogs.filter(l => l.status === 'PENDING').length;
    return { total, executed, rejected, pending, rate: total > 0 ? Math.round((executed / total) * 100) : 0 };
  }, [aiLogs]);

  // Action closure rate
  const actionRate = useMemo(() => {
    const closed = actions.filter(a => a.status === 'closed').length;
    const overdue = actions.filter(a => a.status !== 'closed' && a.due_date && new Date(a.due_date) < new Date()).length;
    return { closed, overdue, rate: actions.length > 0 ? Math.round((closed / actions.length) * 100) : 0 };
  }, [actions]);

  // KPIs
  const currentMonth = incidents.filter(i => {
    if (!i.created_date) return false;
    const d = new Date(i.created_date);
    return d >= startOfMonth(new Date());
  });
  const lastMonth = incidents.filter(i => {
    if (!i.created_date) return false;
    const d = new Date(i.created_date);
    return d >= startOfMonth(subMonths(new Date(), 1)) && d <= endOfMonth(subMonths(new Date(), 1));
  });
  const incidentTrend = lastMonth.length > 0 ? Math.round(((currentMonth.length - lastMonth.length) / lastMonth.length) * 100) : 0;

  // Inspection score avg
  const avgScore = inspections.filter(i => i.score).reduce((sum, i, _, arr) => sum + i.score / arr.length, 0);

  // Severity breakdown
  const severityData = useMemo(() => {
    const map = { near_miss: 'Near Miss', first_aid: 'Sơ cứu', medical_treatment: 'Y tế', lost_time: 'LTI', permanent_disability: 'Tàn tật', fatality: 'Tử vong' };
    return Object.entries(map).map(([k, v]) => ({
      name: v,
      value: incidents.filter(i => i.severity === k).length,
    })).filter(d => d.value > 0);
  }, [incidents]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Insights Dashboard</h1>
          <p className="text-xs text-muted-foreground">Phân tích chuyên sâu & xu hướng HSE</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard title="Sự cố tháng này" value={currentMonth.length} subtitle={`${lastMonth.length} tháng trước`} trend={incidentTrend} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <KPICard title="Tỷ lệ đóng hành động" value={`${actionRate.rate}%`} subtitle={`${actionRate.closed}/${actions.length} đóng`} icon={Target} color="bg-green-50 text-green-600" />
        <KPICard title="Điểm kiểm tra TB" value={avgScore > 0 ? `${avgScore.toFixed(0)}%` : 'N/A'} subtitle={`${inspections.length} buổi kiểm tra`} icon={Shield} color="bg-blue-50 text-blue-600" />
        <KPICard title="Hiệu suất AI" value={`${aiPerf.rate}%`} subtitle={`${aiPerf.executed}/${aiPerf.total} thực thi`} icon={Brain} color="bg-purple-50 text-purple-600" />
      </div>

      <Tabs defaultValue="trends">
        <TabsList className="flex-wrap">
          <TabsTrigger value="trends"><TrendingUp className="w-4 h-4 mr-1.5" />Xu hướng</TabsTrigger>
          <TabsTrigger value="breakdown"><Activity className="w-4 h-4 mr-1.5" />Phân tích</TabsTrigger>
          <TabsTrigger value="risk"><Shield className="w-4 h-4 mr-1.5" />Rủi ro</TabsTrigger>
          <TabsTrigger value="ai"><Brain className="w-4 h-4 mr-1.5" />AI Performance</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Xu hướng sự cố & hành động (6 tháng)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Sự cố" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Near Miss" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="LTI" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Hành động" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Tỷ lệ đóng hành động theo tháng</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Hành động" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Đóng" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Sự cố theo danh mục</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Phân loại theo mức độ nghiêm trọng</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={severityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary table */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Tóm tắt chỉ số an toàn</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Tổng sự cố', value: incidents.length, icon: AlertTriangle, color: 'text-red-500' },
                  { label: 'LTI', value: incidents.filter(i => i.is_lti).length, icon: Clock, color: 'text-orange-500' },
                  { label: 'Quá hạn', value: actionRate.overdue, icon: Zap, color: 'text-amber-500' },
                  { label: 'Rủi ro cao', value: risks.filter(r => r.risk_level === 'high' || r.risk_level === 'extreme').length, icon: Shield, color: 'text-red-500' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 bg-muted/30 rounded-lg">
                    <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Radar rủi ro theo danh mục</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={riskMatrixData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <Radar name="Số lượng" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Phân bố mức độ rủi ro</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 pt-4">
                  {[
                    { level: 'extreme', label: 'Cực cao', color: 'bg-red-500', textColor: 'text-red-700' },
                    { level: 'high', label: 'Cao', color: 'bg-orange-400', textColor: 'text-orange-700' },
                    { level: 'medium', label: 'Trung bình', color: 'bg-amber-400', textColor: 'text-amber-700' },
                    { level: 'low', label: 'Thấp', color: 'bg-green-400', textColor: 'text-green-700' },
                  ].map(r => {
                    const count = risks.filter(risk => risk.risk_level === r.level).length;
                    const pct = risks.length > 0 ? (count / risks.length) * 100 : 0;
                    return (
                      <div key={r.level}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={r.textColor + ' font-medium'}>{r.label}</span>
                          <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full">
                          <div className={`h-2 rounded-full ${r.color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Performance Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tổng hành động AI', value: aiPerf.total, color: 'bg-blue-50 text-blue-700' },
              { label: 'Đã thực thi', value: aiPerf.executed, color: 'bg-green-50 text-green-700' },
              { label: 'Đã từ chối', value: aiPerf.rejected, color: 'bg-red-50 text-red-700' },
              { label: 'Đang chờ', value: aiPerf.pending, color: 'bg-amber-50 text-amber-700' },
            ].map(s => (
              <Card key={s.label}>
                <CardContent className={`pt-4 pb-4 text-center rounded-xl ${s.color}`}>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-xs mt-0.5">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Tỷ lệ thực thi AI: {aiPerf.rate}%</CardTitle></CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div className="h-4 bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all" style={{ width: `${aiPerf.rate}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0%</span>
                <span className="font-medium text-primary">{aiPerf.rate}% thực thi thành công</span>
                <span>100%</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'FULL_AUTO', count: aiLogs.filter(l => l.automation_level === 'FULL_AUTO').length, color: 'text-green-600' },
                  { label: 'NEEDS_REVIEW', count: aiLogs.filter(l => l.automation_level === 'NEEDS_REVIEW').length, color: 'text-amber-600' },
                  { label: 'NEEDS_APPROVAL', count: aiLogs.filter(l => l.automation_level === 'NEEDS_APPROVAL').length, color: 'text-red-600' },
                ].map(l => (
                  <div key={l.label} className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className={`text-xl font-bold ${l.color}`}>{l.count}</div>
                    <div className="text-xs text-muted-foreground">{l.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}