import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Zap, Shield, Clock } from 'lucide-react';
import { isOverdue } from '@/lib/hseUtils';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import AIAlertBanner from '@/components/ai/AIAlertBanner';
import CategoryProgress from '@/components/dashboard/CategoryProgress';
import RoleSwitcher from '@/components/shared/RoleSwitcher';
import IncidentTrend from '@/components/dashboard/IncidentTrend';
import HighRiskList from '@/components/dashboard/HighRiskList';

function StatCard({ title, value, icon: Icon, color, href }) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => base44.entities.Incident.list('-created_date', 100),
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.list('-created_date', 100),
  });

  const { data: risks = [] } = useQuery({
    queryKey: ['risks'],
    queryFn: () => base44.entities.Risk.list('-created_date', 100),
  });

  const openIncidents = incidents.filter(i => i.status !== 'closed');
  const overdueActions = actions.filter(a => a.status !== 'closed' && isOverdue(a.due_date));
  const upcomingActions = actions
    .filter(a => a.status !== 'closed' && a.due_date && !isOverdue(a.due_date))
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h1>
        <RoleSwitcher />
      </div>
      <AIAlertBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('open_incidents')} value={openIncidents.length} icon={AlertTriangle} color="bg-red-100 text-red-600" href="/incidents" />
        <StatCard title={t('overdue_actions')} value={overdueActions.length} icon={Clock} color="bg-amber-100 text-amber-600" href="/actions" />
        <StatCard title={t('upcoming_tasks')} value={upcomingActions.length} icon={Zap} color="bg-blue-100 text-blue-600" href="/actions" />
        <StatCard title={t('total_risks')} value={risks.length} icon={Shield} color="bg-purple-100 text-purple-600" href="/risks" />
      </div>

      <CategoryProgress />

      {/* Incident Trend + High Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <IncidentTrend incidents={incidents} />
        <HighRiskList risks={risks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('open_incidents')}</CardTitle>
          </CardHeader>
          <CardContent>
            {openIncidents.length === 0 ? <EmptyState /> : (
              <div className="space-y-3">
                {openIncidents.slice(0, 5).map(inc => (
                  <Link key={inc.id} to={`/incidents/${inc.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{inc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{inc.location} · {inc.date_occurred && !isNaN(new Date(inc.date_occurred)) && format(new Date(inc.date_occurred), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-3">
                      <StatusBadge value={inc.severity} type="severity" />
                      <StatusBadge value={inc.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('overdue_actions')}</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueActions.length === 0 ? <EmptyState /> : (
              <div className="space-y-3">
                {overdueActions.slice(0, 5).map(act => (
                  <Link key={act.id} to={`/actions/${act.id}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{act.title}</p>
                      <p className="text-xs text-destructive mt-0.5">{t('due_date')}: {act.due_date && !isNaN(new Date(act.due_date)) && format(new Date(act.due_date), 'dd/MM/yyyy')}</p>
                    </div>
                    <StatusBadge value={act.priority} type="priority" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}