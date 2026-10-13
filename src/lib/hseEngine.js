/**
 * HSE ENGINE — Central workflow connector
 * Connects: PDCA ↔ Incident ↔ Risk ↔ Action ↔ Regulation ↔ AI
 */
import { base44 } from '@/api/base44Client';
import { format, addDays } from 'date-fns';
import { routeAIAction } from './routeAIAction';

const AI = base44.integrations.Core;

function log(event, msg, data = {}) {
  console.log(`[HSE-ENGINE][${new Date().toISOString()}][${event}]`, msg, data);
}

// ─── Shared helpers ────────────────────────────────────────────────

async function safeCreateAction(payload) {
  const existing = await base44.entities.Action.filter({ title: payload.title, status: 'open' });
  if (existing.length > 0) {
    log('ACTION_SKIP', 'Duplicate', { title: payload.title });
    return existing[0];
  }
  const action = await base44.entities.Action.create(payload);
  log('ACTION_CREATE', payload.title, { type: payload.type, priority: payload.priority });
  return action;
}

async function safeCreateRisk(payload) {
  const existing = await base44.entities.Risk.filter({ title: payload.title });
  if (existing.length > 0) {
    log('RISK_SKIP', 'Duplicate', { title: payload.title });
    return existing[0];
  }
  const risk = await base44.entities.Risk.create(payload);
  log('RISK_CREATE', payload.title, { risk_level: payload.risk_level });
  return risk;
}

async function safeCreateAlert(type, severity, title, message, related_entity = '', related_id = '') {
  const existing = await base44.entities.AIAlert.filter({ title, status: 'active' });
  if (existing.length > 0) return existing[0];
  const alert = await base44.entities.AIAlert.create({
    type, severity, title, message, auto_created: true, status: 'active', related_entity, related_id,
  });
  log('ALERT_CREATE', title, { type, severity });
  return alert;
}

// ─── 1. PDCA PLAN → Create Hazard/Risk/Control/Action ─────────────

export async function pdcaPlanToWorkflow(categoryId, categoryName) {
  log('PDCA_PLAN', `Generating PLAN workflow for category: ${categoryName}`);

  const prompt = `Bạn là chuyên gia HSE ISO 45001. Phân tích hạng mục HSE: "${categoryName}".
Tạo ra:
1. 2 mối nguy hại (hazard) tiềm ẩn
2. Đánh giá rủi ro (risk) tương ứng (likelihood 1-5, impact 1-5, risk_level: low/medium/high/extreme)
3. Biện pháp kiểm soát (control measure)
4. Hành động khắc phục (corrective action)

Trả về JSON.`;

  const schema = {
    type: 'object',
    properties: {
      hazards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            likelihood: { type: 'number' },
            impact: { type: 'number' },
            risk_level: { type: 'string' },
            control_measure: { type: 'string' },
            action_title: { type: 'string' },
            action_description: { type: 'string' },
          }
        }
      }
    }
  };

  const res = await AI.InvokeLLM({ prompt, response_json_schema: schema });
  log('PDCA_AI_RESULT', 'AI PLAN response', res);

  const created = { risks: [], actions: [] };
  for (const h of (res.hazards || [])) {
    const score = (h.likelihood || 3) * (h.impact || 3);
    const risk = await safeCreateRisk({
      title: h.title,
      description: h.description || '',
      category: 'safety',
      likelihood: h.likelihood || 3,
      impact: h.impact || 3,
      risk_score: score,
      risk_level: h.risk_level || 'medium',
      mitigation_plan: h.control_measure || '',
      status: 'identified',
    });
    created.risks.push(risk);

    if (h.action_title) {
      const action = await safeCreateAction({
        title: h.action_title,
        description: h.action_description || h.control_measure || '',
        type: 'preventive',
        priority: ['high', 'extreme'].includes(h.risk_level) ? 'high' : 'medium',
        status: 'open',
        linked_risk_id: risk.id,
        due_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
      });
      created.actions.push(action);
    }
  }

  // Create PDCA Plan record
  await base44.entities.PDCARecord.create({
    hse_category_id: categoryId,
    hse_category_name: categoryName,
    phase: 'plan',
    title: `[AI] Nhận diện mối nguy & đánh giá rủi ro — ${categoryName}`,
    description: `Tạo tự động bởi HSE Engine. ${created.risks.length} rủi ro, ${created.actions.length} hành động.`,
    objectives: 'Nhận diện mối nguy, đánh giá rủi ro, lập biện pháp kiểm soát',
    status: 'in_progress',
    ai_generated: true,
    completion_percent: 25,
  });

  log('PDCA_PLAN_DONE', `Created ${created.risks.length} risks, ${created.actions.length} actions`);
  return created;
}

