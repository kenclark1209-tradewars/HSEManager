import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import LegalRefBadge from './LegalRefBadge';

/**
 * AI Generator Panel — dùng InvokeLLM để tạo SOP/Checklist/Form có legal_refs
 * Props:
 *   type: 'SOP' | 'CHECKLIST' | 'FORM'
 *   onResult(data): callback nhận kết quả để parent có thể điền vào form
 */
export default function AIGeneratorPanel({ type = 'SOP', onResult }) {
  const [categoryCode, setCategoryCode] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const { data: legalDocs = [] } = useQuery({
    queryKey: ['legal-docs-all'],
    queryFn: () => base44.entities.LegalDocument.list('-effective_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const selectedCategory = categories.find(c => c.category_code === categoryCode);

  const getRelevantLaws = () => {
    if (!selectedCategory) return [];
    const codes = [...(selectedCategory.primary_law_codes || []), ...(selectedCategory.secondary_law_codes || [])];
    return legalDocs.filter(d => codes.includes(d.doc_code) && d.status === 'HIEU_LUC');
  };

  const buildPrompt = () => {
    const laws = getRelevantLaws();
    const lawsText = laws.map(d => `- ${d.doc_number}: ${d.doc_name}. Tóm tắt: ${d.summary || 'N/A'}`).join('\n');

    if (type === 'SOP') {
      return `Bạn là chuyên gia HSE Việt Nam. Tạo một SOP (Standard Operating Procedure) chi tiết cho hạng mục: "${selectedCategory?.name_vi || categoryCode}".

Các văn bản pháp luật hiện hành áp dụng:
${lawsText}

Thông tin bổ sung từ người dùng: ${context || 'Không có'}

Tạo SOP với đầy đủ:
1. Mã SOP (format SOP-[CATEGORY]-001)
2. Tiêu đề
3. Mục đích
4. Phạm vi áp dụng
5. Các bước thực hiện (5-8 bước), mỗi bước có:
   - step_number, step_title, instruction (chi tiết), responsible_role
   - legal_refs: mảng [{doc_code, article_number, note}] tham chiếu điều khoản cụ thể
   - warning (nếu có rủi ro)
   - evidence_required (bằng chứng cần lưu)
6. legal_refs ở cấp SOP: mảng tham chiếu văn bản pháp luật chính`;
    }

    if (type === 'CHECKLIST') {
      return `Bạn là chuyên gia HSE Việt Nam. Tạo một Checklist kiểm tra chi tiết cho hạng mục: "${selectedCategory?.name_vi || categoryCode}".

Các văn bản pháp luật hiện hành áp dụng:
${lawsText}

Thông tin bổ sung: ${context || 'Không có'}

Tạo Checklist với:
1. Mã checklist (format CL-[CATEGORY]-[FREQ]-01)
2. Tên checklist (tiếng Việt và Anh)
3. Tần suất phù hợp (DAILY/WEEKLY/MONTHLY/QUARTERLY)
4. legal_refs ở cấp checklist
5. Các mục kiểm tra (8-15 items), mỗi mục có:
   - item_id, section (nhóm), question (English), question_vi (Tiếng Việt)
   - answer_type: PASS_FAIL hoặc YES_NO hoặc NUMERIC hoặc PHOTO_REQUIRED
   - is_critical: true nếu vi phạm dừng sản xuất
   - legal_refs: [{doc_code, article_number, note}]
   - consequence_if_fail: hậu quả nếu không đạt`;
    }

    return `Tạo HSE Form cho hạng mục: "${selectedCategory?.name_vi || categoryCode}" với các văn bản pháp luật: ${lawsText}. Context: ${context}`;
  };

  const getSchema = () => {
    if (type === 'SOP') return {
      type: 'object',
      properties: {
        sop_code: { type: 'string' },
        title: { type: 'string' },
        purpose: { type: 'string' },
        scope: { type: 'string' },
        legal_refs: { type: 'array', items: { type: 'object', properties: { doc_code: { type: 'string' }, article_number: { type: 'string' }, relevance: { type: 'string' }, note: { type: 'string' } } } },
        steps: { type: 'array', items: { type: 'object', properties: { step_number: { type: 'number' }, step_title: { type: 'string' }, instruction: { type: 'string' }, responsible_role: { type: 'string' }, legal_refs: { type: 'array', items: { type: 'object' } }, warning: { type: 'string' }, evidence_required: { type: 'string' } } } }
      }
    };
    if (type === 'CHECKLIST') return {
      type: 'object',
      properties: {
        checklist_code: { type: 'string' },
        name: { type: 'string' },
        name_vi: { type: 'string' },
        frequency: { type: 'string' },
        legal_refs: { type: 'array', items: { type: 'object' } },
        items: { type: 'array', items: { type: 'object', properties: { item_id: { type: 'string' }, section: { type: 'string' }, question: { type: 'string' }, question_vi: { type: 'string' }, answer_type: { type: 'string' }, is_critical: { type: 'boolean' }, legal_refs: { type: 'array', items: { type: 'object' } }, consequence_if_fail: { type: 'string' } } } }
      }
    };
    return { type: 'object', properties: { form_code: { type: 'string' }, form_name: { type: 'string' }, fields: { type: 'array', items: { type: 'object' } } } };
  };

  const generate = async () => {
    if (!categoryCode) return;
    setLoading(true);
    setResult(null);
    const data = await base44.integrations.Core.InvokeLLM({
      prompt: buildPrompt(),
      response_json_schema: getSchema(),
      model: 'claude_sonnet_4_6',
    });
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="border rounded-xl bg-purple-50/50 border-purple-200">
      <button
        className="flex items-center justify-between w-full p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-sm text-purple-900">AI Generator — Tạo {type} tự động có căn cứ pháp lý</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-purple-500" /> : <ChevronRight className="w-4 h-4 text-purple-500" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-xs">Hạng mục HSE *</Label>
            <Select value={categoryCode} onValueChange={setCategoryCode}>
              <SelectTrigger><SelectValue placeholder="Chọn hạng mục để AI biết luật áp dụng" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.category_code}>
                    #{String(c.display_number).padStart(2,'0')} {c.name_vi || c.name_en}
                    {c.has_pending_law_update && ' ⚠'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="text-xs text-purple-700 bg-purple-100 rounded p-2">
              <p className="font-semibold mb-1">Luật áp dụng sẽ được nhúng vào {type}:</p>
              <div className="flex flex-wrap gap-1">
                {getRelevantLaws().map(d => (
                  <LegalRefBadge key={d.doc_code} docCode={d.doc_code} compact />
                ))}
              </div>
              {selectedCategory.has_pending_law_update && (
                <p className="text-amber-700 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {selectedCategory.pending_update_description}
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="text-xs">Thông tin bổ sung (tùy chọn)</Label>
            <Textarea
              rows={2}
              placeholder="VD: Nhà máy sản xuất hóa chất, 200 công nhân, có khu vực bồn chứa..."
              value={context}
              onChange={e => setContext(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={generate}
              disabled={loading || !categoryCode}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</> : <><Sparkles className="w-4 h-4 mr-2" />Tạo với AI</>}
            </Button>
            {result && onResult && (
              <Button type="button" variant="outline" onClick={() => onResult({ ...result, category_code: categoryCode, ai_generated: true })}>
                Dùng kết quả này →
              </Button>
            )}
          </div>

          {result && (
            <div className="bg-white rounded-lg border p-3 text-xs space-y-2 max-h-64 overflow-y-auto">
              <p className="font-semibold text-emerald-700">✓ AI đã tạo xong — xem trước:</p>
              {type === 'SOP' && (
                <>
                  <p><span className="font-medium">Mã:</span> {result.sop_code}</p>
                  <p><span className="font-medium">Tiêu đề:</span> {result.title}</p>
                  <p><span className="font-medium">Số bước:</span> {result.steps?.length}</p>
                  <p><span className="font-medium">Căn cứ pháp lý:</span> {result.legal_refs?.map(r => r.doc_code).join(', ')}</p>
                </>
              )}
              {type === 'CHECKLIST' && (
                <>
                  <p><span className="font-medium">Mã:</span> {result.checklist_code}</p>
                  <p><span className="font-medium">Tên:</span> {result.name_vi}</p>
                  <p><span className="font-medium">Số mục:</span> {result.items?.length}</p>
                  <p><span className="font-medium">Mục critical:</span> {result.items?.filter(i => i.is_critical).length}</p>
                </>
              )}
              <pre className="text-[10px] text-muted-foreground bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}