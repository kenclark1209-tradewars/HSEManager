import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CheckCircle, XCircle, Clock, Zap, ChevronDown, ChevronUp,
  ListChecks, RefreshCw, Filter
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXECUTED: 'bg-green-100 text-green-800',
  FAILED: 'bg-gray-100 text-gray-700',
};

const LEVEL_STYLE = {
  FULL_AUTO: 'bg-green-100 text-green-700',
  NEEDS_REVIEW: 'bg-amber-100 text-amber-700',
  NEEDS_APPROVAL: 'bg-red-100 text-red-700',
};

const STATUS_LABEL = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  EXECUTED: 'Đã thực thi',
  FAILED: 'Thất bại',
};

function QueueItem({ item, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  const isPending = item.status === 'PENDING';

  return (
    <Card className={`border-l-4 ${isPending ? 'border-l-amber-400' : item.status === 'APPROVED' || item.status === 'EXECUTED' ? 'border-l-green-400' : 'border-l-red-400'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{item.display_name || item.tool_name}</span>
              <Badge className={`text-xs ${STATUS_STYLE[item.status]}`}>{STATUS_LABEL[item.status]}</Badge>
              <Badge className={`text-xs ${LEVEL_STYLE[item.automation_level]}`}>{item.automation_level}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mã: <span className="font-mono">{item.action_id}</span> · {item.created_date && format(new Date(item.created_date), 'HH:mm dd/MM/yyyy')} · Yêu cầu bởi: {item.requested_by}
            </p>
            {item.ai_reasoning && (
              <p className="text-xs text-muted-foreground mt-1 italic">💡 {item.ai_reasoning}</p>
            )}
            {item.review_note && (
              <p className="text-xs text-muted-foreground mt-1">📝 Ghi chú: {item.review_note}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
            {isPending && (
              <>
                <Button size="sm" className="h-7 gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2"
                  onClick={() => onApprove(item)}>
                  <CheckCircle className="w-3.5 h-3.5" /> Phê duyệt
                </Button>
                <Button size="sm" variant="destructive" className="h-7 gap-1 text-xs px-2"
                  onClick={() => setShowReject(s => !s)}>
                  <XCircle className="w-3.5 h-3.5" /> Từ chối
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Reject note input */}
        {showReject && isPending && (
          <div className="mt-3 flex gap-2">
            <Textarea
              placeholder="Ghi chú lý do từ chối..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={2}
              className="text-sm flex-1"
            />
            <Button size="sm" variant="destructive" onClick={() => {
              onReject(item, rejectNote);
              setShowReject(false);
            }}>Xác nhận</Button>
          </div>
        )}

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {item.input_data && Object.keys(item.input_data).length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Dữ liệu đầu vào:</p>
                <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                  {JSON.stringify(item.input_data, null, 2)}
                </pre>
              </div>
            )}
            {item.context_data && Object.keys(item.context_data).length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Ngữ cảnh:</p>
                <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                  {JSON.stringify(item.context_data, null, 2)}
                </pre>
              </div>
            )}
            {item.proposed_output && Object.keys(item.proposed_output).length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1">Kết quả đề xuất:</p>
                <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32">
                  {JSON.stringify(item.proposed_output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AIReviewQueuePage() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [filterTool, setFilterTool] = useState('all');
  const [search, setSearch] = useState('');

  const { data: queue = [], isLoading, refetch } = useQuery({
    queryKey: ['ai-action-queue'],
    queryFn: () => base44.entities.AIActionQueue.list('-created_date', 100),
    refetchInterval: 15000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AIActionQueue.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-action-queue'] });
      qc.invalidateQueries({ queryKey: ['ai-alerts-all'] });
    },
  });

  const handleApprove = async (item) => {
    updateMut.mutate({
      id: item.id,
      data: {
        status: 'EXECUTED',
        reviewed_at: new Date().toISOString(),
        executed_at: new Date().toISOString(),
      }
    });
  };

  const handleReject = async (item, note) => {
    updateMut.mutate({
      id: item.id,
      data: {
        status: 'REJECTED',
        review_note: note,
        reviewed_at: new Date().toISOString(),
      }
    });
  };

  // Unique tool names for filter
  const toolNames = [...new Set(queue.map(q => q.tool_name))];

  const filtered = queue.filter(item => {
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchTool = filterTool === 'all' || item.tool_name === filterTool;
    const matchSearch = !search || item.tool_name?.includes(search) || item.ai_reasoning?.includes(search) || item.action_id?.includes(search);
    return matchStatus && matchTool && matchSearch;
  });

  const pendingCount = queue.filter(q => q.status === 'PENDING').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Hàng đợi duyệt AI
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">Xem xét và phê duyệt các hành động AI đề xuất</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Chờ duyệt', status: 'PENDING', color: 'text-amber-600 bg-amber-50' },
          { label: 'Đã thực thi', status: 'EXECUTED', color: 'text-green-600 bg-green-50' },
          { label: 'Đã từ chối', status: 'REJECTED', color: 'text-red-600 bg-red-50' },
          { label: 'Tổng cộng', status: 'all', color: 'text-blue-600 bg-blue-50' },
        ].map(s => (
          <button key={s.status} onClick={() => setFilterStatus(s.status)}
            className={`rounded-xl p-3 text-center transition-all border-2 ${filterStatus === s.status ? 'border-primary' : 'border-transparent'} ${s.color}`}>
            <p className="text-2xl font-bold">
              {s.status === 'all' ? queue.length : queue.filter(q => q.status === s.status).length}
            </p>
            <p className="text-xs">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
            <SelectItem value="EXECUTED">Đã thực thi</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTool} onValueChange={setFilterTool}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tool</SelectItem>
            {toolNames.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-xs w-48"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
          {filterStatus === 'PENDING' ? 'Không có hành động nào đang chờ duyệt.' : 'Không có kết quả.'}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <QueueItem key={item.id} item={item}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}