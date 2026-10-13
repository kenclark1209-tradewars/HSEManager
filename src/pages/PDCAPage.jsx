import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Zap, ClipboardList, TrendingUp, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PDCACycleWheel, { PHASES } from '@/components/pdca/PDCACycleWheel';
import PDCAPhasePanel from '@/components/pdca/PDCAPhasePanel';
import PDCAExportPDF from '@/components/pdca/PDCAExportPDF';

function OverallStats({ records }) {
  const total = records.length;
  const completed = records.filter(r => ['completed', 'reviewed'].includes(r.status)).length;
  const inProgress = records.filter(r => r.status === 'in_progress').length;
  const overdue = records.filter(r =>
    r.due_date && new Date(r.due_date) < new Date() &&
    !['completed', 'reviewed'].includes(r.status)
  ).length;

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Tổng mục', value: total, color: 'text-foreground', bg: 'bg-muted/50' },
        { label: 'Đang thực hiện', value: inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Hoàn thành', value: completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Quá hạn', value: overdue, color: 'text-red-600', bg: 'bg-red-50' },
      ].map(item => (
        <div key={item.label} className={`rounded-xl p-3 ${item.bg} text-center`}>
          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function PDCAPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category_id') || '';
  const [activeTab, setActiveTab] = useState(searchParams.get('phase') || 'plan');

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (!e.ctrlKey) return;
      if (e.key === '1') { e.preventDefault(); setActiveTab('plan'); }
      if (e.key === '2') { e.preventDefault(); setActiveTab('do'); }
      if (e.key === '3') { e.preventDefault(); setActiveTab('check'); }
      if (e.key === '4') { e.preventDefault(); setActiveTab('act'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ['hse-categories'],
    queryFn: () => base44.entities.HSECategory.list('display_number', 100),
  });

  const category = categories.find(c => c.id === categoryId);

  // All records for stats
  const { data: allRecords = [] } = useQuery({
    queryKey: ['pdca-records', categoryId],
    queryFn: () => categoryId
      ? base44.entities.PDCARecord.filter({ hse_category_id: categoryId })
      : base44.entities.PDCARecord.list('-created_date', 500),
  });

  // Compute per-phase completion %
  const computeCompletions = () => {
    const result = {};
    for (const phase of PHASES) {
      const pRecs = allRecords.filter(r => r.phase === phase.key);
      if (!pRecs.length) { result[phase.key] = 0; continue; }
      const avg = pRecs.reduce((s, r) => s + (r.completion_percent || 0), 0) / pRecs.length;
      result[phase.key] = Math.round(avg);
    }
    return result;
  };

  const completions = computeCompletions();
  const currentPhase = PHASES.find(p => p.key === activeTab);

  const handleCategoryChange = (val) => {
    if (val === 'all') {
      setSearchParams(p => { p.delete('category_id'); return p; });
    } else {
      setSearchParams(p => { p.set('category_id', val); return p; });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Vòng lặp PDCA</h1>
            <p className="text-xs text-muted-foreground">Plan → Do → Check → Act · Ctrl+1/2/3/4 chuyển tab</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryId || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-56 text-xs h-8">
              <SelectValue placeholder="Chọn hạng mục HSE..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📋 Tất cả hạng mục</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.display_number ? `${String(c.display_number).padStart(2, '0')}. ` : ''}{c.name_vi || c.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PDCAExportPDF records={allRecords} category={category} allCategories={categories} />
          <Link to="/hse-categories">
            <Button variant="outline" size="sm" className="h-8 text-xs">Ma trận</Button>
          </Link>
        </div>
      </div>

      {/* Category badge */}
      {category && (
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <div>
            <p className="text-sm font-semibold">{category.name_vi || category.name_en}</p>
            {category.description && <p className="text-xs text-muted-foreground">{category.description}</p>}
          </div>
          <div className="ml-auto flex gap-2">
            {(category.primary_law_codes || []).slice(0, 2).map(code => (
              <Badge key={code} variant="outline" className="text-xs font-mono">{code}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* PDCA Cycle Wheel */}
      <PDCACycleWheel activePhase={activeTab} onSelect={setActiveTab} completions={completions} />

      {/* Overall stats */}
      <OverallStats records={allRecords} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          {PHASES.map(p => {
            const Icon = p.icon;
            const count = allRecords.filter(r => r.phase === p.key).length;
            return (
              <TabsTrigger key={p.key} value={p.key} className="gap-1.5 text-xs sm:text-sm">
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
                {count > 0 && <Badge variant="secondary" className="h-4 text-xs px-1 py-0 hidden sm:inline-flex">{count}</Badge>}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PHASES.map(phase => (
          <TabsContent key={phase.key} value={phase.key} className="mt-4">
            {/* Phase intro */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl border-l-4"
              style={{ borderLeftColor: phase.color, background: phase.light }}>
              <div>
                <p className="text-sm font-bold" style={{ color: phase.color }}>{phase.label} — {phase.desc}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {phase.key === 'plan' && 'Xác định mục tiêu, phân tích rủi ro, lập kế hoạch hành động dựa trên SOP & Checklist'}
                  {phase.key === 'do' && 'Triển khai kế hoạch, thực hiện SOP, ghi nhận dữ liệu và bằng chứng'}
                  {phase.key === 'check' && 'Đánh giá kết quả thực hiện, so sánh với mục tiêu, phân tích CAPA'}
                  {phase.key === 'act' && 'Chuẩn hóa quy trình thành công, xử lý vấn đề tồn đọng, khởi động vòng PDCA mới'}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold" style={{ color: phase.color }}>{completions[phase.key] || 0}%</p>
                <p className="text-xs text-muted-foreground">hoàn thành</p>
              </div>
            </div>

            <PDCAPhasePanel
              phase={phase}
              categoryId={categoryId}
              categoryName={category?.name_vi || category?.name_en || category?.category_code || ''}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}