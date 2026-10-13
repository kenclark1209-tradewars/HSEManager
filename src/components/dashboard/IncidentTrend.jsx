import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format, startOfDay } from 'date-fns';

export default function IncidentTrend({ incidents = [] }) {
  const data = useMemo(() => {
    const days = 14;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayStr = format(date, 'dd/MM');
      const count = incidents.filter(inc => {
        const d = inc.date_occurred || inc.created_date;
        return d && format(new Date(d), 'dd/MM/yyyy') === format(date, 'dd/MM/yyyy');
      }).length;
      return { date: dayStr, count };
    });
  }, [incidents]);

  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">📈 Xu hướng sự cố (14 ngày)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(v) => [v, 'Sự cố']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.count > 0 ? (d.count >= 2 ? '#ef4444' : '#f97316') : '#e2e8f0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}