import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function PageHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {onAdd && (
        <Button onClick={onAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          {addLabel || t('create')}
        </Button>
      )}
    </div>
  );
}