/**
 * Export Incident Report to Excel (NOR-IV-MS-032 format)
 * Uses SheetJS (xlsx) via CDN or native construction with CSV fallback
 */

function val(v) {
  return v ?? '';
}

function checked(b) {
  return b ? '✓' : '□';
}

/**
 * Export incident as a structured Excel-like file.
 * Uses a styled HTML table exported as .xls (Excel-compatible).
 */
export function exportIncidentToExcel(incident) {
  const i = incident;

  const INCIDENT_TYPE_MAP = {
    fatality: 'Fatality / Tử vong',
    lost_time: 'Lost Time Accident / Mất ngày công',
    medical_treatment: 'Medical Treatment / Điều trị y tế',
    environmental: 'Environmental Incident / Sự cố môi trường',
    fire: 'Fire/Explosion / Cháy nổ',
    near_miss: 'Near Miss / Cận nguy',
    property_damage: 'Property Damaged / Hư hại tài sản',
    spillage: 'Spillage / Tràn vật liệu',
    first_aid: 'First Aid / Sơ cấp cứu',
    vehicle: 'Vehicle Incident / Sự cố phương tiện',
  };

  const UNSAFE_CONDITIONS = [
    { key: 'uc_inadequate_guard', label: 'Inadequate guard / Không đủ an toàn' },
    { key: 'uc_unguarded_hazard', label: 'Unguarded hazard / Nguy hiểm không được bảo vệ' },
    { key: 'uc_safety_device_defective', label: 'Safety device is defective' },
    { key: 'uc_equipment_defective', label: 'Tool/Equipment defective' },
    { key: 'uc_workstation_hazardous', label: 'Workstation layout is hazardous' },
    { key: 'uc_unsafe_lighting', label: 'Unsafe lighting' },
    { key: 'uc_unsafe_ventilation', label: 'Unsafe ventilation' },
    { key: 'uc_lack_ppe', label: 'Lack of PPE' },
    { key: 'uc_lack_equipment', label: 'Lack of appropriate equipment/tools' },
    { key: 'uc_unsafe_clothing', label: 'Unsafe clothing' },
    { key: 'uc_no_training', label: 'No/insufficient training' },
  ];

  const UNSAFE_ACTS = [
    { key: 'ua_no_permission', label: 'Operating without permission' },
    { key: 'ua_unsafe_speed', label: 'Operating at unsafe speed' },
    { key: 'ua_energized_equip', label: 'Servicing energized equipment' },
    { key: 'ua_safety_inoperative', label: 'Making safety device inoperative' },
    { key: 'ua_defective_equip', label: 'Using defective equipment' },
    { key: 'ua_unapproved_way', label: 'Using equipment in unapproved way' },
    { key: 'ua_unsafe_lifting', label: 'Unsafe lifting' },
    { key: 'ua_unsafe_posture', label: 'Unsafe position/posture' },
    { key: 'ua_distraction', label: 'Distraction/horseplay' },
    { key: 'ua_no_ppe', label: 'Failure to wear PPE' },
    { key: 'ua_no_use_tools', label: 'Failure to use available tools' },
  ];

  const CORRECTIVE_OPTIONS = [
    { key: 'ca_stop_activity', label: 'Stop this activity' },
    { key: 'ca_guard_hazard', label: 'Guard the hazard' },
    { key: 'ca_train_employee', label: 'Train the employee(s)' },
    { key: 'ca_train_supervisor', label: 'Train the supervisor(s)' },
    { key: 'ca_redesign_task', label: 'Redesign task steps' },
    { key: 'ca_redesign_workstation', label: 'Redesign work station' },
    { key: 'ca_new_policy', label: 'Write a new policy/rule' },
    { key: 'ca_enforce_policy', label: 'Enforce existing policy' },
    { key: 'ca_routine_inspect', label: 'Routinely inspect for the hazard' },
    { key: 'ca_ppe', label: 'Personal Protective Equipment' },
  ];

  const ucChecked = UNSAFE_CONDITIONS.filter(c => i[c.key]).map(c => c.label).join('\n') + (i.uc_other ? `\nOther: ${i.uc_other_text || ''}` : '');
  const uaChecked = UNSAFE_ACTS.filter(c => i[c.key]).map(c => c.label).join('\n') + (i.ua_other ? `\nOther: ${i.ua_other_text || ''}` : '');
  const caChecked = CORRECTIVE_OPTIONS.filter(c => i[c.key]).map(c => c.label).join('\n') + (i.ca_other ? `\nOther: ${i.ca_other_text || ''}` : '');

  const html = `
<html xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #999; padding: 4px 8px; vertical-align: top; }
    .header { background: #1e3a5f; color: white; font-size: 14pt; font-weight: bold; text-align: center; padding: 12px; }
    .section { background: #c6d4e6; font-weight: bold; font-size: 10pt; padding: 6px 8px; }
    .sub-section { background: #e8eef5; font-weight: bold; }
    .label { background: #f5f7fa; font-weight: bold; width: 180px; }
    .value { }
    .no-border { border: none; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .report-title { font-size: 11pt; font-weight: bold; text-align: center; padding: 4px; }
    .approval-box { border: 2px solid #333; padding: 8px; }
  </style>
</head>
<body>
<table>
  <!-- HEADER -->
  <tr>
    <td colspan="6" class="header">
      WORKPLACE SAFETY INCIDENT REPORT<br>
      <span style="font-size:11pt">BÁO CÁO SỰ CỐ AN TOÀN TẠI NƠI LÀM VIỆC</span>
    </td>
  </tr>
  <tr>
    <td colspan="4" class="report-title">NOR-IV-MS-032 Rev.01</td>
    <td colspan="2" class="report-title"><b>REPORT NO.:</b> ${val(i.report_no)}</td>
  </tr>

  <!-- SECTION A -->
  <tr><td colspan="6" class="section">SECTION A: INCIDENT NOTIFICATION / THÔNG BÁO SỰ CỐ<br><span style="font-weight:normal;font-size:9pt">Bộ phận liên quan hoàn thành và gửi email cho Safety Officer, SHEQ Manager &amp; GM trong vòng 24 giờ</span></td></tr>

  <tr>
    <td class="sub-section">1. Type of Incident</td>
    <td colspan="5">${INCIDENT_TYPE_MAP[i.incident_type] || val(i.incident_type)}</td>
  </tr>
  <tr>
    <td class="label">2. Location / Vị trí</td>
    <td colspan="2">${val(i.location)}</td>
    <td class="label">Department / Bộ phận</td>
    <td colspan="2">${val(i.department)}</td>
  </tr>
  <tr>
    <td class="label">3. Date of Incident / Ngày</td>
    <td>${val(i.date_occurred)}</td>
    <td class="label">Time / Giờ</td>
    <td>${val(i.time_occurred)}</td>
    <td class="label">Date Reported / Ngày báo cáo</td>
    <td>${val(i.date_reported)}</td>
  </tr>
  <tr>
    <td class="label">4. Involvement - Personnel</td>
    <td>${val(i.involvement_personnel)}</td>
    <td class="label">Equipment / Thiết bị</td>
    <td colspan="3">${val(i.involvement_equipment)}</td>
  </tr>
  <tr>
    <td class="label">5. Body Part Affected</td>
    <td colspan="2">${val(i.body_part_affected)}</td>
    <td class="label">Treatment Provided</td>
    <td colspan="2">${val(i.treatment_provided)}</td>
  </tr>

  <!-- Casualty table -->
  <tr><td colspan="6" class="sub-section">6. Information of Casualty / Thông tin nạn nhân</td></tr>
  <tr>
    <th>S/N</th><th colspan="2">Name / Tên</th><th>Designation/Dept.</th><th colspan="2">Nature of Injury / Chấn thương</th>
  </tr>
  ${[1,2,3].map(n => {
    const suffix = n > 1 ? n : '';
    return `<tr>
      <td class="center">${n}</td>
      <td colspan="2">${val(i[`victim_name${suffix}`])}</td>
      <td>${val(i[`victim_position${suffix}`])}</td>
      <td colspan="2">${val(i[`nature_of_injury${suffix}`])}</td>
    </tr>`;
  }).join('')}

  <tr>
    <td class="label">Lost Time Days / Ngày mất việc</td>
    <td>${val(i.lost_time_days)}</td>
    <td class="label">Lost Time Injury (LTI)</td>
    <td colspan="3">${i.is_lti ? 'YES / CÓ' : 'NO / KHÔNG'}</td>
  </tr>

  <tr><td colspan="6" class="sub-section">7. Brief Description / Tóm tắt sự cố</td></tr>
  <tr><td colspan="6" style="min-height:60px; white-space:pre-wrap">${val(i.brief_description || i.description)}</td></tr>

  <tr>
    <td class="label">8. Reported by / Người báo cáo</td>
    <td colspan="2">${val(i.reported_by)}</td>
    <td class="label">Designation / Chức danh</td>
    <td colspan="2">${val(i.reported_by_position)}</td>
  </tr>
  <tr>
    <td class="label">Supervisor / Người giám sát</td>
    <td colspan="5">${val(i.supervisor_name)}</td>
  </tr>
  <tr>
    <td class="label">9. Email Distribution</td>
    <td colspan="5">
      ${checked(i.email_safety_officer)} Safety Officer &nbsp;&nbsp;
      ${checked(i.email_sheq_manager)} SHEQ Manager &nbsp;&nbsp;
      ${checked(i.email_gm)} General Manager
    </td>
  </tr>

  <!-- SECTION B -->
  <tr><td colspan="6" class="section">SECTION B: INCIDENT INVESTIGATION / ĐIỀU TRA SỰ CỐ<br><span style="font-weight:normal;font-size:9pt">Đội điều tra hoàn tất trong vòng 7 ngày kể từ khi xảy ra sự cố</span></td></tr>

  <tr><td colspan="6" class="sub-section">1. Investigation Team / Đội điều tra</td></tr>
  <tr>
    <th>S/N</th><th colspan="2">Name / Tên</th><th>Department / Bộ phận</th><th colspan="2">Designation / Chức danh</th>
  </tr>
  ${[1,2,3,4,5].map(n => `<tr>
    <td class="center">${n}</td>
    <td colspan="2">${val(i[`inv_name${n}`])}</td>
    <td>${val(i[`inv_dept${n}`])}</td>
    <td colspan="2">${val(i[`inv_designation${n}`])}</td>
  </tr>`).join('')}

  <tr><td colspan="6" class="sub-section">2. Witness / Người chứng kiến</td></tr>
  <tr>
    <th>S/N</th><th colspan="2">Name / Tên</th><th>Department / Bộ phận</th><th colspan="2">Designation / Chức danh</th>
  </tr>
  ${[1,2,3].map(n => `<tr>
    <td class="center">${n}</td>
    <td colspan="2">${val(i[`wit_name${n}`])}</td>
    <td>${val(i[`wit_dept${n}`])}</td>
    <td colspan="2">${val(i[`wit_designation${n}`])}</td>
  </tr>`).join('')}

  <tr><td colspan="6" class="sub-section">3. Description of Incident / Mô tả sự cố</td></tr>
  <tr><td colspan="6" style="min-height:80px; white-space:pre-wrap">${val(i.description)}</td></tr>
  <tr>
    <td class="label">Sequence of Events</td>
    <td colspan="5" style="white-space:pre-wrap">${val(i.sequence_of_events)}</td>
  </tr>
  <tr>
    <td class="label">Work Activity / Hoạt động</td>
    <td colspan="2">${val(i.work_activity)}</td>
    <td class="label">PPE Used / Bảo hộ dùng</td>
    <td colspan="2">${val(i.ppe_used)}</td>
  </tr>
  <tr>
    <td class="label">Photographs / Ảnh</td>
    <td>${val(i.attachments_photos)}</td>
    <td class="label">Witness Statements</td>
    <td>${val(i.attachments_witness)}</td>
    <td class="label">Maps/Drawings / Sơ đồ</td>
    <td>${val(i.attachments_maps)}</td>
  </tr>

  <tr>
    <td class="label">4. Category of Incident</td>
    <td colspan="2">${i.severity || ''}</td>
    <td colspan="3"></td>
  </tr>
  <tr>
    <td class="sub-section" colspan="6">5. Type of Loss / Loại thất thoát</td>
  </tr>
  <tr>
    <td colspan="3">
      ${checked(i.loss_work_day)} Lost Work Day &nbsp;
      ${checked(i.loss_property)} Property Damaged &nbsp;
    </td>
    <td colspan="3">
      ${checked(i.loss_process_stop)} Process/Plant Stop &nbsp;
      ${checked(i.loss_environmental)} Environmental Impact &nbsp;
    </td>
  </tr>
  <tr>
    <td class="label">Loss Description</td>
    <td colspan="3" style="white-space:pre-wrap">${val(i.loss_description)}</td>
    <td class="label">Estimated Cost</td>
    <td>${val(i.property_damage_cost)}</td>
  </tr>

  <!-- SECTION C -->
  <tr><td colspan="6" class="section">SECTION C: ROOT CAUSE ANALYSIS / PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ</td></tr>

  <tr>
    <td colspan="3" class="sub-section">Unsafe Workplace Conditions / Điều kiện không an toàn</td>
    <td colspan="3" class="sub-section">Unsafe Acts by People / Hành vi không an toàn</td>
  </tr>
  <tr>
    <td colspan="3" style="white-space:pre-wrap; font-size:9pt">${ucChecked || '(Không có)'}</td>
    <td colspan="3" style="white-space:pre-wrap; font-size:9pt">${uaChecked || '(Không có)'}</td>
  </tr>
  <tr>
    <td class="label">Why did unsafe conditions exist?</td>
    <td colspan="5" style="white-space:pre-wrap">${val(i.immediate_causes)}</td>
  </tr>
  <tr>
    <td class="label">Why did unsafe acts occur?</td>
    <td colspan="5" style="white-space:pre-wrap">${val(i.unsafe_acts_reason)}</td>
  </tr>
  <tr>
    <td class="label">Unsafe conditions reported before?</td>
    <td colspan="2">${i.unsafe_reported_before === 'yes' ? 'Yes / Có' : i.unsafe_reported_before === 'no' ? 'No / Không' : ''}</td>
    <td class="label">Similar incidents before?</td>
    <td colspan="2">${i.similar_incidents_before === 'yes' ? 'Yes / Có' : i.similar_incidents_before === 'no' ? 'No / Không' : ''}</td>
  </tr>

  <tr><td colspan="6" class="sub-section">5-Why Analysis / Phân tích 5 Tại sao</td></tr>
  ${[1,2,3,4,5].map(n => `<tr>
    <td class="center bold">${n}</td>
    <td colspan="5">${val(i[`root_cause_why${n}`])}</td>
  </tr>`).join('')}
  <tr>
    <td class="label">Root Cause Summary / Tóm tắt nguyên nhân</td>
    <td colspan="5" style="white-space:pre-wrap">${val(i.root_cause_summary)}</td>
  </tr>

  <!-- SECTION D -->
  <tr><td colspan="6" class="section">SECTION D: CORRECTIVE & PREVENTIVE ACTIONS / HÀNH ĐỘNG KHẮC PHỤC & NGĂN NGỪA</td></tr>

  <tr><td colspan="6" class="sub-section">7. Suggested Corrective Actions / Đề xuất hành động khắc phục</td></tr>
  <tr>
    <td colspan="6" style="white-space:pre-wrap; font-size:9pt">${caChecked || '(Không có)'}</td>
  </tr>

  <tr><td colspan="6" class="sub-section">Action Plan / Kế hoạch hành động cụ thể</td></tr>
  <tr>
    <th colspan="2">Action / Hành động</th>
    <th>Responsible / Người phụ trách</th>
    <th>Due Date / Hạn</th>
    <th colspan="2">Status</th>
  </tr>
  ${[1,2,3,4].map(n => `<tr>
    <td colspan="2">${val(i[`ca_action${n}`])}</td>
    <td>${val(i[`ca_responsible${n}`])}</td>
    <td>${val(i[`ca_due${n}`])}</td>
    <td colspan="2">${val(i[`ca_status${n}`])}</td>
  </tr>`).join('')}

  <tr>
    <td class="label">Preventive Measures</td>
    <td colspan="5" style="white-space:pre-wrap">${val(i.preventive_measures)}</td>
  </tr>
  <tr>
    <td class="label">Lessons Learned / Bài học</td>
    <td colspan="5" style="white-space:pre-wrap">${val(i.lessons_learned)}</td>
  </tr>

  <!-- APPROVAL -->
  <tr><td colspan="6" class="section">APPROVAL / PHÊ DUYỆT</td></tr>
  <tr>
    <td class="label">SHEQ Reviewed by</td>
    <td colspan="2">${val(i.sheq_review_by)}</td>
    <td class="label">Date</td>
    <td colspan="2">${val(i.sheq_review_date)}</td>
  </tr>
  <tr>
    <td class="label">Management Approved by</td>
    <td colspan="2">${val(i.management_review_by)}</td>
    <td class="label">Date</td>
    <td colspan="2">${val(i.management_review_date)}</td>
  </tr>
  <tr>
    <td class="label">Management Comments</td>
    <td colspan="5" style="white-space:pre-wrap">${val(i.management_comments)}</td>
  </tr>

</table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const reportNo = i.report_no ? i.report_no.replace(/[^a-zA-Z0-9-_]/g, '_') : 'incident';
  a.download = `NOR-IV-MS-032_${reportNo}_${i.date_occurred || new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}