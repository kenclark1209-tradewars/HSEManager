import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bot, Plus, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { getUserRole, can } from '@/lib/roleUtils';
import { format } from 'date-fns';

export default function ChecklistPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const qc = useQueryClient();
  const role = getUserRole();

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => base44.entities.Checklist.list('-created_date', 100),
  });

  const createMut = useMutation({
    mutationFn: d => {
      console.log('[DB INSERT] Checklist:', d);
      return base44.entities.Checklist.create(d);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklists'] }); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Checklist.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklists'] }); setShowForm(false); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.Checklist.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checklists'] }),
  });

  const toggleItem = async (checklist, itemIdx) => {
    const items = [...(checklist.items || [])];
    items[itemIdx] = { ...items[itemIdx], checked: !items[itemIdx].checked };
    const checked = items.filter(i => i.checked).length;
    const pct = Math.round((checked / items.length) * 100);
    await base44.entities.Checklist.update(checklist.id, { items, completion_percent: pct });
    qc.invalidateQueries({ queryKey: ['checklists'] });
  };

  const handleAICreate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const prompt = `Bạn là chuyên gia HSE. Tạo checklist kiểm tra an toàn cho: "${aiPrompt}"
Tạo 10-15 mục checklist cụ thể, thực tế theo tiêu chuẩn ISO 45001 và quy định Việt Nam.`;

      const schema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                checked: { type: 'boolean' },
                required: { type: 'boolean' }
              }
            }
          }
        }
      };

      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      console.log('[AI RESPONSE] Checklist:', res);

      const checklist = {
        title: res.title || aiPrompt,
        description: res.description || '',
        category: res.category || 'general',
        items: (res.items || []).map((item, i) => ({
          id: `item_${i}`,
          text: item.text,
          checked: false,
          required: item.required || false,
        })),
        status: 'active',
        ai_generated: true,
        completion_percent: 0,
      };

      await base44.entities.Checklist.create(checklist);
      console.log('[ACTION CREATED] Checklist:', checklist.title);
      qc.invalidateQueries({ queryKey: ['checklists'] });
      setAiPrompt('');
    } catch (err) {
      console.error('[AI ERROR]', err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Checklist An toàn" onAdd={() => { setEditing(null); setShowForm(true); }} addLabel="Tạo Checklist" />

      {/* AI Create */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-2 items-center">
            <Bot className="w-5 h-5 text-primary shrink-0" />
            <Input
              placeholder="AI tạo checklist: VD 'Checklist làm việc trên cao' hoặc 'Kiểm tra PCCC hàng tháng'..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAICreate()}
              className="flex-1"
            />
            <Button onClick={handleAICreate} disabled={aiLoading || !aiPrompt.trim()} className="gap-1.5 shrink-0">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              AI Tạo
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Chưa có checklist nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {checklists.map(cl => (
            <Card key={cl.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-semibold">{cl.title}</CardTitle>
                      {cl.ai_generated && <Badge variant="outline" className="text-xs gap-1"><Bot className="w-2.5 h-2.5" />AI</Badge>}
                    </div>
                    {cl.description && <p className="text-xs text-muted-foreground mt-0.5">{cl.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteMut.mutate(cl.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${cl.completion_percent || 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{cl.completion_percent || 0}%</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(cl.items || []).map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => toggleItem(cl, idx)}
                      className="flex items-start gap-2 w-full text-left hover:bg-muted/50 p-1.5 rounded transition-colors"
                    >
                      {item.checked
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        : <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
                      <span className={`text-xs flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.text}
                        {item.required && <span className="text-destructive ml-1">*</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tạo Checklist thủ công</DialogTitle></DialogHeader>
          <ManualChecklistForm onSubmit={d => createMut.mutate(d)} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ManualChecklistForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'general', items: [], status: 'active' });
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (!newItem.trim()) return;
    setForm(p => ({ ...p, items: [...p.items, { id: `item_${Date.now()}`, text: newItem, checked: false, required: false }] }));
    setNewItem('');
  };

  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, completion_percent: 0, ai_generated: false }); }} className="space-y-4">
      <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
      <div><Label>Mô tả</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
      <div>
        <Label>Mục checklist</Label>
        <div className="flex gap-2 mt-1">
          <Input placeholder="Thêm mục kiểm tra..." value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} />
          <Button type="button" size="icon" onClick={addItem}><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-1 mt-2 max-h-40 overflow-y-auto">
          {form.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-1.5 bg-muted/50 rounded text-xs">
              <span className="flex-1">{item.text}</span>
              <button type="button" onClick={() => removeItem(idx)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button><Button type="submit">Lưu</Button></div>
    </form>
  );
}