// ─── 2. PDCA DO → Execute Actions ────────────────────────────────

export async function pdcaDoPhase(categoryId, categoryName) {
  log('PDCA_DO', `Triggering DO phase for: ${categoryName}`);

  const actions = await base44.entities.Action.filter({ status: 'open' });
  const relevant = actions.slice(0, 5);

  await base44.entities.PDCARecord.create({
    hse_category_id: categoryId,
    hse_category_name: categoryName,
    phase: 'do',
    title: `[AI] Triển khai ${relevant.length} hành động — ${categoryName}`,
    description: `DO phase: ${relevant.map(a => a.title).join('; ')}`,
    objectives: 'Thực hiện các biện pháp kiểm soát đã lập kế hoạch',
    status: 'in_progress',
    ai_generated: true,
    completion_percent: 0,
  });

  // Transition open → assigned
  for (const a of relevant) {
    await base44.entities.Action.update(a.id, { status: 'assigned' });
    log('ACTION_ASSIGNED', a.title);
  }

  return { assigned: relevant.length };
}

// ─── 3. PDCA CHECK → Verify completion ───────────────────────────

export async function pdcaCheckPhase(categoryId, categoryName) {
  log('PDCA_CHECK', `Running CHECK phase for: ${categoryName}`);

  const actions = await base44.entities.Action.list('-created_date', 50);
  const overdueActions = actions.filter(a =>
    a.status !== 'closed' && a.due_date && new Date(a.due_date) < new Date()
  );
  const completedActions = actions.filter(a => ['completed', 'closed'].includes(a.status));
  const completionRate = actions.length > 0 ? Math.round(completedActions.length / actions.length * 100) : 0;

  await base44.entities.PDCARecord.create({
    hse_category_id: categoryId,
    hse_category_name: categoryName,
    phase: 'check',
    title: `[AI] Kiểm tra hiệu quả — ${categoryName}`,
    description: `Tỷ lệ hoàn thành: ${completionRate}%. Quá hạn: ${overdueActions.length} hành động.`,
    objectives: 'Đánh giá hiệu quả thực hiện các biện pháp kiểm soát',
    status: completionRate >= 80 ? 'completed' : 'in_progress',
    ai_generated: true,
    completion_percent: completionRate,
  });

  if (overdueActions.length > 0) {
    await safeCreateAlert(
      'overdue_alert', 'high',
      `⚠️ CHECK: ${overdueActions.length} hành động quá hạn tại ${categoryName}`,
      `Phát hiện ${overdueActions.length} hành động chưa hoàn thành quá hạn. Cần xem xét ngay.`,
      'Action', ''
    );
  }

  return { completionRate, overdueActions: overdueActions.length };
}

// ─── 4. PDCA ACT → Improvement actions ───────────────────────────

