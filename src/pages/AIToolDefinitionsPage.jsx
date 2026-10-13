import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wrench, Plus, Pencil, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const LEVEL_COLORS = {
  FULL_AUTO: 'bg-green-100 text-green-800',
  NEEDS_REVIEW: 'bg-amber-100 text-amber-800',
  NEEDS_APPROVAL: 'bg-red-100 text-red-800',
};

const LEVEL_LABELS = {
  FULL_AUTO: 'Tự động hoàn toàn',
  NEEDS_REVIEW: 'Cần xem xét',
  NEEDS_APPROVAL: 'Cần phê duyệt',
};

function ToolForm({ tool, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!tool;
  const [form, setForm] = useState({
    tool_name: tool?.tool_name || '',
    display_name: tool?.display_name || '',
    description: tool?.description || '',
    automation_level: tool?.automation_level || 'NEEDS_REVIEW',
    is_active: tool?.is_active ?? true,
    input_schema: tool?.input_schema ? JSON.stringify(tool.input_schema, null, 2) : '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
    output_schema: tool?.output_schema ? JSON.stringify(tool.output_schema, null, 2) : '',
  });
  const [schemaError, setSchemaError] = useState('');

  const mut = useMutation({
    mutationFn: async (data) => {
      if (isEdit) return base44.entities.AIToolDefinition.update(tool.id, data);
      return base44.entities.AIToolDefinition.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-tool-defs'] }); onClose(); },
  });

  const handleSave = () => {
    setSchemaError('');
    let input_schema = null;
    let output_schema = null;
    try {
      if (form.input_schema?.trim()) input_schema = JSON.parse(form.input_schema);
    } catch {
      setSchemaError('Input Schema không phải JSON hợp lệ.');
      return;
    }
    try {
      if (form.output_schema?.trim()) output_schema = JSON.parse(form.output_schema);
    } catch {
      setSchemaError('Output Schema không phải JSON hợp lệ.');
      return;
    }
    mut.mutate({ ...form, input_schema, output_schema });
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Tên tool (tool_name) *</Label>
          <Input value={form.tool_name} onChange={e => set('tool_name', e.target.value)}
            placeholder="create_incident_report" className="mt-1" disabled={isEdit} />
        </div>
        <div>
          <Label className="text-xs">Tên hiển thị *</Label>
          <Input value={form.display_name} onChange={e => set('display_name', e.target.value)}
            placeholder="Tạo báo cáo sự cố" className="mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Mô tả</Label>
        <Textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={2} className="mt-1 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Mức độ tự động hóa *</Label>
          <Select value={form.automation_level} onValueChange={v => set('automation_level', v)}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_AUTO">Tự động hoàn toàn</SelectItem>
              <SelectItem value="NEEDS_REVIEW">Cần xem xét (HSE Officer)</SelectItem>
              <SelectItem value="NEEDS_APPROVAL">Cần phê duyệt (Manager)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
          <Label className="text-xs">Kích hoạt</Label>
        </div>
      </div>
      <div>
        <Label className="text-xs">Input Schema (JSON)</Label>
        <Textarea value={form.input_schema} onChange={e => set('input_schema', e.target.value)}
          rows={6} className="mt-1 text-xs font-mono" />
      </div>
      <div>
        <Label className="text-xs">Output Schema (JSON, tùy chọn)</Label>
        <Textarea value={form.output_schema} onChange={e => set('output_schema', e.target.value)}
          rows={4} className="mt-1 text-xs font-mono" />
      </div>
      {schemaError && <p className="text-xs text-destructive">{schemaError}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} disabled={mut.isPending}>
          {mut.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </div>
  );
}

function ToolCard({ tool, onEdit, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={!tool.is_active ? 'opacity-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{tool.display_name}</span>
              <Badge className={`text-xs ${LEVEL_COLORS[tool.automation_level]}`}>
                {LEVEL_LABELS[tool.automation_level]}
              </Badge>
              {tool.is_active
                ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Hoạt động</span>
                : <span className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="w-3 h-3" />Tắt</span>}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{tool.tool_name}</p>
            {tool.description && <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(tool)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(tool)}>
              <Switch checked={tool.is_active} className="scale-75" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(tool.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {expanded && tool.input_schema && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-semibold mb-1">Input Schema:</p>
            <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-40">
              {JSON.stringify(tool.input_schema, null, 2)}
            </pre>
            {tool.output_schema && <>
              <p className="text-xs font-semibold mt-2 mb-1">Output Schema:</p>
              <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-40">
                {JSON.stringify(tool.output_schema, null, 2)}
              </pre>
            </>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AIToolDefinitionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['ai-tool-defs'],
    queryFn: () => base44.entities.AIToolDefinition.list('-created_date', 50),
  });

  const deleteMut = useMutation({
    mutationFn: id => base44.entities.AIToolDefinition.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-tool-defs'] }),
  });

  const toggleMut = useMutation({
    mutationFn: tool => base44.entities.AIToolDefinition.update(tool.id, { is_active: !tool.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-tool-defs'] }),
  });

  const activeCount = tools.filter(t => t.is_active).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Wrench className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Tool Definitions</h1>
            <p className="text-xs text-muted-foreground">{activeCount}/{tools.length} tool đang kích hoạt</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm Tool
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tự động hoàn toàn', key: 'FULL_AUTO', color: 'bg-green-50 text-green-700' },
          { label: 'Cần xem xét', key: 'NEEDS_REVIEW', color: 'bg-amber-50 text-amber-700' },
          { label: 'Cần phê duyệt', key: 'NEEDS_APPROVAL', color: 'bg-red-50 text-red-700' },
        ].map(s => (
          <Card key={s.key}>
            <CardContent className={`p-3 text-center rounded-xl ${s.color}`}>
              <p className="text-2xl font-bold">{tools.filter(t => t.automation_level === s.key && t.is_active).length}</p>
              <p className="text-xs">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tool List */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Đang tải...</div>
      ) : tools.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
          Chưa có tool nào. Nhấn "Thêm Tool" để bắt đầu.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {tools.map(tool => (
            <ToolCard key={tool.id} tool={tool}
              onEdit={t => { setEditing(t); setShowForm(true); }}
              onDelete={id => deleteMut.mutate(id)}
              onToggle={t => toggleMut.mutate(t)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Chỉnh sửa Tool' : 'Thêm Tool mới'}</DialogTitle>
          </DialogHeader>
          <ToolForm tool={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}