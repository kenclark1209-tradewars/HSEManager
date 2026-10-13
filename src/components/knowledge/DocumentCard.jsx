import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, ChevronDown, ChevronUp, ExternalLink, Tag } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentCard({ doc, onDelete, categoryLabel, statusIcon }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight line-clamp-2">{doc.title}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {statusIcon}
                  {doc.status === 'indexed' ? 'Đã lập chỉ mục' : doc.status === 'processing' ? 'Đang xử lý' : 'Lỗi'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {doc.file_url && (
              <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                <a href={doc.file_url} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {doc.summary && (
          <p className="text-xs text-muted-foreground line-clamp-3">{doc.summary}</p>
        )}

        {doc.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                <Tag className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        )}

        {doc.key_points?.length > 0 && (
          <div>
            <button
              className="flex items-center gap-1 text-xs text-primary font-medium"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {doc.key_points.length} điểm chính
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1">
                {doc.key_points.map((kp, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {doc.related_regulations?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.related_regulations.slice(0, 3).map((reg, i) => (
              <Badge key={i} variant="outline" className="text-xs">{reg}</Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {doc.department && <span>{doc.department} · </span>}
          {doc.created_date && format(new Date(doc.created_date), 'dd/MM/yyyy')}
        </p>
      </CardContent>
    </Card>
  );
}