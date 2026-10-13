import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { ExternalLink, Loader2 } from 'lucide-react';

export default function EvidencePreviewDialog({ open, onOpenChange, fileUri, fileName }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (open && fileUri) {
      setLoading(true);
      setUrl('');
      base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 600 })
        .then(res => { if (active) setUrl(res?.signed_url || ''); })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [open, fileUri]);

  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(fileName || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{fileName || 'Bằng chứng tuân thủ'}</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : url ? (
          <div className="space-y-3">
            {isImage ? (
              <img src={url} alt={fileName} className="w-full rounded-lg border" />
            ) : (
              <iframe src={url} title={fileName} className="w-full h-[70vh] rounded-lg border" />
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(url, '_blank')}>
              <ExternalLink className="w-4 h-4" /> Mở trong tab mới
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">Không thể tải bằng chứng.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}