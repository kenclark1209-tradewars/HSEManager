import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { t } from '@/lib/i18n';
import { AlertCircle, User, Search, Wrench, CheckCircle, ChevronRight, ChevronLeft, FileText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'A. Thông báo sự cố', icon: FileText },
  { id: 2, label: 'B. Điều tra', icon: Search },
  { id: 3, label: 'C. Nguyên nhân gốc rễ', icon: AlertCircle },
  { id: 4, label: 'D. Hành động & Phê duyệt', icon: Wrench },
];

const INCIDENT_TYPES = [
  { value: 'fatality', label: 'Fatality / Tử vong' },
  { value: 'lost_time', label: 'Lost Time Accident / Mất ngày công' },
  { value: 'medical_treatment', label: 'Medical Treatment / Điều trị y tế' },
  { value: 'environmental', label: 'Environmental Incident / Sự cố môi trường' },
  { value: 'fire', label: 'Fire/Explosion / Cháy nổ' },
  { value: 'near_miss', label: 'Near Miss / Cận nguy' },
  { value: 'property_damage', label: 'Property Damaged / Hư hại tài sản' },
  { value: 'spillage', label: 'Spillage / Tràn vật liệu' },
  { value: 'first_aid', label: 'First Aid / Sơ cấp cứu' },
  { value: 'vehicle', label: 'Vehicle Incident / Sự cố phương tiện' },
];

const SEVERITY_OPTIONS = [
  { value: 'near_miss', label: 'Minor / Nhỏ' },
  { value: 'first_aid', label: 'Serious / Nghiêm trọng' },
  { value: 'medical_treatment', label: 'Major' },
  { value: 'lost_time', label: 'Catastrophic' },
];

const LOSS_TYPES = [
  { key: 'loss_work_day', label: 'Lost Work Day / Mất ngày làm việc' },
  { key: 'loss_property', label: 'Property Damaged / Hư hỏng tài sản' },
  { key: 'loss_process_stop', label: 'Process/Plant Stop / Dừng quy trình' },
  { key: 'loss_environmental', label: 'Environmental Impact / Ảnh hưởng môi trường' },
];

const UNSAFE_CONDITIONS = [
  { key: 'uc_inadequate_guard', label: 'Inadequate guard / Không đủ an toàn' },
  { key: 'uc_unguarded_hazard', label: 'Unguarded hazard / Nguy hiểm không được bảo vệ' },
  { key: 'uc_safety_device_defective', label: 'Safety device is defective / Thiết bị an toàn bị lỗi' },
  { key: 'uc_equipment_defective', label: 'Tool/Equipment defective / Công cụ/thiết bị lỗi' },
  { key: 'uc_workstation_hazardous', label: 'Workstation layout is hazardous / Bố trí trạm làm việc nguy hiểm' },
  { key: 'uc_unsafe_lighting', label: 'Unsafe lighting / Ánh sáng không an toàn' },
  { key: 'uc_unsafe_ventilation', label: 'Unsafe ventilation / Thông gió không đảm bảo' },
  { key: 'uc_lack_ppe', label: 'Lack of PPE / Thiếu thiết bị bảo hộ' },
  { key: 'uc_lack_equipment', label: 'Lack of appropriate equipment/tools / Thiếu thiết bị' },
  { key: 'uc_unsafe_clothing', label: 'Unsafe clothing / Quần áo không an toàn' },
  { key: 'uc_no_training', label: 'No/insufficient training / Không đủ đào tạo' },
];

const UNSAFE_ACTS = [
  { key: 'ua_no_permission', label: 'Operating without permission / Vận hành không được phép' },
  { key: 'ua_unsafe_speed', label: 'Operating at unsafe speed / Tốc độ không an toàn' },
  { key: 'ua_energized_equip', label: 'Servicing energized equipment / Bảo trì thiết bị có nguồn điện' },
  { key: 'ua_safety_inoperative', label: 'Making safety device inoperative / Vô hiệu hóa thiết bị an toàn' },
  { key: 'ua_defective_equip', label: 'Using defective equipment / Dùng thiết bị bị lỗi' },
  { key: 'ua_unapproved_way', label: 'Using equipment in unapproved way / Dùng thiết bị sai cách' },
  { key: 'ua_unsafe_lifting', label: 'Unsafe lifting / Nâng hạ không an toàn' },
  { key: 'ua_unsafe_posture', label: 'Unsafe position/posture / Tư thế không an toàn' },
  { key: 'ua_distraction', label: 'Distraction/horseplay / Mất tập trung/đùa giỡn' },
  { key: 'ua_no_ppe', label: 'Failure to wear PPE / Không đeo bảo hộ' },
  { key: 'ua_no_use_tools', label: 'Failure to use available tools / Không dùng công cụ có sẵn' },
];

