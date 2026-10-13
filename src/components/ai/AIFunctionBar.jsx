import { cn } from '@/lib/utils';
import {
  Zap, FileText, AlertTriangle, Bell, ShieldCheck, FileSearch, MessageSquare
} from 'lucide-react';

const FUNCTIONS = [
  { id: 'create_action', label: 'Tạo Action', icon: Zap, color: 'bg-blue-50 text-blue-700 border-blue-200', activeColor: 'bg-blue-600 text-white border-blue-600', prompt: 'Tạo hành động khắc phục: ' },
  { id: 'analyze_incident', label: 'Phân tích Sự cố', icon: AlertTriangle, color: 'bg-orange-50 text-orange-700 border-orange-200', activeColor: 'bg-orange-500 text-white border-orange-500', prompt: 'Phân tích nguyên nhân sự cố: ' },
  { id: 'write_sop', label: 'Viết SOP', icon: FileText, color: 'bg-green-50 text-green-700 border-green-200', activeColor: 'bg-green-600 text-white border-green-600', prompt: 'Viết quy trình SOP cho: ' },
  { id: 'set_reminder', label: 'Nhắc việc', icon: Bell, color: 'bg-purple-50 text-purple-700 border-purple-200', activeColor: 'bg-purple-600 text-white border-purple-600', prompt: 'Nhắc nhở lịch kiểm định, huấn luyện ATVSLĐ: ' },
  { id: 'audit_compliance', label: 'Audit Tuân thủ', icon: ShieldCheck, color: 'bg-red-50 text-red-700 border-red-200', activeColor: 'bg-red-600 text-white border-red-600', prompt: 'Kiểm tra tuân thủ pháp luật ATVSLĐ cho doanh nghiệp: ' },
  { id: 'extract_document', label: 'Đọc tài liệu', icon: FileSearch, color: 'bg-teal-50 text-teal-700 border-teal-200', activeColor: 'bg-teal-600 text-white border-teal-600', prompt: 'Đọc và trích xuất dữ liệu từ tài liệu để điền vào hệ thống: ' },
  { id: 'general_answer', label: 'Hỏi HSE', icon: MessageSquare, color: 'bg-gray-50 text-gray-700 border-gray-200', activeColor: 'bg-gray-700 text-white border-gray-700', prompt: '' },
];

export { FUNCTIONS };

export default function AIFunctionBar({ activeFunction, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {FUNCTIONS.map(fn => {
        const Icon = fn.icon;
        const isActive = activeFunction === fn.id;
        return (
          <button
            key={fn.id}
            onClick={() => onSelect(fn.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
              isActive ? fn.activeColor : fn.color,
              "hover:opacity-80"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {fn.label}
          </button>
        );
      })}
    </div>
  );
}