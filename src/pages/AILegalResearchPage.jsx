import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Search, BookOpen, Scale, Sparkles, CheckCircle2, AlertTriangle, ListChecks, ExternalLink, FileText, Save, Gavel } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format, addDays } from 'date-fns';
import { HSE_EXPERT_SYSTEM_PROMPT, LEGAL_RESEARCH_SCHEMA, LEGAL_RESEARCH_SYSTEM_PROMPT } from '@/lib/hsePrompts';

const PRESET_TOPICS = [
  { icon: '🏗️', label: 'ATVSLĐ trong xây dựng', value: 'An toàn vệ sinh lao động trong hoạt động xây dựng: quy định về giàn giáo, làm việc trên cao, điện thi công, PPE, huấn luyện' },
  { icon: '🔥', label: 'Phòng cháy chữa cháy', value: 'Phòng cháy chữa cháy tại nhà xưởng: trang thiết bị PCCC, lối thoát hiểm, diễn tập, kiểm tra định kỳ theo Nghị định 105/2025 và QCVN 06' },
  { icon: '⚗️', label: 'Quản lý hóa chất', value: 'An toàn trong lưu trữ, sử dụng, vận chuyển hóa chất nguy hại: MSDS, kho hóa chất, phân loại GHS, chất thải nguy hại theo QCVN 07' },
  { icon: '⚡', label: 'An toàn điện', value: 'An toàn điện trong nhà máy: kiểm định hệ thống, làm việc điện, LOTO, huấn luyện người làm điện theo QCVN 22' },
  { icon: '🦺', label: 'Trang bị PPE', value: 'Quản lý trang bị bảo vệ cá nhân: đánh giá rủi ro, cấp phát, đào tạo, thay thế theo Luật 84/2015 và Nghị định 39/2016' },
  { icon: '🧪', label: 'Môi trường lao động', value: 'Quan trắc môi trường lao động: chỉ tiêu, tần suất, đơn vị đo, hồ sơ theo Thông tư 24/2023 và QCVN 01-2022/BYT' },
  { icon: '📚', label: 'Huấn luyện ATVSLĐ', value: 'Huấn luyện an toàn vệ sinh lao động: 6 nhóm đối tượng, nội dung, chu kỳ, chứng chỉ theo Thông tư 07/2016/TT-BLĐTBXH' },
  { icon: '🏭', label: 'ATVSLĐ tổng quát', value: 'Tổng quan nghĩa vụ ATVSLĐ của doanh nghiệp 50+ lao động: quản lý rủi ro, tự đánh giá, báo cáo cơ quan quản lý' },
];

const TYPE_LABELS = {
  LUAT: 'Luật', NGHI_DINH: 'Nghị định', THONG_TU: 'Thông tư',
  QUYET_DINH: 'Quyết định', QCVN: 'QCVN', TCVN: 'TCVN', TIEU_CHUAN_QT: 'TC Quốc tế',
};