export async function pdcaActPhase(categoryId, categoryName) {
  log('PDCA_ACT', `Running ACT phase for: ${categoryName}`);

  const prompt = `Dựa trên vòng PDCA cho hạng mục HSE "${categoryName}", đề xuất 2-3 hành động cải tiến cụ thể để nâng cao hiệu quả trong vòng PDCA tiếp theo.`;

  const schema = {
    type: 'object',
    properties: {
      improvements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
          }
        }
      }
    }
  };

  const res = await AI.InvokeLLM({ prompt, response_json_schema: schema });
  log('PDCA_ACT_AI', 'Improvements', res);

  const created = [];
  for (const imp of (res.improvements || [])) {
    const action = await safeCreateAction({
      title: `[CẢI TIẾN] ${imp.title}`,
      description: imp.description || '',
      type: 'improvement',
      priority: imp.priority || 'medium',
      status: 'open',
      due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    });
    created.push(action);
  }

  await base44.entities.PDCARecord.create({
    hse_category_id: categoryId,
    hse_category_name: categoryName,
    phase: 'act',
    title: `[AI] Cải tiến liên tục — ${categoryName}`,
    description: `${created.length} hành động cải tiến đã được tạo cho vòng PDCA tiếp theo.`,
    objectives: 'Cải tiến liên tục dựa trên kết quả kiểm tra',
    status: 'in_progress',
    ai_generated: true,
    completion_percent: 10,
  });

  return { improvements: created.length };
}

// ─── 5. REGULATION → Risk + Action ───────────────────────────────

export async function regulationToRiskAction(regulation) {
  log('REG_TRIGGER', `Processing regulation: ${regulation.title}`);

  const prompt = `Quy định/luật mới: "${regulation.title}" (mã: ${regulation.code}).
Mô tả: ${regulation.description || 'Không có'}

Phân tích và tạo:
1. 2 rủi ro không tuân thủ (risk)
2. 2 hành động khắc phục (corrective action) cụ thể để đảm bảo tuân thủ

Trả về JSON.`;

  const schema = {
    type: 'object',
    properties: {
      risks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            risk_level: { type: 'string' },
            likelihood: { type: 'number' },
            impact: { type: 'number' },
          }
        }
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          }
        }
      }
    }
  };

  const res = await AI.InvokeLLM({ prompt, response_json_schema: schema });
  log('REG_AI_RESULT', 'AI response', res);

  const created = { risks: [], actions: [] };

  for (const r of (res.risks || [])) {
    const score = (r.likelihood || 3) * (r.impact || 3);
    const risk = await safeCreateRisk({
      title: `[${regulation.code}] ${r.title}`,
      description: r.description || '',
      category: 'safety',
      likelihood: r.likelihood || 3,
      impact: r.impact || 3,
      risk_score: score,
      risk_level: r.risk_level || 'high',
      status: 'identified',
      linked_regulation_ids: [regulation.id],
    });
    created.risks.push(risk);
  }

  for (const a of (res.actions || [])) {
    const action = await safeCreateAction({
      title: `[${regulation.code}] ${a.title}`,
      description: a.description || '',
      type: 'corrective',
      priority: 'high',
      status: 'open',
      due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    });
    created.actions.push(action);
  }

  await safeCreateAlert(
    'compliance_gap', 'high',
    `📜 Quy định mới cần tuân thủ: ${regulation.code}`,
    `Đã tạo ${created.risks.length} rủi ro và ${created.actions.length} hành động để đảm bảo tuân thủ "${regulation.title}"`,
    'Regulation', regulation.id
  );

  log('REG_DONE', `Created ${created.risks.length} risks, ${created.actions.length} actions`);
  return created;
}

// ─── 6. INCIDENT → Root Cause → Corrective Action → PDCA update ─

