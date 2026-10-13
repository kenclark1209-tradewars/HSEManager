import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Scale, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function LegalRefPopoverContent({ docCode, articleNumber, clauseCode, note }) {
  const { data: docs = [] } = useQuery({
    queryKey: ['legal-docs-all'],
    queryFn: () => base44.entities.LegalDocument.list('-effective_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const doc = docs.find(d => d.doc_code === docCode);
  if (!doc) return <div className="p-3 text-sm text-muted-foreground">Đang tải...</div>;

  const isExpired = doc.status === 'HET_HIEU_LUC';
  const isSuspended = doc.status === 'TAM_DINH_CHI';
  const isInternational = doc.country === 'INTERNATIONAL';

  return (
    <div className="w-80 space-y-3">
      <div className={cn('p-3 rounded-lg border', isExpired || isSuspended ? 'bg-red-50 border-red-200' : isInternational ? 'bg-purple-50 border-purple-200' : 'bg-emerald-50 border-emerald-200')}>
        {(isExpired || isSuspended) && (
          <div className="flex items-center gap-2 text-red-700 text-xs font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isExpired ? 'VĂN BẢN ĐÃ HẾT HIỆU LỰC' : 'VĂN BẢN TẠM ĐÌNH CHỈ'} — CẦN CẬP NHẬT
          </div>
        )}
        <p className="text-xs font-bold text-foreground">{doc.doc_number}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{doc.doc_name}</p>
        <p className="text-xs text-muted-foreground mt-1">Cơ quan ban hành: <span className="font-medium">{doc.issuing_body}</span></p>
        {articleNumber && <p className="text-xs text-foreground mt-2 font-medium">📌 {articleNumber}</p>}
        {note && <p className="text-xs text-muted-foreground mt-1 italic">{note}</p>}
        {doc.replaced_by_doc && (
          <p className="text-xs text-amber-700 mt-2">→ Thay thế bởi: <span className="font-semibold">{doc.replaced_by_doc}</span></p>
        )}
      </div>
      {doc.summary && <p className="text-xs text-muted-foreground px-1">{doc.summary}</p>}
      {doc.official_url && (
        <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => window.open(doc.official_url, '_blank')}>
          <ExternalLink className="w-3 h-3 mr-1" /> Xem văn bản gốc
        </Button>
      )}
    </div>
  );
}

export default function LegalRefBadge({ docCode, articleNumber, clauseCode, note, compact = false }) {
  const { data: docs = [] } = useQuery({
    queryKey: ['legal-docs-all'],
    queryFn: () => base44.entities.LegalDocument.list('-effective_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const doc = docs.find(d => d.doc_code === docCode);

  const getBadgeStyle = () => {
    if (!doc) return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200';
    if (doc.status === 'HET_HIEU_LUC' || doc.status === 'TAM_DINH_CHI')
      return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200';
    if (doc.country === 'INTERNATIONAL')
      return 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200';
    // Check expiring soon (within 6 months)
    if (doc.expiry_date) {
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      if (new Date(doc.expiry_date) < sixMonths)
        return 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200';
    }
    return 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200';
  };

  const label = compact
    ? `⚖ ${docCode.replace('ND-', 'NĐ').replace('-', '/').substring(0, 12)}`
    : `⚖ ${docCode.replace('ND-', 'NĐ')}${articleNumber ? ` ${articleNumber}` : ''}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border cursor-pointer font-mono transition-colors',
          getBadgeStyle()
        )}>
          {doc?.status === 'HET_HIEU_LUC' && <AlertTriangle className="w-3 h-3" />}
          {label}
        </span>
      </PopoverTrigger>
      <PopoverContent side="top" className="p-3" align="start">
        <LegalRefPopoverContent
          docCode={docCode}
          articleNumber={articleNumber}
          clauseCode={clauseCode}
          note={note}
        />
      </PopoverContent>
    </Popover>
  );
}