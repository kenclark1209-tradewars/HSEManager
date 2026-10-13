import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatRiskScore } from '@/lib/hseUtils';

const LEVEL_COLOR = {
  extreme: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};
const LEVEL_LABEL = { extreme: 'Cực cao', high: 'Cao', medium: 'TB', low: 'Thấp' };

export default function HighRiskList({ risks = [] }) {
  const highRisks = risks
    .filter(r => ['high', 'extreme'].includes(r.risk_level) && r.status !== 'closed')
    .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">🔴 Rủi ro mức cao</CardTitle>
      </CardHeader>
      <CardContent>
        {highRisks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Không có rủi ro cao</p>
        ) : (
          <div className="space-y-2">
            {highRisks.map(r => (
              <Link key={r.id} to="/risks" className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{r.title}</p>
                  {r.risk_score && (
                    <p className="text-xs text-muted-foreground">Score: {formatRiskScore(r.risk_score)}</p>
                  )}
                </div>
                <Badge className={`text-xs shrink-0 ${LEVEL_COLOR[r.risk_level] || ''}`}>
                  {LEVEL_LABEL[r.risk_level] || r.risk_level}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}