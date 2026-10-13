import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Scale, Pencil, Trash2, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const OBLIGATION_CONFIG = {
  MANDATORY: { label: 'Bắt buộc', color: 'bg-red-100 text-red-700' },
  CONDITIONAL: { label: 'Có điều kiện', color: 'bg-amber-100 text-amber-700' },
  RECOMMENDED: { label: 'Khuyến nghị', color: 'bg-blue-100 text-blue-700' },
};

function ClauseCard({ clause, onEdit, onDelete }) {
  const ob = OBLIGATION_CONFIG[clause.obligation_type] || OBLIGATION_CONFIG.MANDATORY;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs text-primary font-semibold">{clause.clause_code || `${clause.doc_code}/${clause.article_number}`}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ob.color}`}>{ob.label}</span>
              {clause.frequency && <span className="text-xs bg-muted px-2 py-0.5 rounded">🕐 {clause.frequency}</span>}
            </div>
            <p className="font-semibold text-sm">{clause.clause_title || `${clause.article_number}${clause.clause_number ? ` ${clause.clause_number}` : ''}`}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{clause.obligation_summary || clause.clause_content}</p>
            {clause.evidence_required && (
              <p className="text-xs text-blue-700 mt-1">📄 Hồ sơ cần lưu: {clause.evidence_required}</p>
            )}
            {clause.penalty_reference && (
              <p className="text-xs text-red-600 mt-1">⚠ Xử phạt: {clause.penalty_reference}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(clause)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(clause.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClauseForm({ initial = {}, docs = [], onSubmit, onCancel }) {
  const [form, setForm] = useState({
    clause_code: '', doc_id: '', doc_code: '', article_number: '', clause_number: '', point: '',
    clause_title: '', clause_content: '', obligation_type: 'MANDATORY',
    obligation_summary: '', frequency: '', evidence_required: '', penalty_reference: '',
    applicable_to: [], tags: [], ...initial,
    applicable_to: initial.applicable_to?.join(', ') || '',
    tags: initial.tags?.join(', ') || '',
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectedDoc = docs.find(d => d.id === form.doc_id);

  return (
    <form onSubmit={e => {
      e.preventDefault();
      onSubmit({
        ...form,
        doc_code: selectedDoc?.doc_code || form.doc_code,
        applicable_to: form.applicable_to.split(',').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      });
    }} className="space-y-3">
      <div><Label>Văn bản pháp luật *</Label>
        <Select value={form.doc_id} onValueChange={v => { const d = docs.find(x => x.id === v); upd('doc_id', v); if(d) upd('doc_code', d.doc_code); }}>
          <SelectTrigger><SelectValue placeholder="Chọn văn bản" /></SelectTrigger>
          <SelectContent>{docs.filter(d => d.status === 'HIEU_LUC').map(d => <SelectItem key={d.id} value={d.id}>{d.doc_number} — {d.doc_name?.substring(0,50)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Điều *</Label><Input value={form.article_number} onChange={e => upd('article_number', e.target.value)} required placeholder="VD: Điều 14" /></div>
        <div><Label>Khoản</Label><Input value={form.clause_number} onChange={e => upd('clause_number', e.target.value)} placeholder="VD: Khoản 2" /></div>
        <div><Label>Điểm</Label><Input value={form.point} onChange={e => upd('point', e.target.value)} placeholder="VD: a" /></div>
      </div>
      <div><Label>Tiêu đề điều khoản</Label><Input value={form.clause_title} onChange={e => upd('clause_title', e.target.value)} /></div>
      <div><Label>Nội dung điều khoản *</Label><Textarea rows={3} value={form.clause_content} onChange={e => upd('clause_content', e.target.value)} required /></div>
      <div><Label>Tóm tắt nghĩa vụ (ngôn ngữ đơn giản)</Label><Textarea rows={2} value={form.obligation_summary} onChange={e => upd('obligation_summary', e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Loại nghĩa vụ</Label>
          <Select value={form.obligation_type} onValueChange={v => upd('obligation_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(OBLIGATION_CONFIG).map(([v,c]) => <SelectItem key={v} value={v}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Tần suất</Label><Input value={form.frequency} onChange={e => upd('frequency', e.target.value)} placeholder="VD: 6 tháng/lần" /></div>
      </div>
      <div><Label>Hồ sơ/bằng chứng cần lưu</Label><Input value={form.evidence_required} onChange={e => upd('evidence_required', e.target.value)} placeholder="VD: Biên bản kiểm tra, ảnh chụp" /></div>
      <div><Label>Tham chiếu điều khoản xử phạt</Label><Input value={form.penalty_reference} onChange={e => upd('penalty_reference', e.target.value)} placeholder="VD: Điều 15, NĐ 106/2025" /></div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button>
        <Button type="submit">Lưu Điều Khoản</Button>
      </div>
    </form>
  );
}

function AIExtractPanel({ docs, onExtracted }) {
  const [docId, setDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState([]);

  const extract = async () => {
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    setLoading(true);
    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Trích xuất các điều khoản quan trọng nhất từ văn bản pháp luật sau đây để xây dựng hệ thống tuân thủ HSE.
      
Văn bản: ${doc.doc_number} — ${doc.doc_name}
Tóm tắt: ${doc.summary || 'Không có tóm tắt'}

Trích xuất 5-10 điều khoản quan trọng nhất, mỗi điều khoản cần có:
- article_number: điều (VD: "Điều 14")
- clause_number: khoản (VD: "Khoản 2") nếu có
- clause_title: tiêu đề ngắn gọn
- clause_content: nội dung trích dẫn
- obligation_type: MANDATORY/CONDITIONAL/RECOMMENDED
- obligation_summary: tóm tắt nghĩa vụ bằng ngôn ngữ đơn giản cho HSE officer
- frequency: tần suất thực hiện nếu có (VD: "Hàng năm", "6 tháng/lần")
- evidence_required: hồ sơ cần lưu
- penalty_reference: tham chiếu điều khoản xử phạt nếu có`,
      response_json_schema: {
        type: 'object',
        properties: {
          clauses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                article_number: { type: 'string' },
                clause_number: { type: 'string' },
                clause_title: { type: 'string' },
                clause_content: { type: 'string' },
                obligation_type: { type: 'string' },
                obligation_summary: { type: 'string' },
                frequency: { type: 'string' },
                evidence_required: { type: 'string' },
                penalty_reference: { type: 'string' },
              }
            }
          }
        }
      },
      model: 'claude_sonnet_4_6',
    });
    setResult(data.clauses || []);
    setLoading(false);
  };

  const importAll = async () => {
    const doc = docs.find(d => d.id === docId);
    if (!doc || !result.length) return;
    await onExtracted(result.map(c => ({ ...c, doc_id: docId, doc_code: doc.doc_code, clause_code: `LC-${doc.doc_code}-${c.article_number.replace(/\s+/g,'')}` })));
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-purple-900">
          <Sparkles className="w-4 h-4" /> AI Trích xuất điều khoản từ văn bản pháp luật
        </div>
        <p className="text-xs text-purple-700">Chọn văn bản — AI sẽ tự động phân tích và trích xuất các điều khoản quan trọng nhất cho HSE.</p>
        <div className="flex gap-3">
          <Select value={docId} onValueChange={setDocId}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Chọn văn bản pháp luật" /></SelectTrigger>
            <SelectContent>{docs.filter(d => d.status === 'HIEU_LUC').map(d => <SelectItem key={d.id} value={d.id}>{d.doc_number} — {d.doc_name?.substring(0,40)}</SelectItem>)}</SelectContent>
          </Select>
          <Button type="button" onClick={extract} disabled={!docId || loading} className="bg-purple-600 hover:bg-purple-700 text-white shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Đang phân tích...' : 'Trích xuất'}
          </Button>
        </div>
        {result.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-700">✓ Tìm thấy {result.length} điều khoản</p>
              <Button size="sm" onClick={importAll} className="h-7 text-xs">Import tất cả ({result.length})</Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {result.map((c, i) => (
                <div key={i} className="bg-white rounded p-2 text-xs border">
                  <p className="font-semibold">{c.article_number} {c.clause_number} — {c.clause_title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2">{c.obligation_summary}</p>
                  {c.frequency && <p className="text-blue-600 mt-0.5">🕐 {c.frequency}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LegalClausePage() {
  const [search, setSearch] = useState('');
  const [filterDoc, setFilterDoc] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const qc = useQueryClient();

  const { data: clauses = [], isLoading } = useQuery({
    queryKey: ['legal-clauses'],
    queryFn: () => base44.entities.LegalClause.list('-created_date', 200),
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['legal-docs-all'],
    queryFn: () => base44.entities.LegalDocument.list('-effective_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const createMut = useMutation({ mutationFn: d => base44.entities.LegalClause.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal-clauses'] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }) => base44.entities.LegalClause.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal-clauses'] }); setShowForm(false); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: id => base44.entities.LegalClause.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal-clauses'] }); setDeleteId(null); } });

  const bulkCreate = async (clauseList) => {
    await Promise.all(clauseList.map(c => base44.entities.LegalClause.create(c)));
    qc.invalidateQueries({ queryKey: ['legal-clauses'] });
  };

  const filtered = clauses.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.clause_title?.toLowerCase().includes(q) || c.clause_content?.toLowerCase().includes(q) || c.doc_code?.toLowerCase().includes(q);
    const matchDoc = filterDoc === 'all' || c.doc_code === filterDoc;
    return matchSearch && matchDoc;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Điều Khoản Pháp Luật</h1>
          <p className="text-sm text-muted-foreground mt-1">Chi tiết nghĩa vụ từng điều khoản — nền tảng cho Legal Refs trong SOP/Checklist/Form</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Điều Khoản
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Danh sách ({clauses.length})</TabsTrigger>
          <TabsTrigger value="ai-extract">🤖 AI Trích xuất</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Tìm điều khoản..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterDoc} onValueChange={setFilterDoc}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Văn bản pháp luật" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả văn bản</SelectItem>
                {docs.filter(d => d.status === 'HIEU_LUC').map(d => <SelectItem key={d.id} value={d.doc_code}>{d.doc_code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => (
                <ClauseCard key={c.id} clause={c} onEdit={cl => { setEditing(cl); setShowForm(true); }} onDelete={setDeleteId} />
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Chưa có điều khoản. Dùng tab "AI Trích xuất" để tạo nhanh.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-extract" className="mt-4">
          <AIExtractPanel docs={docs} onExtracted={bulkCreate} />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Chỉnh sửa' : 'Thêm'} Điều Khoản</DialogTitle></DialogHeader>
          <ClauseForm initial={editing || {}} docs={docs} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMut.mutate(deleteId)} />
    </div>
  );
}