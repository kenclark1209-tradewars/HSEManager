import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function CategoryProgress() {
  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('-created_date', 50),
  });

  const { data: pdcaRecords = [] } = useQuery({
    queryKey: ['pdca-records'],
    queryFn: () => base44.entities.PDCARecord.list('-created_date', 500),
  });

  const { data: actions = [] } = useQuery({
    queryKey: ['actions'],
    queryFn: () => base44.entities.Action.list('-created_date', 200),
  });

  if (!categories.length) return null;

  const getCategoryProgress = (catId) => {
    const recs = pdcaRecords.filter(r => r.hse_category_id === catId);
    if (!recs.length) return 0;
    const avg = recs.reduce((s, r) => s + (r.completion_percent || 0), 0) / recs.length;
    return Math.round(avg);
  };

  const getOverdueCount = (catId) => {
    return actions.filter(a => {
      if (a.status === 'closed') return false;
      if (!a.due_date) return false;
      return new Date(a.due_date) < new Date();
    }).length;
  };

  const PHASE_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500'];
  const PHASES = ['plan', 'do', 'check', 'act'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">% Hoàn thành PDCA theo hạng mục</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.slice(0, 6).map((cat, i) => {
          const pct = getCategoryProgress(cat.id);
          const catRecords = pdcaRecords.filter(r => r.hse_category_id === cat.id);
          const phaseProgress = PHASES.map(phase => {
            const pr = catRecords.filter(r => r.phase === phase);
            if (!pr.length) return 0;
            return Math.round(pr.reduce((s, r) => s + (r.completion_percent || 0), 0) / pr.length);
          });

          return (
            <Link key={cat.id} to={`/pdca?category_id=${cat.id}`} className="block group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{cat.name}</span>
                  {cat.code && <span className="text-xs font-mono text-muted-foreground">{cat.code}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                </div>
              </div>
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-muted">
                {PHASES.map((phase, idx) => (
                  <div
                    key={phase}
                    className={`${PHASE_COLORS[idx]} transition-all`}
                    style={{ width: `${phaseProgress[idx] / 4}%` }}
                    title={`${phase.toUpperCase()}: ${phaseProgress[idx]}%`}
                  />
                ))}
                <div className="flex-1 bg-transparent" />
              </div>
              <div className="flex gap-3 mt-0.5">
                {PHASES.map((phase, idx) => (
                  <span key={phase} className="text-[10px] text-muted-foreground">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${PHASE_COLORS[idx]} mr-0.5`} />
                    {phase.toUpperCase()} {phaseProgress[idx]}%
                  </span>
                ))}
              </div>
            </Link>
          );
        })}

        {categories.length > 6 && (
          <Link to="/hse-categories" className="text-xs text-primary hover:underline block text-center mt-2">
            Xem tất cả {categories.length} hạng mục →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}