const CORRECTIVE_OPTIONS = [
  { key: 'ca_stop_activity', label: 'Stop this activity / Dừng hoạt động này' },
  { key: 'ca_guard_hazard', label: 'Guard the hazard / Bảo vệ các mối nguy' },
  { key: 'ca_train_employee', label: 'Train the employee(s) / Đào tạo nhân viên' },
  { key: 'ca_train_supervisor', label: 'Train the supervisor(s) / Đào tạo giám sát' },
  { key: 'ca_redesign_task', label: 'Redesign task steps / Thiết kế lại bước thực hiện' },
  { key: 'ca_redesign_workstation', label: 'Redesign work station / Bố trí lại khu vực làm việc' },
  { key: 'ca_new_policy', label: 'Write a new policy/rule / Viết thủ tục/quy định mới' },
  { key: 'ca_enforce_policy', label: 'Enforce existing policy / Thực thi chính sách hiện hành' },
  { key: 'ca_routine_inspect', label: 'Routinely inspect for the hazard / Kiểm tra thường xuyên' },
  { key: 'ca_ppe', label: 'Personal Protective Equipment / Cấp bảo hộ lao động' },
];

const F = ({ label, required, children, hint, className }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-sm font-medium">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div className="mt-4 mb-3">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-primary">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
    {sub && <p className="text-xs text-muted-foreground mt-0.5 italic">{sub}</p>}
  </div>
);

const CheckGroup = ({ items, form, upd, otherKey, otherLabel }) => (
  <div className="grid grid-cols-1 gap-2">
    {items.map(item => (
      <label key={item.key} className="flex items-start gap-2 cursor-pointer group">
        <Checkbox
          checked={!!form[item.key]}
          onCheckedChange={v => upd(item.key, v)}
          className="mt-0.5"
        />
        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{item.label}</span>
      </label>
    ))}
    {otherKey && (
      <div className="flex items-center gap-2 mt-1">
        <Checkbox checked={!!form[otherKey]} onCheckedChange={v => upd(otherKey, v)} />
        <span className="text-sm">{otherLabel || 'Other / Khác:'}</span>
        <Input className="h-7 text-sm flex-1" placeholder="Ghi rõ..." value={form[otherKey + '_text'] || ''} onChange={e => upd(otherKey + '_text', e.target.value)} />
      </div>
    )}
  </div>
);

