import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Search, FileText, Trash2, RefreshCw, BookOpen, Tag, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import DocumentUploadDialog from '@/components/knowledge/DocumentUploadDialog';
import DocumentSearchPanel from '@/components/knowledge/DocumentSearchPanel';
import DocumentCard from '@/components/knowledge/DocumentCard';

const CATEGORY_LABELS = {
  sop: 'SOP', regulation: 'Quy định', incident_report: 'Báo cáo sự cố',
  risk_assessment: 'Đánh giá rủi ro', training: 'Đào tạo',
  policy: 'Chính sách', checklist: 'Checklist', other: 'Khác'
};

const STATUS_ICON = {
  processing: <Clock className="w-3 h-3 text-yellow-500" />,
  indexed: <CheckCircle className="w-3 h-3 text-green-500" />,
  failed: <AlertCircle className="w-3 h-3 text-red-500" />,
};

export default function AIKnowledgeBase() {
  const [showUpload, setShowUpload] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['hse-documents'],
    queryFn: () => base44.entities.HSEDocument.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HSEDocument.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hse-documents'] }),
  });

  const filtered = docs.filter(d => {
    const matchCat = filterCategory === 'all' || d.category === filterCategory;
    const matchQ = !searchQuery || 
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQ;
  });

  const stats = {
    total: docs.length,
    indexed: docs.filter(d => d.status === 'indexed').length,
    processing: docs.filter(d => d.status === 'processing').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kho tri thức HSE</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý và tìm kiếm tài liệu HSE thông minh</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Tải lên tài liệu
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary opacity-80" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Tổng tài liệu</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{stats.indexed}</div>
                <div className="text-xs text-muted-foreground">Đã lập chỉ mục</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-yellow-500 opacity-80" />
              <div>
                <div className="text-2xl font-bold">{stats.processing}</div>
                <div className="text-xs text-muted-foreground">Đang xử lý</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library"><FileText className="w-4 h-4 mr-2" />Thư viện</TabsTrigger>
          <TabsTrigger value="search"><Search className="w-4 h-4 mr-2" />Tìm kiếm thông minh</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Tìm tài liệu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <div className="flex flex-wrap gap-1">
              {['all', ...Object.keys(CATEGORY_LABELS)].map(cat => (
                <Badge
                  key={cat}
                  variant={filterCategory === cat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat === 'all' ? 'Tất cả' : CATEGORY_LABELS[cat]}
                </Badge>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có tài liệu nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={() => deleteMutation.mutate(doc.id)}
                  categoryLabel={CATEGORY_LABELS[doc.category] || doc.category}
                  statusIcon={STATUS_ICON[doc.status]}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search">
          <DocumentSearchPanel docs={docs.filter(d => d.status === 'indexed')} />
        </TabsContent>
      </Tabs>

      {showUpload && (
        <DocumentUploadDialog
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            qc.invalidateQueries({ queryKey: ['hse-documents'] });
          }}
        />
      )}
    </div>
  );
}