export async function incidentToImprovement(incident) {
  log('INCIDENT_TRIGGER', `Analyzing incident: ${incident.title}`);

  const prompt = `Phân tích sự cố HSE sau:
Tiêu đề: ${incident.title}
Mức độ: ${incident.severity}
Mô tả: ${incident.description || 'Không có'}
Địa điểm: ${incident.location || 'Không có'}
Nguyên nhân trực tiếp: ${incident.immediate_causes || 'Chưa xác định'}

Thực hiện phân tích root cause và tạo:
1. Phân tích 5-Why ngắn gọn
2. Nguyên nhân gốc rễ (root_cause_summary)
3. 3 hành động khắc phục cụ thể (corrective actions)
4. 1 biện pháp phòng ngừa cho PDCA

Trả về JSON.`;

  const schema = {
    type: 'object',
    properties: {
      root_cause_summary: { type: 'string' },
      why_analysis: { type: 'string' },
      corrective_actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
            due_days: { type: 'number' },
          }
        }
      },
      pdca_improvement: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          objectives: { type: 'string' },
        }
      }
    }
  };

  const res = await AI.InvokeLLM({ prompt, response_json_schema: schema });
  log('INCIDENT_AI_RESULT', 'Root cause analysis', res);

  // Update incident with root cause
  if (res.root_cause_summary) {
    await base44.entities.Incident.update(incident.id, {
      root_cause_summary: res.root_cause_summary,
      investigation_findings: res.why_analysis || '',
      status: 'action_required',
    });
    log('INCIDENT_UPDATED', 'Root cause saved', { id: incident.id });
  }

  // Create corrective actions
  const created = [];
  for (const ca of (res.corrective_actions || [])) {
    const action = await safeCreateAction({
      title: `[${incident.report_no || 'INC'}] ${ca.title}`,
      description: ca.description || '',
      type: 'corrective',
      priority: ca.priority || 'high',
      status: 'open',
      linked_incident_id: incident.id,
      due_date: format(addDays(new Date(), ca.due_days || 7), 'yyyy-MM-dd'),
    });
    created.push(action);
  }

  // Create PDCA improvement record
  if (res.pdca_improvement?.title) {
    await base44.entities.PDCARecord.create({
      phase: 'act',
      title: `[INC→ACT] ${res.pdca_improvement.title}`,
      description: `Từ sự cố: ${incident.title}. Root cause: ${res.root_cause_summary || ''}`,
      objectives: res.pdca_improvement.objectives || '',
      status: 'draft',
      ai_generated: true,
      completion_percent: 0,
    });
    log('PDCA_ACT_CREATED', res.pdca_improvement.title);
  }

  // Create alert
  await safeCreateAlert(
    'incident_pattern', 'high',
    `🚨 Sự cố phân tích xong: ${incident.title}`,
    `Root cause: ${res.root_cause_summary || 'Đang phân tích'}. Đã tạo ${created.length} hành động khắc phục.`,
    'Incident', incident.id
  );

  log('INCIDENT_DONE', `Created ${created.length} corrective actions`);

  // Route assign_corrective_action through HITL queue for each action created
  if (created.length > 0) {
    await routeAIAction(
      'assign_corrective_action',
      {
        incident_id: incident.id,
        action_description: `${created.length} hành động khắc phục từ phân tích sự cố`,
        assignee_id: incident.assigned_to || 'UNASSIGNED',
        due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        priority: 'high',
      },
      `Sự cố "${incident.title}" (${incident.severity}) đã được phân tích. Root cause: ${res.root_cause_summary || 'Đang xác định'}. Cần phê duyệt phân công hành động khắc phục.`,
      { incident_id: incident.id, incident_title: incident.title, actions_count: created.length },
      'AI_SYSTEM'
    ).catch(err => log('ROUTE_ERROR', 'routeAIAction failed', err));
  }

  return { actions: created, root_cause: res.root_cause_summary };
}

// ─── 7. DOCUMENT UPLOAD → Parse → Risk + Checklist + Action ──────

