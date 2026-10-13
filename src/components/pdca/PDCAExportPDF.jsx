import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileDown, Loader2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

const PHASES = [
  { key: 'plan', label: 'PLAN', desc: 'Lập kế hoạch', color: [59, 130, 246] },
  { key: 'do', label: 'DO', desc: 'Thực hiện', color: [34, 197, 94] },
  { key: 'check', label: 'CHECK', desc: 'Kiểm tra', color: [245, 158, 11] },
  { key: 'act', label: 'ACT', desc: 'Cải tiến', color: [168, 85, 247] },
];

const STATUS_LABEL = {
  draft: 'Bản nháp',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  reviewed: 'Đã xem xét',
};

function drawProgressBar(doc, x, y, width, pct, color) {
  // Background
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(x, y, width, 4, 2, 2, 'F');
  // Fill
  if (pct > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, (width * pct) / 100, 4, 2, 2, 'F');
  }
}

function addPage(doc, pageWidth, pageHeight, pageNum) {
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Báo cáo PDCA — HSE Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text(`Trang ${pageNum}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
  doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), 15, pageHeight - 10);
  doc.setTextColor(0, 0, 0);
}

export default function PDCAExportPDF({ records = [], category, allCategories = [] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const categoryName = category
    ? (category.name_vi || category.name_en)
    : 'Tất cả hạng mục HSE';

  const handleExport = async () => {
    setLoading(true);
    setDone(false);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      let pageNum = 1;
      let y = 0;

      // ─── COVER PAGE ───────────────────────────────────────────────
      // Header band
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pw, 50, 'F');

      // Logo area
      doc.setFillColor(255, 255, 255, 0.1);
      doc.circle(20, 25, 12, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('HSE', 20, 27.5, { align: 'center' });

      // Title
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('BAO CAO VONG LAP PDCA', 40, 22);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Plan - Do - Check - Act | HSE Management System', 40, 31);
      doc.setFontSize(10);
      doc.text(`Ngay tao: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 40, 40);

      // Category info box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 60, pw - 30, 35, 4, 4, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(15, 60, pw - 30, 35, 4, 4, 'S');

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('HANG MUC HSE', 22, 70);
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(categoryName.substring(0, 55), 22, 78);

      if (category) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const laws = (category.primary_law_codes || []).join(', ');
        if (laws) doc.text(`Can cu phap ly: ${laws}`, 22, 86);
        doc.text(`Muc rui ro: ${category.risk_level || 'N/A'} | Cap nhat: ${category.law_last_updated || 'N/A'}`, 22, 91);
      }

      // PDCA Summary boxes
      y = 108;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('TONG QUAN VONG PDCA', 15, y);
      y += 6;

      const total = records.length;
      const completed = records.filter(r => ['completed', 'reviewed'].includes(r.status)).length;
      const inProgress = records.filter(r => r.status === 'in_progress').length;
      const overdue = records.filter(r =>
        r.due_date && new Date(r.due_date) < new Date() &&
        !['completed', 'reviewed'].includes(r.status)
      ).length;

      const stats = [
        { label: 'Tong muc', value: total, color: [30, 58, 138] },
        { label: 'Dang thuc hien', value: inProgress, color: [59, 130, 246] },
        { label: 'Hoan thanh', value: completed, color: [34, 197, 94] },
        { label: 'Qua han', value: overdue, color: [239, 68, 68] },
      ];

      const boxW = (pw - 30 - 9) / 4;
      stats.forEach((s, i) => {
        const bx = 15 + i * (boxW + 3);
        doc.setFillColor(...s.color.map(c => Math.max(0, c - 10)));
        doc.roundedRect(bx, y, boxW, 20, 3, 3, 'F');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(String(s.value), bx + boxW / 2, y + 12, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(s.label, bx + boxW / 2, y + 18, { align: 'center' });
      });
      y += 30;

      // Phase progress bars on cover
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text('TIEN DO TUNG GIAI DOAN', 15, y);
      y += 6;

      PHASES.forEach(phase => {
        const phRecs = records.filter(r => r.phase === phase.key);
        const avg = phRecs.length
          ? Math.round(phRecs.reduce((s, r) => s + (r.completion_percent || 0), 0) / phRecs.length)
          : 0;

        doc.setFillColor(...phase.color);
        doc.roundedRect(15, y, 14, 6, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(phase.label, 22, y + 4.2, { align: 'center' });

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${phase.desc} (${phRecs.length} muc)`, 33, y + 4.2);

        drawProgressBar(doc, 90, y + 1.5, pw - 105, avg, phase.color);
        doc.setTextColor(...phase.color);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${avg}%`, pw - 12, y + 4.5, { align: 'right' });

        y += 10;
      });

      addPage(doc, pw, ph, pageNum);

      // ─── DETAIL PAGES PER PHASE ───────────────────────────────────
      for (const phase of PHASES) {
        const phRecs = records.filter(r => r.phase === phase.key);
        if (!phRecs.length) continue;

        doc.addPage();
        pageNum++;
        y = 15;

        // Phase header band
        doc.setFillColor(...phase.color);
        doc.rect(0, 0, pw, 18, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`${phase.label} — ${phase.desc}`, 15, 12);

        const phAvg = Math.round(phRecs.reduce((s, r) => s + (r.completion_percent || 0), 0) / phRecs.length);
        doc.setFontSize(10);
        doc.text(`${phAvg}% hoan thanh | ${phRecs.length} muc`, pw - 15, 12, { align: 'right' });

        y = 24;

        for (const rec of phRecs) {
          // Check space
          if (y > ph - 50) {
            addPage(doc, pw, ph, pageNum);
            doc.addPage();
            pageNum++;
            y = 15;
            // Mini phase header
            doc.setFillColor(...phase.color.map(c => Math.min(255, c + 80)));
            doc.rect(0, 0, pw, 10, 'F');
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(`${phase.label} — tiep theo`, 15, 7);
            y = 16;
          }

          // Record card
          const cardH = 38 + (rec.objectives ? 10 : 0) + (rec.notes ? 8 : 0);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(15, y, pw - 30, cardH, 3, 3, 'F');

          // Left accent bar
          doc.setFillColor(...phase.color);
          doc.roundedRect(15, y, 3, cardH, 1.5, 1.5, 'F');

          // Status badge
          const stColor = {
            draft: [148, 163, 184],
            in_progress: [59, 130, 246],
            completed: [34, 197, 94],
            reviewed: [168, 85, 247],
          }[rec.status] || [148, 163, 184];

          doc.setFillColor(...stColor);
          doc.roundedRect(pw - 55, y + 4, 36, 6, 2, 2, 'F');
          doc.setFontSize(7);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text(STATUS_LABEL[rec.status] || rec.status, pw - 37, y + 8.2, { align: 'center' });

          // AI badge
          if (rec.ai_generated) {
            doc.setFillColor(139, 92, 246);
            doc.roundedRect(pw - 55 - 14, y + 4, 12, 6, 2, 2, 'F');
            doc.setFontSize(6);
            doc.setTextColor(255, 255, 255);
            doc.text('AI', pw - 55 - 8, y + 8.2, { align: 'center' });
          }

          // Title
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          const title = doc.splitTextToSize(rec.title || '', pw - 80);
          doc.text(title[0] || '', 22, y + 10);

          let cy = y + 16;

          // Meta row
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          const meta = [];
          if (rec.responsible_person) meta.push(`Phu trach: ${rec.responsible_person}`);
          if (rec.due_date) {
            const isOverdue = new Date(rec.due_date) < new Date() && !['completed', 'reviewed'].includes(rec.status);
            if (isOverdue) doc.setTextColor(239, 68, 68);
            meta.push(`Han: ${format(new Date(rec.due_date), 'dd/MM/yyyy')}${isOverdue ? ' (QUA HAN)' : ''}`);
            doc.setTextColor(100, 116, 139);
          }
          if (meta.length) {
            doc.text(meta.join('   |   '), 22, cy);
            cy += 7;
          }

          // Objectives
          if (rec.objectives) {
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            const objLines = doc.splitTextToSize(`Muc tieu: ${rec.objectives}`, pw - 45);
            doc.text(objLines[0], 22, cy);
            cy += 7;
          }

          // Progress bar
          drawProgressBar(doc, 22, cy, pw - 80, rec.completion_percent || 0, phase.color);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...phase.color);
          doc.text(`${rec.completion_percent || 0}%`, pw - 50, cy + 3.5, { align: 'right' });
          cy += 8;

          // Description
          if (rec.description) {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            const descLines = doc.splitTextToSize(rec.description, pw - 45);
            doc.text(descLines.slice(0, 2), 22, cy);
          }

          y += cardH + 4;
        }

        addPage(doc, pw, ph, pageNum);
      }

      // ─── SUMMARY / CONCLUSION PAGE ────────────────────────────────
      doc.addPage();
      pageNum++;
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pw, 18, 'F');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('TONG KET VA KHUYEN NGHI', 15, 12);

      y = 28;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Tom tat ket qua vong PDCA:', 15, y);
      y += 8;

      const summaryLines = [
        `• Tong so muc hanh dong: ${records.length}`,
        `• Da hoan thanh / Da xem xet: ${records.filter(r => ['completed', 'reviewed'].includes(r.status)).length} muc`,
        `• Dang trien khai: ${records.filter(r => r.status === 'in_progress').length} muc`,
        `• Ban nhap: ${records.filter(r => r.status === 'draft').length} muc`,
        `• Qua han: ${records.filter(r => r.due_date && new Date(r.due_date) < new Date() && !['completed', 'reviewed'].includes(r.status)).length} muc`,
        `• Duoc tao boi AI: ${records.filter(r => r.ai_generated).length} muc`,
      ];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      summaryLines.forEach(line => {
        doc.text(line, 20, y);
        y += 7;
      });

      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Tien do tung giai doan:', 15, y);
      y += 8;

      PHASES.forEach(phase => {
        const phRecs = records.filter(r => r.phase === phase.key);
        const avg = phRecs.length ? Math.round(phRecs.reduce((s, r) => s + (r.completion_percent || 0), 0) / phRecs.length) : 0;
        const done = phRecs.filter(r => ['completed', 'reviewed'].includes(r.status)).length;

        doc.setFillColor(...phase.color);
        doc.roundedRect(20, y - 4, 12, 6, 1.5, 1.5, 'F');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(phase.label, 26, y, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(`${phase.desc}: ${done}/${phRecs.length} muc hoan thanh`, 36, y);

        drawProgressBar(doc, 110, y - 3.5, 60, avg, phase.color);
        doc.setTextColor(...phase.color);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${avg}%`, 175, y, { align: 'right' });

        y += 10;
      });

      // Signature section
      y = Math.max(y + 15, ph - 70);
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y, pw - 15, y);
      y += 8;

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Bao cao nay duoc tao tu dong tu He thong HSE Management.', 15, y);
      doc.text(`Ngay tao: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, y + 6);
      doc.text(`Hang muc: ${categoryName}`, 15, y + 12);

      // Signature boxes
      const sigY = ph - 45;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Nguoi lap bao cao', pw / 4, sigY, { align: 'center' });
      doc.text('HSE Manager', (3 * pw) / 4, sigY, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('(Ky, ghi ro ho ten)', pw / 4, sigY + 5, { align: 'center' });
      doc.text('(Ky, ghi ro ho ten)', (3 * pw) / 4, sigY + 5, { align: 'center' });

      doc.setDrawColor(148, 163, 184);
      doc.line(pw / 4 - 25, ph - 20, pw / 4 + 25, ph - 20);
      doc.line((3 * pw) / 4 - 25, ph - 20, (3 * pw) / 4 + 25, ph - 20);

      addPage(doc, pw, ph, pageNum);

      // Save
      const fileName = `PDCA_${categoryName.replace(/\s+/g, '_').substring(0, 30)}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(fileName);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={() => setOpen(true)}
      >
        <FileDown className="w-3.5 h-3.5" />
        Xuất PDF
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-primary" />
              Xuất Báo cáo PDCA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview info */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
              <p className="text-sm font-medium">Nội dung báo cáo sẽ bao gồm:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✅ Trang bìa với thông tin hạng mục HSE và căn cứ pháp lý</li>
                <li>✅ Tổng quan tiến độ 4 giai đoạn PDCA</li>
                <li>✅ Chi tiết từng mục hành động theo giai đoạn</li>
                <li>✅ Thanh tiến độ, trạng thái, người phụ trách, hạn chót</li>
                <li>✅ Trang tổng kết và ký xác nhận</li>
              </ul>
            </div>

            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Hạng mục / Phạm vi</p>
              <p className="text-sm font-semibold">{categoryName}</p>
              <p className="text-xs text-muted-foreground mt-1">{records.length} mục PDCA sẽ được xuất</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button
                size="sm"
                onClick={handleExport}
                disabled={loading || records.length === 0}
                className="gap-1.5 min-w-28"
              >
                {loading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tạo PDF...</>
                ) : done ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /> Đã tải xuống!</>
                ) : (
                  <><FileDown className="w-3.5 h-3.5" /> Tải PDF ngay</>
                )}
              </Button>
            </div>

            {records.length === 0 && (
              <p className="text-xs text-amber-600 text-center">Chưa có dữ liệu PDCA để xuất. Hãy tạo ít nhất 1 mục trước.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}