import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, FileText, Lightbulb, BookOpen } from 'lucide-react';

export default function DocumentSearchPanel({ docs }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');

  const handleSearch = async () => {
    if (!query.trim() || docs.length === 0) return;
    setIsSearching(true);
    setResults(null);
    setAiAnswer('');

    // Simple keyword-based relevance ranking on extracted_text + summary + key_points
    const scored = docs
      .map(doc => {
        const text = [doc.title, doc.summary, doc.extracted_text, ...(doc.key_points || []), ...(doc.tags || [])]
          .join(' ').toLowerCase();
        const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
        const score = queryWords.reduce((s, w) => s + (text.split(w).length - 1), 0);
        return { doc, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setResults(scored);

    // AI answer synthesis from top docs
    if (scored.length > 0) {
      const context = scored.slice(0, 3).map(({ doc }) =>
        `[${doc.title}]\n${doc.summary || ''}\n${doc.key_points?.join('\n') || ''}`
      ).join('\n\n---\n\n');

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Dựa trên các tài liệu HSE sau, hãy trả lời câu hỏi một cách rõ ràng và chính xác.\n\nCÂU HỎI: ${query}\n\nTÀI LIỆU THAM KHẢO:\n${context}\n\nTrả lời bằng tiếng Việt, ngắn gọn và thực tế.`,
      });
      setAiAnswer(res);
    }

    setIsSearching(false);
  };

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Hỏi bất kỳ điều gì về an toàn, quy định, quy trình..."
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isSearching ? 'Đang tìm...' : 'Tìm kiếm'}
        </Button>
      </div>

      {docs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Chưa có tài liệu nào được lập chỉ mục</p>
        </div>
      )}

      {/* AI Answer */}
      {aiAnswer && (
        <Card className="border-primary/30 bg-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Trả lời từ kho tri thức HSE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results !== null && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {results.length === 0 ? 'Không tìm thấy tài liệu phù hợp' : `${results.length} tài liệu liên quan`}
          </p>
          <div className="space-y-3">
            {results.map(({ doc, score }, i) => (
              <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{doc.title}</p>
                        <Badge variant="secondary" className="text-xs">{score} điểm</Badge>
                      </div>
                      {doc.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.summary}</p>}
                      {doc.key_points?.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {doc.key_points.slice(0, 3).map((kp, j) => (
                            <li key={j} className="text-xs text-muted-foreground flex gap-1">
                              <span className="text-primary">•</span> {kp}
                            </li>
                          ))}
                        </ul>
                      )}
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                          <FileText className="w-3 h-3" /> Xem tài liệu gốc
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}