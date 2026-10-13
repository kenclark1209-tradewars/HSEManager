// Phạm vi áp dụng doanh nghiệp — xác định hạng mục nào là "Không áp dụng (N/A)"

export const INDUSTRIES = [
  { value: 'manufacturing', label: 'Sản xuất công nghiệp' },
  { value: 'construction', label: 'Xây dựng' },
  { value: 'services_logistics', label: 'Dịch vụ - Kho vận' },
  { value: 'chemicals', label: 'Hóa chất' },
];

export const COMPANY_SIZES = [
  { value: 'lt50', label: '< 50 người' },
  { value: '50_300', label: '50 - 300 người' },
  { value: 'gt300', label: '> 300 người' },
];

export const FACTORS = [
  { value: 'strict_equipment', label: 'Có thiết bị nghiêm ngặt (nồi hơi, xe nâng, cẩu trục)' },
  { value: 'wastewater', label: 'Có phát sinh nước thải công nghiệp' },
  { value: 'emission', label: 'Có nguồn phát thải khí thải' },
  { value: 'hazardous_chemicals', label: 'Có sử dụng hóa chất nguy hiểm' },
  { value: 'radiation', label: 'Có nguồn phóng xạ/bức xạ' },
];

// Trả về tập hợp mã hạng mục KHÔNG áp dụng theo hồ sơ doanh nghiệp
export function getNotApplicableCodes(profile) {
  const codes = new Set();
  if (!profile) return codes;
  const factors = profile.factors || [];
  const has = f => factors.includes(f);

  if (!has('wastewater')) codes.add('WASTEWATER');
  if (!has('emission')) codes.add('AIR_EMISSIONS');
  if (!has('hazardous_chemicals')) ['CHEMICAL_SAFETY', 'HAZARDOUS_MATERIALS', 'HAZARDOUS_WASTE', 'PCB'].forEach(c => codes.add(c));
  if (!has('radiation')) ['RADIATION', 'LASER_SAFETY'].forEach(c => codes.add(c));
  if (!has('strict_equipment')) ['PRESSURE_VESSELS', 'POWERED_VEHICLE', 'STORAGE_TANKS'].forEach(c => codes.add(c));
  if (profile.industry && profile.industry !== 'construction') codes.add('BUILDING_STRUCTURE');

  return codes;
}

export function isApplicable(category, naCodes) {
  return !naCodes.has(category.category_code);
}