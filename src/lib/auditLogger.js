/**
 * auditLogger — ghi lại mọi hành động quan trọng vào AuditLog entity
 */
import { base44 } from '@/api/base44Client';

/**
 * @param {object} params
 * @param {string} params.action_type - create | update | delete | approve | reject | execute | ai_action
 * @param {string} params.module - incident | action | risk | ...
 * @param {string} params.entity_id
 * @param {string} params.entity_name
 * @param {string} params.description
 * @param {object} [params.old_value]
 * @param {object} [params.new_value]
 * @param {string} [params.severity] - info | warning | critical
 * @param {boolean} [params.is_ai_action]
 * @param {string} [params.ai_tool_name]
 * @param {string} [params.performed_by]
 */
export async function logAction(params) {
  let performed_by = params.performed_by;
  if (!performed_by) {
    try {
      const me = await base44.auth.me();
      performed_by = me?.email || 'system';
    } catch {
      performed_by = 'system';
    }
  }

  await base44.entities.AuditLog.create({
    action_type: params.action_type || 'update',
    module: params.module || 'settings',
    entity_id: params.entity_id || '',
    entity_name: params.entity_name || '',
    performed_by,
    description: params.description || '',
    old_value: params.old_value || {},
    new_value: params.new_value || {},
    severity: params.severity || 'info',
    is_ai_action: params.is_ai_action || false,
    ai_tool_name: params.ai_tool_name || '',
  });
}

export async function logAIAction(toolName, displayName, status, reasoning, performedBy = 'AI_SYSTEM') {
  await base44.entities.AuditLog.create({
    action_type: 'ai_action',
    module: 'ai_queue',
    entity_name: displayName,
    performed_by: performedBy,
    description: `AI tool "${displayName}" - Trạng thái: ${status}. Lý do: ${reasoning || 'Không có'}`,
    severity: status === 'REJECTED' || status === 'FAILED' ? 'warning' : 'info',
    is_ai_action: true,
    ai_tool_name: toolName,
  });
}