const PRIORITY_COLOR = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function AILegalResearchPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importedDocs, setImportedDocs] = useState(0);
  const [importedActions, setImportedActions] = useState(0);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const qc = useQueryClient();

  const { data: existingDocs = [] } = useQuery({
    queryKey: ['legal-docs-all'],
    queryFn: () => base44.entities.LegalDocument.list('-effective_date', 200),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const handleResearch = async (topicText) => {
    const q = (topicText ?? topic).trim();
    if (!q) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setImportedDocs(0);
    setImportedActions(0);
    if (topicText) setTopic(topicText);

    try {
      const prompt = `${LEGAL_RESEARCH_SYSTEM_PROMPT}

NHIỆM VỤ NGHIÊN CỨU CỤ THỂ:
${q}

YÊU CẦU:
1. Tìm kiếm trên internet các văn bản pháp luật Việt Nam đang hiệu lực liên quan đến chủ đề trên
2. Phân tích nghĩa vụ pháp lý mà doanh nghiệp phải thực hiện
3. Đề xuất kế hoạch hành động cụ thể (SMART)
4. Liệt kê các bước triển khai thực tế theo thứ tự ưu tiên
5. Nêu rõ rủi ro pháp lý và chế tài xử phạt nếu không tuân thủ

Trả về JSON theo schema. Trường "message" là báo cáo tổng hợp bằng Markdown (có tiêu đề, bảng, bullet points) để hiển thị cho người dùng.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${HSE_EXPERT_SYSTEM_PROMPT}\n\n${prompt}`,
        response_json_schema: LEGAL_RESEARCH_SCHEMA,
        add_context_from_internet: true,
        model: 'gemini_3_1_pro',
      });

      setResult(response);
    } catch (err) {
      setError(err.message || 'Không thể thực hiện nghiên cứu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Import to entities ─────────────────────────────────────────
  const handleImport = async () => {
    if (!result) return;
    setImporting(true);
    setShowImportDialog(false);

    let docsCount = 0;
    let actionsCount = 0;

    try {
      // Import documents — skip duplicates by doc_code
      const existingCodes = new Set(existingDocs.map(d => d.doc_code));
      for (const doc of (result.documents || [])) {
        if (!doc.doc_code || existingCodes.has(doc.doc_code)) continue;
        try {
          await base44.entities.LegalDocument.create({
            doc_code: doc.doc_code,
            doc_type: doc.doc_type || 'NGHI_DINH',
            doc_number: doc.doc_number || '',
            doc_name: doc.doc_name,
            issuing_body: doc.issuing_body || '',
            effective_date: doc.effective_date || '',
            status: 'HIEU_LUC',
            official_url: doc.official_url || '',
            summary: doc.summary || '',
            applicable_categories: doc.applicable_categories || [],
            country: 'VN',
            is_mandatory: doc.is_mandatory !== false,
          });
          docsCount++;
          existingCodes.add(doc.doc_code);
        } catch (e) { console.error('doc import err', e); }
      }

      // Import actions
      const today = new Date();
      for (const a of (result.action_plan || [])) {
        if (!a.title) continue;
        try {
          await base44.entities.Action.create({
            title: a.title,
            description: a.description || (a.related_doc ? `Căn cứ: ${a.related_doc}` : ''),
            type: a.type || 'preventive',
            priority: a.priority || 'medium',
            status: 'open',
            due_date: a.due_days ? format(addDays(today, a.due_days), 'yyyy-MM-dd') : format(addDays(today, 30), 'yyyy-MM-dd'),
          });
          actionsCount++;
        } catch (e) { console.error('action import err', e); }
      }

      qc.invalidateQueries({ queryKey: ['legal-docs-all'] });
      qc.invalidateQueries({ queryKey: ['actions'] });
      setImportedDocs(docsCount);
      setImportedActions(actionsCount);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Gavel className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            Nghiên cứu Pháp luật AI
            <Badge variant="secondary" className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Web Search</Badge>
          </h1>
          <p className="text-xs text-muted-foreground">AI tự tìm luật, nghị định, thông tư, QCVN liên quan ATVSLĐ — phân tích nghĩa vụ & đề xuất hành động</p>
        </div>
      </div>

      {/* Search box */}
      <Card>
        <CardContent className="p-5">
          <Label className="text-sm font-medium">Chủ đề cần nghiên cứu</Label>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="VD: ATVSLĐ trong xây dựng nhà cao tầng, quản lý hóa chất công nghiệp..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResearch()}
                disabled={loading}
              />
            </div>
            <Button onClick={() => handleResearch()} disabled={loading || !topic.trim()} className="gap-1.5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Đang tìm...' : 'Nghiên cứu'}
            </Button>
          </div>

          {/* Preset topics */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Chủ đề gợi ý:</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleResearch(p.value)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 bg-muted hover:bg-accent border border-transparent hover:border-primary/20 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-amber-600 mt-3 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            AI có thể tìm được link và số hiệu văn bản từ internet, nhưng bạn nên kiểm tra lại tính chính xác trước khi áp dụng pháp lý.
          </p>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI đang tìm kiếm văn bản pháp luật trên internet...</p>
            <p className="text-xs text-muted-foreground">Có thể mất 30-60 giây để thu thập và phân tích.</p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Không thể nghiên cứu</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Import banner */}
          {importedDocs > 0 || importedActions > 0 ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Đã nhập vào hệ thống: <strong>{importedDocs}</strong> văn bản pháp luật, <strong>{importedActions}</strong> hành động.
            </div>
          ) : null}

          {/* Action bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{result.documents?.length || 0}</span> văn bản ·{' '}
              <span className="font-semibold text-foreground">{result.key_obligations?.length || 0}</span> nghĩa vụ ·{' '}
              <span className="font-semibold text-foreground">{result.action_plan?.length || 0}</span> hành động
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowImportDialog(true)}
              disabled={importing || (!result.documents?.length && !result.action_plan?.length)}
              className="gap-1.5"
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {importing ? 'Đang nhập...' : 'Nhập vào hệ thống'}
            </Button>
          </div>

          {/* Topic summary */}
          {result.topic_summary && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed">{result.topic_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {result.documents?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Văn bản pháp luật liên quan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {result.documents.map((doc, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-primary">{doc.doc_code}</span>
                        <Badge variant="secondary" className="text-xs">{TYPE_LABELS[doc.doc_type] || doc.doc_type}</Badge>
                        {doc.is_mandatory !== false && <Badge variant="outline" className="text-xs">Bắt buộc</Badge>}
                      </div>
                      <p className="text-sm font-medium leading-tight">{doc.doc_name}</p>
                      {(doc.doc_number || doc.issuing_body) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.doc_number}{doc.doc_number && doc.issuing_body ? ' — ' : ''}{doc.issuing_body}
                          {doc.effective_date && ` · Hiệu lực ${format(new Date(doc.effective_date), 'dd/MM/yyyy')}`}
                        </p>
                      )}
                      {doc.summary && <p className="text-xs text-muted-foreground mt-1.5">{doc.summary}</p>}
                      {doc.applicable_categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.applicable_categories.map(c => {
                            const cat = categories.find(x => x.category_code === c);
                            return (
                              <span key={c} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                {cat?.name_vi || cat?.name_en || c}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {doc.official_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => window.open(doc.official_url, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key obligations */}
          {result.key_obligations?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  Nghĩa vụ pháp lý & công việc cần làm
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {result.key_obligations.map((ob, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{ob.title}</p>
                        {ob.description && <p className="text-xs text-muted-foreground mt-1">{ob.description}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {ob.frequency && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Tần suất: </span>
                              <span className="font-medium">{ob.frequency}</span>
                            </div>
                          )}
                          {ob.related_doc && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Căn cứ: </span>
                              <span className="font-mono font-medium text-primary">{ob.related_doc}</span>
                            </div>
                          )}
                        </div>
                        {ob.evidence_required && (
                          <p className="text-xs mt-1.5"><span className="text-muted-foreground">Bằng chứng: </span>{ob.evidence_required}</p>
                        )}
                        {ob.action_required && (
                          <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs">
                            <span className="font-semibold text-primary">Hành động: </span>{ob.action_required}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action plan */}
          {result.action_plan?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  Kế hoạch hành động SMART
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {result.action_plan.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <Badge className={`text-xs ${PRIORITY_COLOR[a.priority] || PRIORITY_COLOR.medium}`}>{a.priority}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{a.type === 'corrective' ? 'Khắc phục' : a.type === 'preventive' ? 'Phòng ngừa' : 'Cải tiến'}</Badge>
                        {a.due_days && <span>⏱ {a.due_days} ngày</span>}
                        {a.related_doc && <span className="font-mono">📎 {a.related_doc}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation steps */}
          {result.implementation_steps?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Các bước triển khai thực tế
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ol className="space-y-2">
                  {result.implementation_steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="flex-1">{s}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {result.risks_and_penalties && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  Rủi ro pháp lý & chế tài
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.risks_and_penalties}</p>
              </CardContent>
            </Card>
          )}

          {/* Full report */}
          {result.message && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Báo cáo tổng hợp</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_table]:text-xs [&_th]:font-semibold [&_td]:py-1">
                  {result.message}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Import confirmation dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              Nhập dữ liệu vào hệ thống
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">Sẽ nhập vào hệ thống:</p>
              <p className="text-xs text-muted-foreground">• <strong>{result?.documents?.filter(d => !existingDocs.some(x => x.doc_code === d.doc_code)).length || 0}</strong> văn bản pháp luật mới (bỏ qua trùng mã)</p>
              <p className="text-xs text-muted-foreground">• <strong>{result?.action_plan?.length || 0}</strong> hành động vào hệ thống Action</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Văn bản sẽ lưu vào <strong>Kho Văn Bản Pháp Luật</strong>, hành động vào <strong>Actions</strong>. Bạn có thể chỉnh sửa sau khi nhập.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>Huỷ</Button>
              <Button onClick={handleImport} className="gap-1.5">
                <Save className="w-4 h-4" /> Nhập ngay
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}