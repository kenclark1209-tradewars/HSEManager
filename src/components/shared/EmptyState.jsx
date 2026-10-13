import { t } from '@/lib/i18n';
import { Inbox } from 'lucide-react';

export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Inbox className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm">{message || t('no_data')}</p>
    </div>
  );
}