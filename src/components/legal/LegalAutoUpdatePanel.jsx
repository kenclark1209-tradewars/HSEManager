import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Upload, Sparkles, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

// ─── Schema: AI trả về danh sách văn bản HSSE mới ───────────────────
const AUTO_UPDATE_SCHEMA = {
  type: 'object',
  properties: {
    documents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          doc_code: { type: 'string', description: 'Mã ngắn, VD: ND-105-2025' },
          doc_type: { type: 'string', enum: ['LUAT', 'NGHI_DINH', 'THONG_TU', 'QUYET_DINH', 'QCVN', 'TCVN', 'TIEU_CHUAN_QT'] },
          doc_number: { type: 'string', description: 'Số hiệu đầy đủ, VD: 105/2025/NĐ-CP' },
          doc_name: { type: 'string' },
          issuing_body: { type: 'string' },
          issued_date: { type: 'string', description: 'YYYY-MM-DD nếu biết' },
          effective_date: { type: 'string', description: 'YYYY-MM-DD nếu biết' },
          official_url: { type: 'string' },
          summary: { type: 'string' },
          applicable_categories: { type: 'array', items: { type: 'string' } },
        },
        required: ['doc_code', 'doc_name', 'doc_type'],
      },
    },
    message: { type: 'string', description: 'Tóm tắt bằng Markdown về các thay đổi pháp lý mới' },
  },
  required: ['documents', 'message'],
};

const EXCEL_SCHEMA = {
  type: 'object',
  properties: {
    documents: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          doc_code: { type: 'string' },
          doc_type: { type: 'string' },
          doc_number: { type: 'string' },
          doc_name: { type: 'string' },
          issuing_body: { type: 'string' },
          issued_date: { type: 'string' },
          effective_date: { type: 'string' },
          official_url: { type: 'string' },
          summary: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  },
};

// ─── Chuẩn hoá loại văn bản từ text tiếng Việt ──────────────────────
function normalizeDocType(raw) {
  if (!raw) return 'NGHI_DINH';
  const s = String(raw).toUpperCase();
  const known = ['LUAT', 'NGHI_DINH', 'THONG_TU', 'QUYET_DINH', 'QCVN', 'TCVN', 'TIEU_CHUAN_QT'];
  if (known.includes(s)) return s;
  if (s.includes('LUẬT') || s.includes('LUAT')) return 'LUAT';
  if (s.includes('NGHỊ ĐỊNH') || s.includes('NGHI DINH')) return 'NGHI_DINH';
  if (s.includes('THÔNG TƯ') || s.includes('THONG TU')) return 'THONG_TU';
  if (s.includes('QUYẾT ĐỊNH') || s.includes('QUYET DINH')) return 'QUYET_DINH';
  if (s.includes('QCVN')) return 'QCVN';
  if (s.includes('TCVN')) return 'TCVN';
  if (s.includes('ISO') || s.includes('ILO') || s.includes('QUỐC TẾ')) return 'TIEU_CHUAN_QT';
  return 'NGHI_DINH';
}

function normalizeStatus(raw) {
  if (!raw) return 'HIEU_LUC';
  const s = String(raw).toUpperCase();
  if (s.includes('HẾT') || s.includes('HET') || s.includes('EXPIRED')) return 'HET_HIEU_LUC';
  if (s.includes('CHƯA') || s.includes('CHUA')) return 'CHUA_CO_HIEU_LUC';
  if (s.includes('ĐÌNH CHỈ') || s.includes('DINH CHI')) return 'TAM_DINH_CHI';
  return 'HIEU_LUC';
}

function toRecord(d) {
  return {
    doc_code: d.doc_code,
    doc_type: normalizeDocType(d.doc_type),
    doc_number: d.doc_number || '',
    doc_name: d.doc_name,
    issuing_body: d.issuing_body || '',
    issued_date: d.issued_date || '',
    effective_date: d.effective_date || '',
    status: normalizeStatus(d.status),
    official_url: d.official_url || '',
    summary: d.summary || '',
    applicable_categories: d.applicable_categories || [],
    country: 'VN',
    is_mandatory: d.is_mandatory !== false,
  };
}

