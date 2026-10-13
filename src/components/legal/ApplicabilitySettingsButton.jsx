import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import BusinessProfileDialog from './BusinessProfileDialog';

export default function ApplicabilitySettingsButton() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['business-profile'],
    queryFn: async () => {
      const list = await base44.entities.BusinessProfile.filter({ key: 'global' });
      return list[0] || null;
    },
  });

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (profile?.id) await base44.entities.BusinessProfile.update(profile.id, data);
      else await base44.entities.BusinessProfile.create({ key: 'global', ...data });
      qc.invalidateQueries({ queryKey: ['business-profile'] });
      setOpen(false);
      toast.success('Đã lưu phạm vi doanh nghiệp');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Settings2 className="w-4 h-4" /> Cài đặt Phạm vi Doanh nghiệp
      </Button>
      <BusinessProfileDialog open={open} onOpenChange={setOpen} profile={profile} onSave={handleSave} saving={saving} />
    </>
  );
}