import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings2, CheckCircle, Info } from 'lucide-react';
import { AI_PROVIDERS, getAIConfig, saveAIConfig } from '@/lib/aiConfig';

export default function AIConfigPanel({ onClose }) {
  const [config, setConfig] = useState(getAIConfig());
  const [saved, setSaved] = useState(false);
  const upd = (k, v) => setConfig(p => ({ ...p, [k]: v }));

  const provider = AI_PROVIDERS.find(p => p.id === config.provider) || AI_PROVIDERS[0];

  const handleSave = () => {
    saveAIConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="w-4 h-4 text-primary" />
          Cấu hình AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider */}
        <div>
          <Label className="text-xs font-semibold mb-1.5 block">Nhà cung cấp AI</Label>
          <div className="grid grid-cols-1 gap-2">
            {AI_PROVIDERS.map(p => (
              <label key={p.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${config.provider === p.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <input type="radio" className="mt-1 accent-primary" checked={config.provider === p.id} onChange={() => { upd('provider', p.id); upd('model', p.models[0]); }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{p.label}</span>
                    {p.id === 'base44' && <Badge variant="secondary" className="text-xs">Khuyến nghị</Badge>}
                    {p.id === 'openrouter' && <Badge className="text-xs bg-purple-100 text-purple-800">Linh hoạt</Badge>}
                    {p.id === 'local' && <Badge className="text-xs bg-green-100 text-green-800">Bảo mật cao</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Model selection */}
        {provider.models.length > 1 && (
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Mô hình AI</Label>
            <Select value={config.model} onValueChange={v => upd('model', v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {provider.models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* API Key for OpenRouter */}
        {provider.requiresKey && (
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">{provider.keyLabel}</Label>
            <Input
              type="password"
              value={config.apiKey}
              onChange={e => upd('apiKey', e.target.value)}
              placeholder={provider.keyPlaceholder}
              className="h-9 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lấy API key tại <a href="https://openrouter.ai/keys" target="_blank" className="text-primary underline">openrouter.ai/keys</a>
            </p>
          </div>
        )}

        {/* Endpoint for local */}
        {provider.requiresEndpoint && (
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Ollama Endpoint</Label>
            <Input
              value={config.endpoint}
              onChange={e => upd('endpoint', e.target.value)}
              placeholder={provider.endpointPlaceholder}
              className="h-9 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cài Ollama: <a href="https://ollama.ai" target="_blank" className="text-primary underline">ollama.ai</a> — chạy: <code className="bg-muted px-1 rounded text-xs">ollama run llama3.2</code>
            </p>
          </div>
        )}

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-semibold">Độ sáng tạo (Temperature)</Label>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{config.temperature}</span>
          </div>
          <Slider
            min={0} max={1} step={0.1}
            value={[config.temperature]}
            onValueChange={([v]) => upd('temperature', v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Chính xác (0)</span>
            <span>Sáng tạo (1)</span>
          </div>
        </div>

        {/* Note for local */}
        {config.provider === 'local' && (
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Chế độ Local sử dụng Base44 AI để gọi thay (CORS limitations). Cài đặt endpoint để hiển thị tên mô hình.</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {onClose && <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1">Đóng</Button>}
          <Button size="sm" onClick={handleSave} className="flex-1 gap-2">
            {saved ? <><CheckCircle className="w-4 h-4" />Đã lưu!</> : 'Lưu cấu hình'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}