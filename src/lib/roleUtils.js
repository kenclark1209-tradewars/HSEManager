/**
 * Role-based permission system
 * Roles: manager | supervisor | employee
 */

export const ROLES = {
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  EMPLOYEE: 'employee',
};

const PERMISSIONS = {
  manager: [
    'create', 'read', 'update', 'delete',
    'close_incident', 'close_action',
    'assign', 'approve', 'approve_final',
    'create_plan', 'view_all',
    'manage_roles', 'ai_full',
  ],
  supervisor: [
    'create', 'read', 'update',
    'assign', 'approve_intermediate',
    'create_plan_draft', 'view_team',
    'ai_supervisor',
  ],
  employee: [
    'read', 'create_own', 'update_own',
    'upload_evidence', 'complete_task',
    'ai_employee',
  ],
};

export function getUserRole() {
  return localStorage.getItem('hse_role') || 'employee';
}

export function setUserRole(role) {
  localStorage.setItem('hse_role', role);
  console.log(`[ROLE] Role changed to: ${role}`);
}

export function can(permission, role = null) {
  const r = role || getUserRole();
  return PERMISSIONS[r]?.includes(permission) || false;
}

export function canClose(type, role = null) {
  const r = role || getUserRole();
  if (type === 'action') return r === 'manager'; // Only manager can CLOSE
  if (type === 'incident') return r === 'manager';
  return false;
}

export function canApprove(level = 'final', role = null) {
  const r = role || getUserRole();
  if (level === 'final') return r === 'manager';
  if (level === 'intermediate') return ['manager', 'supervisor'].includes(r);
  return false;
}

export function canAssign(role = null) {
  const r = role || getUserRole();
  return ['manager', 'supervisor'].includes(r);
}

// Action workflow — chuẩn ISO 45001
// Mở → Đang xử lý → Chờ duyệt hoàn thành → Theo dõi hiệu quả (30-60 ngày) → Đóng hoàn toàn
export const ACTION_WORKFLOW = {
  open: { next: 'in_progress', label: 'Bắt đầu xử lý', allowedRoles: ['manager', 'supervisor', 'employee'] },
  assigned: { next: 'in_progress', label: 'Bắt đầu xử lý', allowedRoles: ['manager', 'supervisor', 'employee'] },
  in_progress: { next: 'pending_approval', label: 'Nộp duyệt hoàn thành', allowedRoles: ['employee', 'supervisor'] },
  pending_approval: { next: 'effectiveness_monitoring', label: 'Duyệt hoàn thành', allowedRoles: ['manager', 'supervisor'] },
  completed: { next: 'effectiveness_monitoring', label: 'Theo dõi hiệu quả', allowedRoles: ['manager', 'supervisor'] },
  effectiveness_monitoring: { next: 'closed', label: 'Đóng hoàn toàn', allowedRoles: ['manager'] },
  closed: { next: null, label: 'Đã đóng hoàn toàn', allowedRoles: [] },
};

export function getNextStatus(currentStatus, role = null) {
  const r = role || getUserRole();
  const step = ACTION_WORKFLOW[currentStatus];
  if (!step || !step.allowedRoles.includes(r)) return null;
  return step.next;
}

export function getRoleLabel(role) {
  const labels = { manager: 'Quản lý', supervisor: 'Giám sát', employee: 'Nhân viên' };
  return labels[role] || role;
}

export function getRoleColor(role) {
  const colors = {
    manager: 'bg-purple-100 text-purple-800',
    supervisor: 'bg-blue-100 text-blue-800',
    employee: 'bg-green-100 text-green-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}