export async function handleDocumentUpload(fileUrl, fileName, moduleId = '', module = 'sop') {
  log('DOC_UPLOAD', `Processing uploaded document: ${fileName}`);

  const prompt = `Bạn là chuyên gia HSE ISO 45001. Phân tích nội dung tài liệu HSE có tên: "${fileName}".
Dựa vào tên tài liệu, hãy tạo ra:
1. 2 rủi ro tiềm ẩn liên quan (risks)
2. 5 mục checklist kiểm tra (checklist_items)
3. 2 hành động cần thực hiện (actions)

Trả về JSON.`;

  const schema = {
    type: 'object',
    properties: {
      risks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            risk_level: { type: 'string' },
          }
        }
      },
      checklist_items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item: { type: 'string' },
            category: { type: 'string' },
          }
        }
      },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
          }
        }
      }
    }
  };

  const res = await AI.InvokeLLM({ prompt, response_json_schema: schema });
  log('DOC_AI_RESULT', 'Document analysis', res);

  const created = { risks: [], checklists: [], actions: [] };

  for (const r of (res.risks || [])) {
    const risk = await safeCreateRisk({
      title: `[DOC] ${r.title}`,
      description: r.description || '',
      category: 'safety',
      likelihood: 3, impact: 3, risk_score: 9,
      risk_level: r.risk_level || 'medium',
      status: 'identified',
    });
    created.risks.push(risk);
  }

  if (res.checklist_items?.length > 0) {
    const checklist = await base44.entities.Checklist.create({
      title: `[DOC] Checklist từ: ${fileName}`,
      items: res.checklist_items.map(ci => ({ item: ci.item, result: 'pending', note: '' })),
      status: 'active',
      module,
      module_id: moduleId,
    });
    log('CHECKLIST_CREATE', checklist.title);
    created.checklists.push(checklist);
  }

  for (const a of (res.actions || [])) {
    const action = await safeCreateAction({
      title: `[DOC] ${a.title}`,
      description: a.description || '',
      type: 'preventive',
      priority: a.priority || 'medium',
      status: 'open',
      due_date: format(addDays(new Date(), 21), 'yyyy-MM-dd'),
    });
    created.actions.push(action);
  }

  await safeCreateAlert(
    'reminder', 'medium',
    `📄 Tài liệu mới được tải lên: ${fileName}`,
    `Đã tạo ${created.risks.length} rủi ro, ${created.checklists.length} checklist, ${created.actions.length} hành động từ tài liệu.`,
    module, moduleId
  );

  log('DOC_DONE', `Created risks:${created.risks.length} checklists:${created.checklists.length} actions:${created.actions.length}`);
  return created;
}

// ─── 8. OVERDUE ACTIONS → Reminders ──────────────────────────────

export async function handleActionOverdue() {
  log('OVERDUE_SCAN', '🔍 Scanning for overdue actions...');

  const actions = await base44.entities.Action.list('-created_date', 200);
  const today = new Date();
  const overdue = actions.filter(a =>
    !['closed'].includes(a.status) && a.due_date && new Date(a.due_date) < today
  );

  log('OVERDUE_FOUND', `Found ${overdue.length} overdue actions`);

  const created = [];
  for (const a of overdue) {
    const daysOverdue = Math.floor((today - new Date(a.due_date)) / 86400000);
    const alert = await safeCreateAlert(
      'overdue_alert',
      daysOverdue > 7 ? 'critical' : daysOverdue > 3 ? 'high' : 'medium',
      `⏰ Quá hạn: ${a.title}`,
      `Hành động "${a.title}" đã quá hạn ${daysOverdue} ngày (hạn: ${a.due_date}). Người phụ trách: ${a.assigned_to || 'Chưa giao'}.`,
      'Action', a.id
    );
    created.push(alert);
  }

  log('OVERDUE_DONE', `Created ${created.length} reminder alerts`);
  return { overdueCount: overdue.length, alertsCreated: created.length };
}

// ─── MASTER ENGINE TRIGGER ────────────────────────────────────────

export async function runHSEEngine() {
  log('ENGINE_START', '🔥 HSE Engine full scan starting...');

  const [incidents, actions, risks] = await Promise.all([
    base44.entities.Incident.list('-created_date', 100),
    base44.entities.Action.list('-created_date', 100),
    base44.entities.Risk.list('-created_date', 50),
  ]);

  // Auto-analyze new incidents with no root cause
  const unresolvedIncidents = incidents.filter(i =>
    i.status === 'open' && !i.root_cause_summary
  );

  for (const inc of unresolvedIncidents.slice(0, 2)) {
    log('AUTO_INCIDENT', `Auto-analyzing: ${inc.title}`);
    await incidentToImprovement(inc);
  }

  log('ENGINE_DONE', '✅ HSE Engine completed', {
    unresolvedAnalyzed: Math.min(unresolvedIncidents.length, 2),
  });

  return { processed: Math.min(unresolvedIncidents.length, 2) };
}