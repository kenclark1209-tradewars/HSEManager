import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileStack, ArrowRight, ShieldCheck } from 'lucide-react';
import SOP_TEMPLATES from '@/lib/sopTemplates';

export default function SOPTemplatePicker({ open, onClose, onPick, categories = [] }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Map category_code → display name
  const catName = (code) => {
    const c = categories.find(c => c.category_code === code);
    return c?.name_vi || c?.name_en || code;
  };

  const filtered = SOP_TEMPLATES.filter(t => {
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.iso_ref?.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) || catName(t.category).toLowerCase().includes(q);
  });

  const selected = SOP_TEMPLATES.find(t => t.id === selectedId);

  const handleApply = () => {
    if (!selected) return;
    // Sinh mã SOP gợi ý với suffix trống để user điền số
    const generated = {
      sop_code: `${selected.sop_code_prefix}-___`,
      category_code: selected.category,
      title: selected.title,
      purpose: selected.purpose,
      scope: selected.scope,
      version: '1.0',
      status: 'DRAFT',
      legal_refs: selected.legal_refs || [],
      steps: (selected.steps || []).map((s, i) => ({
        step_id: `step_${i + 1}`,
        ...s,
      })),
      related_forms: [],
      related_checklists: [],
      ai_generated: false,
    };
    onPick(generated);
    setSelectedId(null);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="w-5 h-5 text-primary" />
            Tạo SOP từ mẫu chuẩn ISO
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 px-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm theo tên, chuẩn ISO, hạng mục..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} mẫu</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto flex-1 px-1 pb-1">
          {filtered.map(tpl => {
            const active = tpl.id === selectedId;
            return (
              <button
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                className={`text-left p-4 rounded-xl border transition-all ${active ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary' : 'border-border hover:border-primary/40 hover:bg-muted/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl shrink-0">{tpl.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{tpl.title}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge variant="outline" className="text-xs font-mono">{tpl.iso_ref}</Badge>
                      <Badge variant="secondary" className="text-xs">{catName(tpl.category)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{tpl.purpose}</p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{tpl.steps?.length || 0} bước · {tpl.legal_refs?.length || 0} căn cứ pháp lý</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-10 text-muted-foreground">
              <p className="text-sm">Không tìm thấy mẫu phù hợp. Hãy thử từ khoá khác.</p>
            </div>
          )}
        </div>

        {/* Preview + Apply bar */}
        <div className="border-t pt-3 mt-1 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex-1 min-w-0">
            {selected ? (
              <span className="truncate">Đã chọn: <span className="font-semibold text-foreground">{selected.title}</span></span>
            ) : (
              <span>Chọn một mẫu để xem trước và áp dụng.</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => { onClose(); setSelectedId(null); }}>Huỷ</Button>
            <Button disabled={!selected} onClick={handleApply} className="gap-1.5">
              Áp dụng mẫu <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}