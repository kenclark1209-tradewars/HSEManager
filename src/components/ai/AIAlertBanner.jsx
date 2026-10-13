import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, Bot, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const SEV_STYLE = {
  critical: 'bg-red-50 border-red-300 text-red-900',
  high: 'bg-orange-50 border-orange-300 text-orange-900',
  medium: 'bg-amber-50 border-amber-200 text-amber-900',
  low: 'bg-blue-50 border-blue-200 text-blue-900',
};

const SEV_BADGE = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-blue-100 text-blue-800',
};

export default function AIAlertBanner() {
  const [expanded, setExpanded] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const qc = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ['ai-alerts'],
    queryFn: () => base44.entities.AIAlert.filter({ status: 'active' }),
    refetchInterval: 30000,
  });

  const ackMut = useMutation({
    mutationFn: id => base44.entities.AIAlert.update(id, { status: 'acknowledged' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-alerts'] }),
  });

  if (alerts.length === 0) return null;

  const topAlerts = alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] || 3) - (order[b.severity] || 3);
  });

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(c => !c)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 rounded-t-xl border font-medium text-sm",
          "bg-red-600 text-white border-red-700"
        )}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 animate-pulse" />
          <span>🤖 AI HSE Manager — {alerts.length} cảnh báo đang hoạt động</span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <div className="border border-t-0 border-red-200 rounded-b-xl bg-white divide-y divide-gray-100">
          {topAlerts.slice(0, 5).map(alert => (
            <div key={alert.id} className={cn("flex items-start gap-3 px-4 py-3", SEV_STYLE[alert.severity])}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{alert.title}</span>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", SEV_BADGE[alert.severity])}>
                    {alert.severity}
                  </span>
                  <span className="text-xs opacity-60">{alert.type}</span>
                </div>
                <p className="text-xs mt-0.5 opacity-80">{alert.message}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                onClick={() => ackMut.mutate(alert.id)}
                title="Đã biết"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {alerts.length > 5 && (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center">
              +{alerts.length - 5} cảnh báo khác — Xem đầy đủ tại trang AI Monitor
            </div>
          )}
        </div>
      )}
    </div>
  );
}