export default function LegalAutoUpdatePanel({ docs = [], onUpdated }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const existingCodes = new Set(docs.map(d => d.doc_code));

  // ─── Lưu danh sách văn bản (tạo mới / cập nhật) + tạo cảnh báo ────
  const persistDocuments = async (rawDocs) => {
    let created = 0, updated = 0, skipped = 0;
    const current = new Map(docs.map(d => [d.doc_code, d]));

    for (const raw of rawDocs || []) {
      if (!raw?.doc_code || !raw?.doc_name) { skipped++; continue; }
      const record = toRecord(raw);
      const existing = current.get(record.doc_code);
      try {
        if (existing) {
          const changed = ['doc_name', 'doc_number', 'issuing_body', 'effective_date', 'official_url', 'summary', 'status']
            .some(k => (existing[k] || '') !== (record[k] || ''));
          if (changed) {
            await base44.entities.LegalDocument.update(existing.id, record);
            updated++;
          } else {
            skipped++;
          }
        } else {
          await base44.entities.LegalDocument.create(record);
          current.set(record.doc_code, record);
          created++;
          // Cảnh báo văn bản mới
          await base44.entities.LegalAlert.create({
            alert_type: 'NEW_LAW',
            doc_code_new: record.doc_code,
            change_summary: `Phát hiện văn bản pháp luật mới: ${record.doc_name}`,
            urgency: '30_DAYS',
            status: 'ACTIVE',
            official_url: record.official_url || '',
            action_required: 'Rà soát nội dung và cập nhật SOP/Checklist/Biểu mẫu liên quan',
            affected_categories: record.applicable_categories || [],
          });
        }
      } catch (e) {
        console.error('persist doc error', e);
        skipped++;
      }
    }
    return { created, updated, skipped };
  };

  // ─── 1. Tự động cập nhật bằng AI (web search) ─────────────────────
  const handleAutoUpdate = async () => {
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Bạn là chuyên gia pháp luật An toàn - Sức khoẻ - Môi trường (HSSE) Việt Nam.
Nhiệm vụ: TÌM KIẾM TRÊN INTERNET các văn bản pháp luật Việt Nam về ATVSLĐ / HSSE được ban hành hoặc cập nhật MỚI trong khoảng 12 tháng gần đây, đang có hiệu lực.
Bao gồm: Luật, Nghị định, Thông tư, Quyết định, QCVN, TCVN và tiêu chuẩn quốc tế (ISO, ILO) liên quan.
Với mỗi văn bản trả về: mã ngắn (doc_code), số hiệu đầy đủ, tên, cơ quan ban hành, ngày ban hành, ngày hiệu lực, link văn bản gốc (URL thật từ thuvienphapluat.vn / vanban.chinhphu.vn / luatvietnam.vn), tóm tắt 2-3 câu.
CHỈ liệt kê văn bản THẬT, không bịa số hiệu/ngày tháng. Bỏ trống trường nào không chắc.
Trường "message": báo cáo tổng hợp Markdown về các thay đổi pháp lý đáng chú ý và việc doanh nghiệp cần làm.`,
        response_json_schema: AUTO_UPDATE_SCHEMA,
        add_context_from_internet: true,
        model: 'gemini_3_1_pro',
      });

      const counts = await persistDocuments(res.documents);
      setResult({ ...counts, total: res.documents?.length || 0, message: res.message, mode: 'ai' });
      onUpdated?.();
    } catch (e) {
      setError(e.message || 'Không thể cập nhật tự động. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  // ─── 2. Cập nhật từ file Excel danh sách luật ─────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: EXCEL_SCHEMA,
      });
      if (extracted.status === 'error') throw new Error(extracted.details || 'Không đọc được nội dung file.');

      const out = extracted.output;
      const rows = Array.isArray(out) ? out : (out?.documents || []);
      if (!rows.length) throw new Error('File không chứa dữ liệu văn bản hợp lệ.');

      const counts = await persistDocuments(rows);
      setResult({ ...counts, total: rows.length, mode: 'excel' });
      onUpdated?.();
    } catch (e2) {
      setError(e2.message || 'Không thể đọc file. Vui lòng kiểm tra định dạng.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Cập nhật pháp luật HSSE</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tự động tìm luật, nghị định, thông tư mới qua AI — hoặc tải file Excel danh sách văn bản để cập nhật hàng loạt.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button size="sm" onClick={handleAutoUpdate} disabled={busy} className="gap-1.5">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {busy ? 'Đang cập nhật...' : 'Tự động Cập nhật'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busy} className="gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Tải file Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Kết quả */}
        {result && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {result.mode === 'ai' ? 'Cập nhật tự động hoàn tất' : 'Nhập từ Excel hoàn tất'}
            </div>
            <p>
              Đã quét <strong>{result.total}</strong> văn bản · Tạo mới <strong>{result.created}</strong> ·
              Cập nhật <strong>{result.updated}</strong> · Bỏ qua <strong>{result.skipped}</strong>
            </p>
            {result.created > 0 && <p className="text-emerald-700">Văn bản mới đã tạo cảnh báo pháp lý tại mục "Cảnh báo pháp lý".</p>}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>AI tìm từ internet có thể sai số hiệu/ngày — bạn nên kiểm tra lại trước khi áp dụng. File Excel cần cột: mã, tên, loại, số hiệu, cơ quan ban hành, ngày hiệu lực, link.</span>
        </div>
      </CardContent>
    </Card>
  );
}