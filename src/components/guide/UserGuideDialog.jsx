import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Rocket, LayoutDashboard, AlertTriangle, Shield, Zap, BookMarked, Grid3X3,
  Hash, Bell, Gavel, FileText, ListChecks, ClipboardCheck, RefreshCw, BarChart3,
  ClipboardList, Wallet, ShieldCheck, Bot, Settings, Lightbulb, ArrowRight, Network
} from 'lucide-react';
import ArchitectureGuide from './ArchitectureGuide';

const SECTIONS = [
  {
    icon: Rocket,
    title: 'Bắt đầu nhanh',
    color: 'text-primary',
    steps: [
      'Bắt đầu từ Bảng điều khiển để xem tổng quan tình hình HSE.',
      'Vào từng menu ở cột trái theo nhóm chức năng để làm việc.',
      'Dùng nút "Hướng dẫn sử dụng" này bất cứ lúc nào khi cần.',
      'Trợ lý AI ở mục AI Manager có thể giúp viết SOP, phân tích sự cố, audit tuân thủ.',
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'Bảng điều khiển',
    color: 'text-primary',
    items: [
      { label: 'Tổng quan', desc: 'Xem KPI, sự cố, hành động, rủi ro đang mở và tiến độ toàn hệ thống.' },
    ],
  },
  {
    icon: Zap,
    title: 'Vận hành',
    color: 'text-blue-600',
    items: [
      { label: 'Sự cố', desc: 'Ghi nhận sự cố/tai nạn, điều tra nguyên nhân gốc (5 Whys), theo dõi trạng thái xử lý.' },
      { label: 'Rủi ro', desc: 'Nhận diện và đánh giá rủi ro theo ma trận Khả năng × Mức độ, đề xuất biện pháp kiểm soát.' },
      { label: 'Hành động', desc: 'Quản lý hành động khắc phục/phòng ngừa (CAPA), giao người, hạn hoàn thành, bằng chứng.' },
    ],
  },
  {
    icon: BookMarked,
    title: 'Pháp lý HSE',
    color: 'text-purple-600',
    items: [
      { label: 'Legal Dashboard', desc: 'Tổng quan tuân thủ pháp lý, điểm số, cảnh báo. Có nút "Tự động Cập nhật" để AI tìm luật mới hoặc tải file Excel danh sách văn bản.' },
      { label: 'Ma trận 41 hạng mục', desc: 'Bản đồ 41 hạng mục HSE với văn bản luật chính, mức rủi ro và tần suất rà soát.' },
      { label: 'Kho văn bản pháp luật', desc: 'Cơ sở dữ liệu luật, nghị định, thông tư, QCVN/TCVN — thêm, sửa, theo dõi hiệu lực.' },
      { label: 'Điều khoản pháp luật', desc: 'Trích xuất điều khoản cụ thể, tóm tắt nghĩa vụ, tần suất, bằng chứng cần lưu.' },
      { label: 'Cảnh báo pháp lý', desc: 'Theo dõi luật mới, luật thay thế, văn bản sắp hết hiệu lực cần xử lý.' },
      { label: 'Nghiên cứu Pháp luật AI', desc: 'Nhập chủ đề, AI tự tìm luật/nghị định/thông tư trên internet, phân tích nghĩa vụ và đề xuất hành động.' },
    ],
  },
  {
    icon: FileText,
    title: 'Thư viện tài liệu',
    color: 'text-emerald-600',
    items: [
      { label: 'SOP Library', desc: 'Quy trình chuẩn (SOP) có liên kết căn cứ pháp lý, gắn biểu mẫu/checklist liên quan.' },
      { label: 'Checklist Library', desc: 'Danh mục checklist theo tần suất, gắn điều khoản luật và mức độ nghiêm trọng.' },
      { label: 'Form Library', desc: 'Biểu mẫu HSE, gồm cả mẫu quy định bởi luật, kèm thời hạn lưu hồ sơ.' },
      { label: 'Đào tạo', desc: 'Quản lý huấn luyện ATVSLĐ theo nhóm đối tượng, chứng chỉ và hồ sơ.' },
      { label: 'Ứng phó khẩn cấp', desc: 'Kế hoạch ứng phó tình huống khẩn cấp, đội PCCC, diễn tập.' },
    ],
  },
  {
    icon: RefreshCw,
    title: 'Kế hoạch',
    color: 'text-orange-600',
    items: [
      { label: 'PDCA', desc: 'Chu trình Plan–Do–Check–Act để cải tiến liên tục, xuất báo cáo PDF.' },
      { label: 'Checklist thực hiện', desc: 'Thực hiện checklist tại hiện trường, ghi nhận kết quả Pass/Fail và tạo hành động khi lỗi.' },
    ],
  },
  {
    icon: BarChart3,
    title: 'Quản lý',
    color: 'text-cyan-600',
    items: [
      { label: 'Báo cáo', desc: 'Báo cáo định kỳ và báo cáo cơ quan quản lý, tổng hợp số liệu sự cố.' },
      { label: 'Kiểm tra', desc: 'Lịch kiểm tra định kỳ/đột xuất, ghi nhận phát hiện và điểm số.' },
      { label: 'Ngân sách', desc: 'Kế hoạch và thực chi cho an toàn, PPE, thiết bị, huấn luyện.' },
      { label: 'Tuân thủ', desc: 'Đối chiếu yêu cầu pháp lý với thực tế, ghi nhận khoảng trống và kế hoạch khắc phục.' },
    ],
  },
  {
    icon: Bot,
    title: 'AI Manager',
    color: 'text-violet-600',
    items: [
      { label: 'AI Assistant', desc: 'Chat với trợ lý HSE: viết SOP, phân tích sự cố, audit tuân thủ, đọc tài liệu.' },
      { label: 'AI theo Vai trò', desc: 'Trợ lý AI gợi ý công việc theo vai trò (HSE officer, quản lý...).' },
      { label: 'KPI Monitor', desc: 'Theo dõi chỉ số an toàn và cảnh báo khi vượt ngưỡng.' },
      { label: 'Hàng đợi duyệt', desc: 'Duyệt các hành động do AI đề xuất trước khi thực thi.' },
      { label: 'Kho tri thức', desc: 'Tải tài liệu lên, AI trích xuất và tìm kiếm tri thức nội bộ.' },
      { label: 'AI Insights', desc: 'Phân tích chuyên sâu, phát hiện xu hướng và rủi ro tiềm ẩn.' },
    ],
  },
  {
    icon: Settings,
    title: 'Cài đặt',
    color: 'text-gray-600',
    items: [
      { label: 'Cài đặt', desc: 'Cấu hình AI, phân quyền vai trò và các tuỳ chọn hệ thống.' },
    ],
  },
];

export default function UserGuideDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Hướng dẫn sử dụng HSE Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Kiến trúc & Logic */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <Network className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Kiến trúc & Logic vận hành</h3>
            </div>
            <ArchitectureGuide />
          </div>

          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Chi tiết từng chức năng
            </p>
          </div>

          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${section.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                </div>

                {section.steps && (
                  <ol className="space-y-1.5 ml-1">
                    {section.steps.map((s, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {j + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {section.items && (
                  <div className="space-y-1.5">
                    {section.items.map((it, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">{it.label}:</span> {it.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Mẹo:</span> Khi chưa rõ quy định pháp luật cho một hạng mục,
              hãy dùng <Badge variant="secondary" className="text-xs mx-0.5">Nghiên cứu Pháp luật AI</Badge>
              để AI tự tìm văn bản và hướng dẫn thực hiện đúng.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}