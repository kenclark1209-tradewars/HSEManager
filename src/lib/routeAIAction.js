/**
 * routeAIAction — phân luồng hành động AI theo automation_level
 * FULL_AUTO    → thực thi ngay
 * NEEDS_REVIEW → vào queue chờ HSE Officer duyệt
 * NEEDS_APPROVAL → vào queue chờ Manager duyệt
 */
import { base44 } from '@/api/base44Client';
import { validateToolInput } from './validateToolInput';

/**
 * @param {string} toolName
 * @param {object} inputData
 * @param {string} reasoning - lý do AI thực hiện hành động
 * @param {object} contextData - dữ liệu ngữ cảnh bổ sung
 * @param {string} requestedBy - "AI_SYSTEM" hoặc user email
 * @returns {{ queued: boolean, status: string, action_queue_id?: string, message: string }}
 */
export async function routeAIAction(toolName, inputData, reasoning, contextData = {}, requestedBy = 'AI_SYSTEM') {
  // Step 1: Validate input
  const validation = await validateToolInput(toolName, inputData);
  if (!validation.valid) {
    return {
      queued: false,
      status: 'VALIDATION_FAILED',
      message: `Validation thất bại: ${validation.errors?.join('; ')}`,
      errors: validation.errors,
    };
  }

  const tool = validation.tool;
  const automationLevel = tool?.automation_level || 'NEEDS_REVIEW';
  const displayName = tool?.display_name || toolName;
  const requiredRole = automationLevel === 'NEEDS_APPROVAL' ? 'manager' : 'hse_officer';

  // Step 2: Create queue record
  const queueRecord = await base44.entities.AIActionQueue.create({
    tool_name: toolName,
    display_name: displayName,
    input_data: inputData,
    ai_reasoning: reasoning || '',
    automation_level: automationLevel,
    status: automationLevel === 'FULL_AUTO' ? 'APPROVED' : 'PENDING',
    requested_by: requestedBy,
    context_data: contextData,
    required_role: requiredRole,
    action_id: `ACT-${Date.now()}`,
  });

  // Step 3: Route based on level
  if (automationLevel === 'FULL_AUTO') {
    // Execute immediately
    await base44.entities.AIActionQueue.update(queueRecord.id, {
      status: 'EXECUTED',
      executed_at: new Date().toISOString(),
    });

    return {
      queued: false,
      status: 'EXECUTED',
      action_queue_id: queueRecord.id,
      message: `✅ Hành động "${displayName}" đã được thực thi tự động.`,
    };
  }

  if (automationLevel === 'NEEDS_REVIEW') {
    // Notify HSE Officers via alert
    await base44.entities.AIAlert.create({
      type: 'reminder',
      severity: 'medium',
      title: `🔍 Cần xem xét: ${displayName}`,
      message: `AI đề xuất hành động "${displayName}". Lý do: ${reasoning || 'Không có'}. Mã: ${queueRecord.action_id}`,
      auto_created: true,
      status: 'active',
      related_entity: 'AIActionQueue',
      related_id: queueRecord.id,
    });

    return {
      queued: true,
      status: 'PENDING',
      action_queue_id: queueRecord.id,
      message: `⏳ Hành động đang chờ xem xét. Mã: ${queueRecord.action_id}`,
    };
  }

  if (automationLevel === 'NEEDS_APPROVAL') {
    // Notify Managers via alert
    await base44.entities.AIAlert.create({
      type: 'reminder',
      severity: 'high',
      title: `⚠️ Cần phê duyệt: ${displayName}`,
      message: `AI đề xuất hành động "${displayName}" cần phê duyệt từ quản lý. Lý do: ${reasoning || 'Không có'}. Mã: ${queueRecord.action_id}`,
      auto_created: true,
      status: 'active',
      related_entity: 'AIActionQueue',
      related_id: queueRecord.id,
    });

    return {
      queued: true,
      status: 'PENDING',
      action_queue_id: queueRecord.id,
      message: `🔐 Hành động cần phê duyệt từ cấp quản lý. Mã: ${queueRecord.action_id}`,
    };
  }

  return { queued: false, status: 'UNKNOWN', message: 'Automation level không xác định.' };
}