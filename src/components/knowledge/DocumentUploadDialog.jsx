import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Loader2, FileText } from 'lucide-react';

const CATEGORIES = [
  { value: 'sop', label: 'SOP' },
  { value: 'regulation', label: 'Quy định' },
  { value: 'incident_report', label: 'Báo cáo sự cố' },
  { value: 'risk_assessment', label: 'Đánh giá rủi ro' },
  { value: 'training', label: 'Đào tạo' },
  { value: 'policy', label: 'Chính sách' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'other', label: 'Khác' },
];

export default function DocumentUploadDialog({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const [department, setDepartment] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'processing'

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async () => {
    if (!file || !title) return;
    setIsUploading(true);
    setStep('processing');

    // 1. Upload file
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // 2. Extract text + AI summary
    const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: 'object',
        properties: {
          extracted_text: { type: 'string' },
          summary: { type: 'string' },
          key_points: { type: 'array', items: { type: 'string' } },
          related_regulations: { type: 'array', items: { type: 'string' } },
          language: { type: 'string' },
        }
      }
    });

    const extracted = extractRes.status === 'success' ? extractRes.output : {};

    // 3. AI enrich nếu có text
    let aiEnrichment = {};
    if (extracted.extracted_text) {
      const aiRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Phân tích tài liệu HSE sau và trích xuất thông tin quan trọng:\n\nTITLE: ${title}\nCATEGORY: ${category}\n\nCONTENT:\n${extracted.extracted_text.slice(0, 3000)}\n\nHãy trả về JSON với:\n- summary: tóm tắt ngắn gọn (2-3 câu)\n- key_points: mảng 3-7 điểm chính quan trọng\n- related_regulations: các quy định/tiêu chuẩn liên quan (ISO, TCVN, Nghị định...)`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
            related_regulations: { type: 'array', items: { type: 'string' } },
          }
        }
      });
      aiEnrichment = aiRes || {};
    }

    // 4. Save to entity
    await base44.entities.HSEDocument.create({
      title,
      category,
      department,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      file_url,
      file_name: file.name,
      file_type: file.name.split('.').pop(),
      extracted_text: extracted.extracted_text || '',
      summary: aiEnrichment.summary || extracted.summary || '',
      key_points: aiEnrichment.key_points || extracted.key_points || [],
      related_regulations: aiEnrichment.related_regulations || extracted.related_regulations || [],
      language: extracted.language || 'vi',
      status: 'indexed',
      indexed_at: new Date().toISOString(),
      uploaded_by: (await base44.auth.me()).email,
      is_active: true,
    });

    setIsUploading(false);
    onSuccess();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tải lên tài liệu HSE</DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-4">
            {/* File picker */}
            <div>
              <Label>File tài liệu *</Label>
              <label className="mt-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
                <input type="file" className="hidden" accept=".pdf,.docx,.xlsx,.txt,.doc,.csv" onChange={handleFileChange} />
                {file ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Kéo thả hoặc click để chọn file</p>
                    <p className="text-xs mt-1">PDF, DOCX, XLSX, TXT</p>
                  </div>
                )}
              </label>
            </div>

            <div>
              <Label>Tiêu đề *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên tài liệu" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Loại tài liệu</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phòng ban</Label>
                <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="VD: Sản xuất" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Tags (phân cách bằng dấu phẩy)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="VD: an toàn, hóa chất, PPE" className="mt-1" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={onClose}>Hủy</Button>
              <Button onClick={handleSubmit} disabled={!file || !title}>
                <Upload className="w-4 h-4 mr-2" />
                Tải lên & Phân tích
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">Đang xử lý tài liệu...</p>
              <p className="text-sm text-muted-foreground mt-1">AI đang trích xuất nội dung và phân tích</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}