export default function IncidentForm({ initial = {}, onSubmit, onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Section A
    title: '', report_no: '', incident_type: 'first_aid',
    date_occurred: '', time_occurred: '', date_reported: new Date().toISOString().split('T')[0],
    location: '', department: '', work_activity: '',
    reported_by: '', reported_by_position: '', supervisor_name: '', witnesses: '',
    involvement_personnel: 'NORTALIC', involvement_equipment: 'NORTALIC',
    // Casualties (multiple)
    victim_name: '', victim_position: '', victim_department: '', nature_of_injury: '',
    victim_name2: '', victim_position2: '', victim_department2: '', nature_of_injury2: '',
    brief_description: '',
    // email dist
    email_safety_officer: false, email_sheq_manager: false, email_gm: false,

    // Section B
    investigation_team: '', investigation_start_date: '', investigation_end_date: '',
    witness_list: '',
    description: '',
    sequence_of_events: '',
    ppe_used: '',
    attachments_photos: '', attachments_witness: '', attachments_maps: '',
    // Category
    severity: 'first_aid',
    // Loss types
    loss_work_day: false, loss_property: false, loss_process_stop: false, loss_environmental: false,
    loss_description: '',
    property_damage_cost: '',
    // PPE/Equipment involvement
    victim_age: '', victim_gender: 'male', victim_experience_years: '',
    body_part_affected: '', treatment_provided: '', lost_time_days: 0, is_lti: false,

    // Section C - Root Cause checkboxes
    ...UNSAFE_CONDITIONS.reduce((a, i) => ({ ...a, [i.key]: false }), {}),
    uc_other: false, uc_other_text: '',
    ...UNSAFE_ACTS.reduce((a, i) => ({ ...a, [i.key]: false }), {}),
    ua_other: false, ua_other_text: '',
    unsafe_reported_before: '', similar_incidents_before: '',
    root_cause_why1: '', root_cause_why2: '', root_cause_why3: '', root_cause_why4: '', root_cause_why5: '',
    root_cause_summary: '',
    immediate_causes: '', unsafe_acts: '', unsafe_conditions: '',

    // Section D - Corrective actions
    ...CORRECTIVE_OPTIONS.reduce((a, i) => ({ ...a, [i.key]: false }), {}),
    ca_other: false, ca_other_text: '',
    preventive_measures: '', lessons_learned: '',
    // Corrective actions table
    ca_action1: '', ca_responsible1: '', ca_due1: '', ca_status1: 'open',
    ca_action2: '', ca_responsible2: '', ca_due2: '', ca_status2: 'open',
    ca_action3: '', ca_responsible3: '', ca_due3: '', ca_status3: 'open',
    // Approval
    management_review_by: '', management_review_date: '', management_comments: '',
    sheq_review_by: '', sheq_review_date: '',
    category: 'other',

    ...initial
  });

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    onSubmit({
      ...form,
      status: form.status || 'open',
      // map brief_description to description if description empty
      description: form.description || form.brief_description,
      unsafe_acts: UNSAFE_ACTS.filter(i => form[i.key]).map(i => i.label).join('; '),
      unsafe_conditions: UNSAFE_CONDITIONS.filter(i => form[i.key]).map(i => i.label).join('; '),
    });
  };

  const stepValid = () => {
    if (step === 1) return form.title && form.date_occurred && form.location;
    return true;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Steps */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = s.id < step;
          const active = s.id === step;
          return (
            <div key={s.id} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => done && setStep(s.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  active ? "bg-primary text-primary-foreground shadow-sm" :
                  done ? "bg-emerald-100 text-emerald-700 cursor-pointer" :
                  "bg-muted text-muted-foreground cursor-default"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">

        {/* ===== SECTION A ===== */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-xs text-primary font-semibold">
              SECTION A — INCIDENT NOTIFICATION / THÔNG BÁO SỰ CỐ
              <p className="font-normal text-muted-foreground mt-0.5">Bộ phận liên quan hoàn thành và gửi email cho Safety Officer, SHEQ Manager & GM trong vòng 24 giờ sau khi xảy ra sự cố</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <F label="Report No. / Số báo cáo">
                <Input placeholder="VD: INC-2026-001" value={form.report_no} onChange={e => upd('report_no', e.target.value)} />
              </F>
              <F label="Tiêu đề sự cố" required>
                <Input placeholder="Mô tả ngắn gọn về sự cố..." value={form.title} onChange={e => upd('title', e.target.value)} />
              </F>
            </div>

            <SectionTitle>1. Type of Incident / Loại sự cố</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {INCIDENT_TYPES.map(o => (
                <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="incident_type"
                    value={o.value}
                    checked={form.incident_type === o.value}
                    onChange={() => upd('incident_type', o.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <F label="2. Location / Vị trí" required>
                <Input placeholder="VD: Khu A, Tầng 3, Phân xưởng 2" value={form.location} onChange={e => upd('location', e.target.value)} />
              </F>
              <F label="Department / Phòng ban">
                <Input value={form.department} onChange={e => upd('department', e.target.value)} />
              </F>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <F label="3. Date / Ngày xảy ra" required>
                <Input type="date" value={form.date_occurred} onChange={e => upd('date_occurred', e.target.value)} />
              </F>
              <F label="Time / Giờ xảy ra">
                <Input type="time" value={form.time_occurred} onChange={e => upd('time_occurred', e.target.value)} />
              </F>
              <F label="Date Reported / Ngày báo cáo">
                <Input type="date" value={form.date_reported} onChange={e => upd('date_reported', e.target.value)} />
              </F>
            </div>

            <SectionTitle>4. Involvement / Sự liên quan</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <F label="Personnel / Nhân sự">
                <Select value={form.involvement_personnel} onValueChange={v => upd('involvement_personnel', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['NORTALIC','CONTRACTOR','VISITOR','OTHERS'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F label="Equipment / Thiết bị">
                <Select value={form.involvement_equipment} onValueChange={v => upd('involvement_equipment', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['NORTALIC','CONTRACTOR','VISITOR','OTHERS'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
            </div>

            <SectionTitle>5-6. Information of Casualty / Thông tin nạn nhân</SectionTitle>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-medium w-8">S/N</th>
                    <th className="text-left p-2 font-medium">Name / Tên</th>
                    <th className="text-left p-2 font-medium">Designation/Dept.</th>
                    <th className="text-left p-2 font-medium">Nature of Injury / Chấn thương</th>
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3].map(n => (
                    <tr key={n} className="border-t">
                      <td className="p-2 text-center text-muted-foreground">{n}</td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`victim_name${n > 1 ? n : ''}`] || ''} onChange={e => upd(`victim_name${n > 1 ? n : ''}`, e.target.value)} /></td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`victim_position${n > 1 ? n : ''}`] || ''} onChange={e => upd(`victim_position${n > 1 ? n : ''}`, e.target.value)} /></td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`nature_of_injury${n > 1 ? n : ''}`] || ''} onChange={e => upd(`nature_of_injury${n > 1 ? n : ''}`, e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <F label="Body part affected / Bộ phận cơ thể bị ảnh hưởng">
                <Input placeholder="VD: Tay trái, chân phải, đầu..." value={form.body_part_affected} onChange={e => upd('body_part_affected', e.target.value)} />
              </F>
              <F label="Treatment provided / Điều trị đã thực hiện">
                <Input placeholder="Sơ cứu tại chỗ, chuyển viện..." value={form.treatment_provided} onChange={e => upd('treatment_provided', e.target.value)} />
              </F>
              <F label="Lost Time Days / Ngày mất việc">
                <Input type="number" min="0" value={form.lost_time_days} onChange={e => upd('lost_time_days', e.target.value)} />
              </F>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg mt-5">
                <Label className="text-sm font-medium">Lost Time Injury (LTI)?</Label>
                <Switch checked={!!form.is_lti} onCheckedChange={v => upd('is_lti', v)} />
              </div>
            </div>

            <SectionTitle>7. Brief Description / Tóm tắt sự cố</SectionTitle>
            <Textarea rows={3} placeholder="Tóm tắt sự cố xảy ra như thế nào..." value={form.brief_description} onChange={e => upd('brief_description', e.target.value)} />

            <SectionTitle>8. Reported By / Người báo cáo</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <F label="Name / Tên">
                <Input value={form.reported_by} onChange={e => upd('reported_by', e.target.value)} />
              </F>
              <F label="Designation / Chức danh">
                <Input value={form.reported_by_position} onChange={e => upd('reported_by_position', e.target.value)} />
              </F>
              <F label="Supervisor / Người giám sát">
                <Input value={form.supervisor_name} onChange={e => upd('supervisor_name', e.target.value)} />
              </F>
            </div>

            <SectionTitle>9. Email Distribution / Gửi email tới</SectionTitle>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'email_safety_officer', label: 'Safety Officer' },
                { key: 'email_sheq_manager', label: 'SHEQ Manager' },
                { key: 'email_gm', label: 'General Manager' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={!!form[item.key]} onCheckedChange={v => upd(item.key, v)} />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ===== SECTION B ===== */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-800 font-semibold">
              SECTION B — INCIDENT INVESTIGATION / ĐIỀU TRA SỰ CỐ
              <p className="font-normal mt-0.5">Đội điều tra hoàn tất và gửi email cho SHEQ Manager & GM trong vòng 7 ngày kể từ khi xảy ra sự cố</p>
            </div>

            <SectionTitle>1. Investigation Team / Đội điều tra</SectionTitle>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left w-8">S/N</th>
                    <th className="p-2 text-left">Name / Tên</th>
                    <th className="p-2 text-left">Department / Bộ phận</th>
                    <th className="p-2 text-left">Designation / Chức danh</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dept: 'SHEQ Safety' }, { dept: 'Affected Process Dept.' }, { dept: 'HR' }, { dept: '' }, { dept: '' }
                  ].map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-center text-muted-foreground">{i + 1}</td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`inv_name${i+1}`] || ''} onChange={e => upd(`inv_name${i+1}`, e.target.value)} /></td>
                      <td className="p-1"><Input className="h-7 text-sm" defaultValue={row.dept} value={form[`inv_dept${i+1}`] !== undefined ? form[`inv_dept${i+1}`] : row.dept} onChange={e => upd(`inv_dept${i+1}`, e.target.value)} /></td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`inv_designation${i+1}`] || ''} onChange={e => upd(`inv_designation${i+1}`, e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionTitle>2. Witness / Người chứng kiến</SectionTitle>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left w-8">S/N</th>
                    <th className="p-2 text-left">Name / Tên</th>
                    <th className="p-2 text-left">Department / Bộ phận</th>
                    <th className="p-2 text-left">Designation / Chức danh</th>
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3].map(i => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-center text-muted-foreground">{i}</td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`wit_name${i}`] || ''} onChange={e => upd(`wit_name${i}`, e.target.value)} /></td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`wit_dept${i}`] || ''} onChange={e => upd(`wit_dept${i}`, e.target.value)} /></td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`wit_designation${i}`] || ''} onChange={e => upd(`wit_designation${i}`, e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SectionTitle>3. Description of Incident / Mô tả sự cố</SectionTitle>
            <Textarea
              rows={5}
              placeholder="Mô tả từng bước các sự kiện dẫn đến sự cố. Bao gồm tên máy móc, thiết bị, vật liệu và các chi tiết quan trọng khác..."
              value={form.description}
              onChange={e => upd('description', e.target.value)}
            />
            <F label="Sequence of Events / Trình tự sự kiện" hint="Liệt kê theo thời gian">
              <Textarea rows={3} placeholder="08:00 - Bắt đầu công việc&#10;09:30 - Phát hiện vấn đề&#10;09:35 - Sự cố xảy ra..." value={form.sequence_of_events} onChange={e => upd('sequence_of_events', e.target.value)} />
            </F>
            <F label="Work activity at time of incident / Hoạt động lúc xảy ra">
              <Input placeholder="VD: Vận chuyển vật liệu bằng cẩu trục..." value={form.work_activity} onChange={e => upd('work_activity', e.target.value)} />
            </F>
            <F label="PPE being used / Bảo hộ đang sử dụng">
              <Input placeholder="VD: Mũ bảo hộ, găng tay, giày bảo hộ..." value={form.ppe_used} onChange={e => upd('ppe_used', e.target.value)} />
            </F>

            <div className="grid grid-cols-3 gap-3">
              <F label="Photographs / Ảnh chụp (số lượng)">
                <Input placeholder="VD: 3 ảnh" value={form.attachments_photos} onChange={e => upd('attachments_photos', e.target.value)} />
              </F>
              <F label="Witness Statements / Biên bản nhân chứng">
                <Input placeholder="VD: 2 biên bản" value={form.attachments_witness} onChange={e => upd('attachments_witness', e.target.value)} />
              </F>
              <F label="Maps/Drawings / Sơ đồ/bản vẽ">
                <Input placeholder="VD: 1 sơ đồ" value={form.attachments_maps} onChange={e => upd('attachments_maps', e.target.value)} />
              </F>
            </div>

            <SectionTitle>4. Category of Incident / Phân loại mức độ</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTIONS.map(o => (
                <label key={o.value} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-muted">
                  <input
                    type="radio"
                    name="severity"
                    value={o.value}
                    checked={form.severity === o.value}
                    onChange={() => upd('severity', o.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{o.label}</span>
                </label>
              ))}
            </div>

            <SectionTitle>5. Type of Loss / Loại thất thoát</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {LOSS_TYPES.map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={!!form[item.key]} onCheckedChange={v => upd(item.key, v)} />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
            <F label="Description of loss (quantity & cost) / Mô tả thất thoát (số lượng & chi phí ước tính)">
              <div className="grid grid-cols-2 gap-2">
                <Textarea rows={2} placeholder="Mô tả thiệt hại..." value={form.loss_description} onChange={e => upd('loss_description', e.target.value)} />
                <Input placeholder="Chi phí ước tính (VNĐ)" value={form.property_damage_cost} onChange={e => upd('property_damage_cost', e.target.value)} />
              </div>
            </F>
          </div>
        )}

        {/* ===== SECTION C - ROOT CAUSE ===== */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 font-semibold">
              SECTION C — ROOT CAUSE ANALYSIS / PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <SectionTitle>Unsafe Workplace Conditions / Điều kiện không an toàn</SectionTitle>
                <CheckGroup items={UNSAFE_CONDITIONS} form={form} upd={upd} otherKey="uc_other" otherLabel="Other / Khác:" />
              </div>
              <div>
                <SectionTitle>Unsafe Acts by People / Hành vi không an toàn</SectionTitle>
                <CheckGroup items={UNSAFE_ACTS} form={form} upd={upd} otherKey="ua_other" otherLabel="Other / Khác:" />
              </div>
            </div>

            <F label="Why did the unsafe conditions exist? / Tại sao điều kiện không an toàn tồn tại?">
              <Textarea rows={2} value={form.immediate_causes} onChange={e => upd('immediate_causes', e.target.value)} />
            </F>
            <F label="Why did the unsafe acts occur? / Tại sao hành vi không an toàn xảy ra?">
              <Textarea rows={2} value={form.unsafe_acts_reason} onChange={e => upd('unsafe_acts_reason', e.target.value)} />
            </F>

            <div className="grid grid-cols-2 gap-3">
              <F label="Were unsafe conditions reported prior to incident? / Đã báo cáo trước không?">
                <div className="flex gap-4 mt-1">
                  {['yes','no'].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="unsafe_reported_before" value={v} checked={form.unsafe_reported_before === v} onChange={() => upd('unsafe_reported_before', v)} className="accent-primary" />
                      <span className="text-sm capitalize">{v === 'yes' ? 'Yes / Có' : 'No / Không'}</span>
                    </label>
                  ))}
                </div>
              </F>
              <F label="Similar incidents or near misses before? / Đã có sự cố tương tự trước đây?">
                <div className="flex gap-4 mt-1">
                  {['yes','no'].map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="similar_incidents_before" value={v} checked={form.similar_incidents_before === v} onChange={() => upd('similar_incidents_before', v)} className="accent-primary" />
                      <span className="text-sm capitalize">{v === 'yes' ? 'Yes / Có' : 'No / Không'}</span>
                    </label>
                  ))}
                </div>
              </F>
            </div>

            <SectionTitle>5-Why Analysis / Phân tích 5 Tại sao</SectionTitle>
            {[1,2,3,4,5].map(n => (
              <div key={n} className="flex gap-3 items-start">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1",
                  form[`root_cause_why${n}`] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {n}
                </div>
                <div className="flex-1">
                  <Input
                    placeholder={
                      n === 1 ? "Tại sao sự cố xảy ra?" :
                      n === 2 ? "Tại sao nguyên nhân #1 xảy ra?" :
                      n === 3 ? "Tại sao nguyên nhân #2 xảy ra?" :
                      n === 4 ? "Tại sao nguyên nhân #3 xảy ra?" :
                      "Nguyên nhân gốc rễ cuối cùng (hệ thống/quản lý)"
                    }
                    value={form[`root_cause_why${n}`]}
                    onChange={e => upd(`root_cause_why${n}`, e.target.value)}
                  />
                </div>
              </div>
            ))}

            <F label="Root Cause Summary / Tóm tắt nguyên nhân gốc rễ">
              <Textarea rows={3} placeholder="Kết luận nguyên nhân gốc rễ được xác định là..." value={form.root_cause_summary} onChange={e => upd('root_cause_summary', e.target.value)} />
            </F>
          </div>
        )}

        {/* ===== SECTION D ===== */}
        {step === 4 && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-xs text-green-800 font-semibold">
              SECTION D — CORRECTIVE & PREVENTIVE ACTIONS / HÀNH ĐỘNG KHẮC PHỤC & NGĂN NGỪA
            </div>

            <SectionTitle>7. Suggested Corrective Actions / Đề xuất hành động khắc phục</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {CORRECTIVE_OPTIONS.map(item => (
                <label key={item.key} className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={!!form[item.key]} onCheckedChange={v => upd(item.key, v)} className="mt-0.5" />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
              <div className="flex items-center gap-2 col-span-2">
                <Checkbox checked={!!form.ca_other} onCheckedChange={v => upd('ca_other', v)} />
                <span className="text-sm">Other / Khác:</span>
                <Input className="h-7 text-sm flex-1" value={form.ca_other_text || ''} onChange={e => upd('ca_other_text', e.target.value)} />
              </div>
            </div>

            <SectionTitle>Action Plan / Kế hoạch hành động cụ thể</SectionTitle>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Action / Hành động</th>
                    <th className="p-2 text-left w-32">Responsible / Người phụ trách</th>
                    <th className="p-2 text-left w-28">Due Date / Hạn</th>
                    <th className="p-2 text-left w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[1,2,3,4].map(n => (
                    <tr key={n} className="border-t">
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`ca_action${n}`] || ''} onChange={e => upd(`ca_action${n}`, e.target.value)} /></td>
                      <td className="p-1"><Input className="h-7 text-sm" value={form[`ca_responsible${n}`] || ''} onChange={e => upd(`ca_responsible${n}`, e.target.value)} /></td>
                      <td className="p-1"><Input type="date" className="h-7 text-sm" value={form[`ca_due${n}`] || ''} onChange={e => upd(`ca_due${n}`, e.target.value)} /></td>
                      <td className="p-1">
                        <Select value={form[`ca_status${n}`] || 'open'} onValueChange={v => upd(`ca_status${n}`, v)}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <F label="Additional Preventive Measures / Biện pháp phòng ngừa bổ sung">
              <Textarea rows={3} value={form.preventive_measures} onChange={e => upd('preventive_measures', e.target.value)} />
            </F>
            <F label="Lessons Learned / Bài học kinh nghiệm">
              <Textarea rows={3} value={form.lessons_learned} onChange={e => upd('lessons_learned', e.target.value)} />
            </F>

            <SectionTitle>Approval / Phê duyệt</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <F label="SHEQ Reviewed by / SHEQ phê duyệt">
                <Input value={form.sheq_review_by} onChange={e => upd('sheq_review_by', e.target.value)} />
              </F>
              <F label="SHEQ Review Date">
                <Input type="date" value={form.sheq_review_date} onChange={e => upd('sheq_review_date', e.target.value)} />
              </F>
              <F label="Management Approved by / Quản lý phê duyệt">
                <Input value={form.management_review_by} onChange={e => upd('management_review_by', e.target.value)} />
              </F>
              <F label="Approval Date / Ngày phê duyệt">
                <Input type="date" value={form.management_review_date} onChange={e => upd('management_review_date', e.target.value)} />
              </F>
            </div>
            <F label="Management Comments / Nhận xét ban quản lý">
              <Textarea rows={2} value={form.management_comments} onChange={e => upd('management_comments', e.target.value)} />
            </F>

            {/* Summary */}
            <div className="mt-4 p-4 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" /> Tóm tắt báo cáo
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Số báo cáo', form.report_no],
                  ['Tiêu đề', form.title],
                  ['Ngày xảy ra', form.date_occurred],
                  ['Địa điểm', form.location],
                  ['Nạn nhân', form.victim_name],
                  ['LTI', form.is_lti ? '✓ Có' : '✗ Không'],
                  ['Người báo cáo', form.reported_by],
                  ['Chức danh', form.reported_by_position],
                ].map(([k,v]) => v ? (
                  <div key={k} className="flex gap-1">
                    <span className="text-muted-foreground">{k}:</span>
                    <span className="font-medium truncate">{v}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 mt-4 border-t">
        <Button type="button" variant="outline" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}>
          {step === 1 ? t('cancel') : <><ChevronLeft className="w-4 h-4 mr-1" /> Quay lại</>}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{step} / {STEPS.length}</span>
          {step < STEPS.length ? (
            <Button type="button" onClick={() => setStep(s => s + 1)} disabled={!stepValid()}>
              Tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} className="gap-2">
              <CheckCircle className="w-4 h-4" /> Lưu báo cáo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}