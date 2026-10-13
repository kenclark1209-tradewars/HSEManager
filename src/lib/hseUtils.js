export function calculateRiskScore(likelihood, impact) {
  return Math.round((Number(likelihood) || 0) * (Number(impact) || 0) * 10) / 10;
}

export function formatRiskScore(score) {
  if (score === null || score === undefined || score === '') return '-';
  const n = Number(score);
  if (isNaN(n)) return '-';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function getRiskLevel(score) {
  if (score <= 4) return 'low';
  if (score <= 9) return 'medium';
  if (score <= 16) return 'high';
  return 'extreme';
}

export const severityColors = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
  extreme: 'bg-red-200 text-red-900',
};

export const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-sky-100 text-sky-800',
  investigating: 'bg-purple-100 text-purple-800',
  action_required: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-cyan-100 text-cyan-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  effectiveness_monitoring: 'bg-indigo-100 text-indigo-800',
  pending_evidence: 'bg-yellow-100 text-yellow-800',
  identified: 'bg-blue-100 text-blue-800',
  assessed: 'bg-indigo-100 text-indigo-800',
  mitigated: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-gray-100 text-gray-700',
  review: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-100 text-slate-600',
  active: 'bg-emerald-100 text-emerald-800',
  reviewed: 'bg-teal-100 text-teal-800',
};

export const priorityColors = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function canCloseIncident(actionsCount) {
  return actionsCount > 0;
}

export function canCloseAction(evidenceCount) {
  return evidenceCount > 0;
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function getUserRole() {
  return localStorage.getItem('hse_role') || 'employee';
}

export function hasPermission(role, action) {
  const perms = {
    manager: ['create', 'read', 'update', 'delete', 'close', 'assign', 'approve'],
    supervisor: ['create', 'read', 'update', 'assign'],
    employee: ['read', 'create_own', 'update_own'],
  };
  return perms[role]?.includes(action) || false;
}