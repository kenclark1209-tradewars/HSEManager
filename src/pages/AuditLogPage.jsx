import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Shield, Search, RefreshCw, Bot, User, Filter, AlertTriangle, Info, Zap } from 'lucide-react';

const ACTION_LABELS = {
  create: 'Tạo mới', update: 'Cập nhật', delete: 'Xóa',
  approve: 'Phê duyệt', reject: 'Từ chối', execute: 'Thực thi',
  login: 'Đăng nhập', export: 'Xuất báo cáo', ai_action: 'AI hành động',
};

const MODULE_LABELS = {
  incident: 'Sự cố', action: 'Hành động', risk: 'Rủi ro',
  sop: 'SOP', regulation: 'Quy định', compliance: 'Tuân thủ',
  inspection: 'Kiểm tra', budget: 'Ngân sách', ai_queue: 'AI Queue',
  knowledge: 'Kho tri thức', user: 'Người dùng', settings: 'Cài đặt',
};

const SEVERITY_STYLE = {
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
};

const ACTION_COLOR = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-green-100 text-green-700',
  reject: 'bg-red-100 text-red-700',
  execute: 'bg-purple-100 text-purple-700',
  ai_action: 'bg-indigo-100 text-indigo-700',
  login: 'bg-gray-100 text-gray-700',
  export: 'bg-amber-100 text-amber-700',
};

function LogItem({ log }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = (log.old_value && Object.keys(log.old_value).length > 0) ||
    (log.new_value && Object.keys(log.new_value).length > 0);

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${log.is_ai_action ? 'bg-indigo-100' : 'bg-gray-100'}`}>
          {log.is_ai_action ? <Bot className="w-3.5 h-3.5 text-indigo-600" /> : <User className="w-3.5 h-3.5 text-gray-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-xs ${ACTION_COLOR[log.action_type] || 'bg-gray-100 text-gray-700'}`}>
              {ACTION_LABELS[log.action_type] || log.action_type}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {MODULE_LABELS[log.module] || log.module}
            </Badge>
            {log.severity !== 'info' && (
              <Badge className={`text-xs ${SEVERITY_STYLE[log.severity]}`}>
                {log.severity === 'warning' ? '⚠️ Cảnh báo' : '🔴 Nghiêm trọng'}
              </Badge>
            )}
          </div>
          <p className="text-sm mt-1">{log.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span>👤 {log.performed_by}</span>
            {log.entity_name && <span>📄 {log.entity_name}</span>}
            {log.created_date && <span>🕐 {format(new Date(log.created_date), 'HH:mm dd/MM/yyyy')}</span>}
          </div>
          {hasDetails && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-primary mt-1 hover:underline"
            >
              {expanded ? 'Ẩn chi tiết ▲' : 'Xem chi tiết ▼'}
            </button>
          )}
          {expanded && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {log.old_value && Object.keys(log.old_value).length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1 text-red-600">Trước:</p>
                  <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-24">{JSON.stringify(log.old_value, null, 2)}</pre>
                </div>
              )}
              {log.new_value && Object.keys(log.new_value).length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1 text-green-600">Sau:</p>
                  <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-24">{JSON.stringify(log.new_value, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterType, setFilterType] = useState('all'); // all | human | ai

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const filtered = logs.filter(log => {
    const matchSearch = !search || log.description?.includes(search) || log.performed_by?.includes(search) || log.entity_name?.includes(search);
    const matchModule = filterModule === 'all' || log.module === filterModule;
    const matchAction = filterAction === 'all' || log.action_type === filterAction;
    const matchType = filterType === 'all' || (filterType === 'ai' ? log.is_ai_action : !log.is_ai_action);
    return matchSearch && matchModule && matchAction && matchType;
  });

  const stats = {
    total: logs.length,
    ai: logs.filter(l => l.is_ai_action).length,
    warnings: logs.filter(l => l.severity === 'warning' || l.severity === 'critical').length,
    today: logs.filter(l => {
      if (!l.created_date) return false;
      const d = new Date(l.created_date);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Nhật ký kiểm toán</h1>
            <p className="text-xs text-muted-foreground">Theo dõi toàn bộ hoạt động hệ thống</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng log', value: stats.total, icon: Info, color: 'text-blue-600 bg-blue-50' },
          { label: 'Hôm nay', value: stats.today, icon: Zap, color: 'text-green-600 bg-green-50' },
          { label: 'Hành động AI', value: stats.ai, icon: Bot, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Cảnh báo', value: stats.warnings, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-xs w-48 pl-8"
          />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Module" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả module</SelectItem>
            {Object.entries(MODULE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Hành động" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {[['all', 'Tất cả'], ['human', '👤 Người dùng'], ['ai', '🤖 AI']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilterType(v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${filterType === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      {isLoading ? (
        <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Chưa có log nào.
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-2">
            {filtered.map(log => <LogItem key={log.id} log={log} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}