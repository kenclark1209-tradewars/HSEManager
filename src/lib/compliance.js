// Theo dõi hạn hiệu lực & bằng chứng tuân thủ

export const TRACKER_CATEGORIES = [
  { value: 'equipment_inspection', label: 'Kiểm định thiết bị' },
  { value: 'environment', label: 'Môi trường' },
  { value: 'training', label: 'Huấn luyện' },
  { value: 'fire_safety', label: 'PCCC' },
  { value: 'license', label: 'Giấy phép' },
];

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

// Đỏ: quá hạn hoặc còn ≤ 15 ngày | Vàng: 16-60 ngày | Xanh: > 60 ngày
export function getExpiryStatus(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) {
    return { level: 'unknown', days: null, label: 'Chưa có hạn', className: 'bg-gray-100 text-gray-600' };
  }
  if (days < 0) {
    return { level: 'expired', days, label: `Quá hạn ${Math.abs(days)} ngày`, className: 'bg-red-100 text-red-700' };
  }
  if (days <= 15) {
    return { level: 'critical', days, label: `Còn ${days} ngày`, className: 'bg-red-100 text-red-700' };
  }
  if (days <= 60) {
    return { level: 'warning', days, label: `Còn ${days} ngày`, className: 'bg-amber-100 text-amber-700' };
  }
  return { level: 'ok', days, label: `Còn ${days} ngày`, className: 'bg-emerald-100 text-emerald-700' };
}

export function hasValidEvidence(record) {
  return !!record.evidence_file_uri && daysUntil(record.expiration_date) >= 0;
}