import { ArrowDown, Landmark, BookOpen, Cog, Siren, RefreshCw, Bot, Link2, GitBranch } from 'lucide-react';

const LAYERS = [
  {
    icon: Landmark,
    name: 'Nền tảng pháp lý',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    entities: ['LegalDocument — Văn bản luật/NĐ/TT', 'LegalClause — Điều khoản, nghĩa vụ cụ thể', 'HSECategory — 41 hạng mục HSE'],
    desc: 'Mọi thứ bắt đầu từ đây: luật quy định doanh nghiệp PHẢI làm gì.',
  },
  {
    icon: BookOpen,
    name: 'Tài liệu vận hành',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    entities: ['SOP — Quy trình chuẩn', 'HSEChecklist — Danh mục kiểm tra', 'HSEForm — Biểu mẫu/hồ sơ'],
    desc: 'Biến luật thành hướng dẫn CÁCH LÀM — mỗi tài liệu gắn căn cứ pháp lý tương ứng.',
  },
  {
    icon: Cog,
    name: 'Thực thi tại hiện trường',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    entities: ['Inspection — Kiểm tra định kỳ', 'Thực hiện Checklist', 'Training — Huấn luyện, chứng chỉ'],
    desc: 'Nhân viên thực hiện theo tài liệu; kết quả được ghi nhận làm bằng chứng.',
  },
  {
    icon: Siren,
    name: 'Sự kiện phát sinh',
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    entities: ['Incident — Sự cố/tai nạn', 'Risk — Rủi ro nhận diện', 'Action — Hành động CAPA'],
    desc: 'Khi có sự cố hoặc rủi ro → điều tra nguyên nhân gốc → tạo hành động khắc phục.',
  },
  {
    icon: RefreshCw,
    name: 'Cải tiến liên tục',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200',
    entities: ['PDCA — Plan·Do·Check·Act', 'Compliance — Đối chiếu tuân thủ', 'Report — Báo cáo'],
    desc: 'Đánh giá lại toàn bộ chu trình, phát hiện khoảng trống và cải tiến.',
  },
];

const FLOW = [
  'Luật mới được ban hành hoặc thay đổi',
  'AI/Cảnh báo pháp lý phát hiện (LegalAlert)',
  'Rà soát điều khoản bị ảnh hưởng',
  'Cập nhật SOP / Checklist / Biểu mẫu liên quan',
  'Huấn luyện lại & phổ biến nội dung mới',
  'Thực thi, kiểm tra, ghi nhận bằng chứng',
];

export default function ArchitectureGuide() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Link2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Nguyên tắc cốt lõi — Kiến trúc liên kết tài liệu:</span> mọi tài liệu
          vận hành (SOP, checklist, biểu mẫu) đều <span className="font-medium text-foreground">truy vết ngược về căn cứ pháp lý</span>.
          Khi luật thay đổi, hệ thống biết chính xác tài liệu nào cần cập nhật — thay vì sửa thủ công từng chỗ.
        </p>
      </div>

      {/* Layer stack */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          5 tầng logic của hệ thống (trên → dưới)
        </p>
        <div className="space-y-1">
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <div key={i}>
                <div className={`rounded-lg border p-3 ${layer.bg}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${layer.color}`} />
                    <span className="text-sm font-semibold">{i + 1}. {layer.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{layer.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.entities.map((e, j) => (
                      <span key={j} className="text-[11px] bg-background/80 border border-border px-2 py-0.5 rounded-full font-mono">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                {i < LAYERS.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI layer */}
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Bot className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold">Lớp AI — xuyên suốt mọi tầng</span>
        </div>
        <p className="text-xs text-muted-foreground">
          AI đọc dữ liệu từ tất cả các tầng để phân tích, đề xuất hành động và soạn tài liệu. Nhưng
          <span className="font-medium text-foreground"> con người luôn duyệt trước khi thực thi</span> (qua Hàng đợi duyệt) — AI hỗ trợ, không tự quyết.
        </p>
      </div>

      {/* Change flow */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Luồng khi luật thay đổi
          </p>
        </div>
        <div className="space-y-1.5">
          {FLOW.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-xs text-muted-foreground">{step}</span>
              {i < FLOW.length - 1 && <ArrowDown className="w-3 h-3 text-muted-foreground/40 ml-auto shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}