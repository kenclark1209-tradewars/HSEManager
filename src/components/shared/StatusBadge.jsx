import { t } from '@/lib/i18n';
import { statusColors, severityColors, priorityColors } from '@/lib/hseUtils';
import { cn } from '@/lib/utils';

export default function StatusBadge({ value, type = 'status' }) {
  const colorMap = type === 'severity' ? severityColors : type === 'priority' ? priorityColors : statusColors;
  const colorClass = colorMap[value] || 'bg-gray-100 text-gray-700';

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", colorClass)}>
      {t(value) || value}
    </span>
  );
}