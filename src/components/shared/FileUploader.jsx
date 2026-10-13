import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileIcon, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import { handleDocumentUpload } from '@/lib/hseEngine';

export default function FileUploader({ module, moduleId, attachments = [], onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Attachment.create({
      file_name: file.name,
      file_url,
      file_type: file.type,
      module,
      module_id: moduleId,
    });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    onUploadComplete?.();
    // Auto-trigger engine: document → risk + checklist + action
    console.log('[HSE-ENGINE][TRIGGER] Document uploaded → handleDocumentUpload:', file.name);
    handleDocumentUpload(file_url, file.name, moduleId, module).catch(err =>
      console.error('[HSE-ENGINE] handleDocumentUpload error:', err)
    );
  };

  const handleDelete = async (id) => {
    await base44.entities.Attachment.delete(id);
    onUploadComplete?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || !moduleId}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {t('upload_file')}
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      </div>
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
              <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">
                {att.file_name}
              </a>
              <button onClick={() => handleDelete(att.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}