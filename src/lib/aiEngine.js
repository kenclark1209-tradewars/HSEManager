/**
 * HSE AI Engine — Virtual AI Manager
 * Autonomous monitoring, alerting, action creation
 */
import { base44 } from '@/api/base44Client';
import { isOverdue } from '@/lib/hseUtils';
import { format, addDays, subDays } from 'date-fns';

const AI = base44.integrations.Core;

// ─── Logging ──────────────────────────────────────────────────────
export function aiLog(type, message, data = {}) {
  const ts = new Date().toISOString();
  console.log(`[AI-ENGINE][${ts}][${type}]`, message, data);
}

// ─── Load config ──────────────────────────────────────────────────
export async function loadAIConfig() {
  const list = await base44.entities.AIConfig.filter({ key: 'global' });
  if (list.length > 0) return list[0];
  // default
  return {
    enabled: true,
    mode: 'proactive',
    auto_create_actions: true,
    auto_create_alerts: true,
    auto_suggest_sop: true,
    overdue_threshold: 3,
    incident_spike_threshold: 3,
    pattern_window_days: 30,
  };
}

// ─── Create alert (dedup by title) ────────────────────────────────
async function createAlert(type, severity, title, message, related_entity = '', related_id = '') {
  const existing = await base44.entities.AIAlert.filter({ title, status: 'active' });
  if (existing.length > 0) {
    aiLog('ALERT_SKIP', 'Duplicate active alert skipped', { title });
    return null;
  }
  const alert = await base44.entities.AIAlert.create({
    type, severity, title, message,
    auto_created: true, status: 'active',
    related_entity, related_id,
  });
  aiLog('ALERT_CREATE', title, { type, severity });
  return alert;
}

// ─── Create action ─────────────────────────────────────────────────
async function createAction(title, description, type = 'preventive', priority = 'high', due_days = 7) {
  const existing = await base44.entities.Action.filter({ title, status: 'open' });
  if (existing.length > 0) {
    aiLog('ACTION_SKIP', 'Duplicate action skipped', { title });
    return null;
  }
  const action = await base44.entities.Action.create({
    title,
    description,
    type,
    priority,
    status: 'open',
    due_date: format(addDays(new Date(), due_days), 'yyyy-MM-dd'),
  });
  aiLog('ACTION_CREATE', title, { type, priority });
  return action;
}

// ─── PHASE 2: KPI Monitoring ───────────────────────────────────────
export async function runKPIMonitor(cfg) {
  aiLog('KPI_SCAN', 'Starting KPI scan...');
  const [incidents, actions, risks] = await Promise.all([
    base44.entities.Incident.list('-created_date', 200),
    base44.entities.Action.list('-created_date', 200),
    base44.entities.Risk.list('-created_date', 100),
  ]);

  const openIncidents = incidents.filter(i => i.status !== 'closed');
  const overdueActions = actions.filter(a => a.status !== 'closed' && isOverdue(a.due_date));
  const highRisks = risks.filter(r => ['high', 'extreme'].includes(r.risk_level));

  aiLog('KPI_DATA', 'KPI loaded', {
    openIncidents: openIncidents.length,
    overdueActions: overdueActions.length,
    highRisks: highRisks.length,
  });

  // Alert: Many overdue actions
  if (overdueActions.length >= cfg.overdue_threshold) {
    await createAlert(
      'overdue_alert', 'high',
      `⚠️ ${overdueActions.length} hành động quá hạn`,
      `Hệ thống phát hiện ${overdueActions.length} hành động chưa hoàn thành quá hạn. Cần xem xét và xử lý ngay.`,
      'Action', ''
    );
    if (cfg.auto_create_actions) {
      await createAction(
        `[AI] Rà soát ${overdueActions.length} hành động quá hạn`,
        `AI phát hiện ${overdueActions.length} hành động quá hạn. Cần họp review và phân công lại.\n\nDanh sách: ${overdueActions.slice(0, 5).map(a => a.title).join(', ')}`,
        'corrective', 'high', 3
      );
    }
  }

  // Alert: High risk items
  if (highRisks.length > 0) {
    await createAlert(
      'risk_warning', 'high',
      `🔴 ${highRisks.length} rủi ro mức cao/cực cao chưa kiểm soát`,
      `Phát hiện ${highRisks.length} rủi ro mức cao: ${highRisks.slice(0, 3).map(r => r.title).join(', ')}`,
      'Risk', ''
    );
  }

  // Alert: Incident spike (last 7 days)
  const sevenDaysAgo = subDays(new Date(), 7);
  const recentIncidents = incidents.filter(i => i.created_date && new Date(i.created_date) >= sevenDaysAgo);
  if (recentIncidents.length >= cfg.incident_spike_threshold) {
    await createAlert(
      'kpi_breach', 'critical',
      `🚨 Tăng đột biến sự cố: ${recentIncidents.length} trong 7 ngày`,
      `Phát hiện ${recentIncidents.length} sự cố mới trong 7 ngày qua — vượt ngưỡng cảnh báo (${cfg.incident_spike_threshold}). Cần điều tra ngay.`,
      'Incident', ''
    );
  }

  return { openIncidents: openIncidents.length, overdueActions: overdueActions.length, highRisks: highRisks.length };
}

// ─── PHASE 5: Incident Pattern Detection ─────────────────────────
export async function runIncidentIntelligence(cfg) {
  aiLog('PATTERN_SCAN', 'Scanning incident patterns...');
  const incidents = await base44.entities.Incident.list('-date_occurred', 100);
  if (incidents.length < 3) return;

  // Group by location
  const byLocation = {};
  incidents.forEach(i => {
    if (!i.location) return;
    byLocation[i.location] = (byLocation[i.location] || []);
    byLocation[i.location].push(i);
  });

  for (const [loc, list] of Object.entries(byLocation)) {
    if (list.length >= 2) {
      const categories = list.map(i => i.category);
      const mostCommon = categories.sort((a, b) =>
        categories.filter(v => v === b).length - categories.filter(v => v === a).length
      )[0];

      await createAlert(
        'incident_pattern', 'high',
        `🔁 Pattern: ${list.length} sự cố tại "${loc}"`,
        `Phát hiện ${list.length} sự cố tại khu vực "${loc}" (loại phổ biến: ${mostCommon}). Cần đánh giá rủi ro khu vực này.`,
        'Incident', ''
      );

      if (cfg.auto_suggest_sop && cfg.auto_create_actions) {
        await createAction(
          `[AI] Đánh giá rủi ro khu vực "${loc}" — ${list.length} sự cố lặp lại`,
          `Pattern detection: ${list.length} incidents at "${loc}". Category: ${mostCommon}.\n\nYêu cầu: Đánh giá lại rủi ro, kiểm tra biện pháp kiểm soát, cân nhắc viết/cập nhật SOP.`,
          'preventive', 'high', 5
        );
      }
    }
  }
}

// ─── PHASE 6: SOP Auto-Improve ────────────────────────────────────
export async function runSOPImprove(cfg) {
  if (!cfg.auto_suggest_sop) return;
  aiLog('SOP_SCAN', 'Checking SOP vs recent incidents...');

  const [sops, incidents] = await Promise.all([
    base44.entities.SOP.list('-updated_date', 50),
    base44.entities.Incident.list('-date_occurred', 20),
  ]);

  // Check SOP not reviewed in 6+ months
  const sixMonthsAgo = subDays(new Date(), 180);
  for (const sop of sops) {
    if (sop.review_date && new Date(sop.review_date) < sixMonthsAgo) {
      await createAlert(
        'sop_outdated', 'medium',
        `📋 SOP hết hạn xem xét: "${sop.title}"`,
        `SOP "${sop.title}" (v${sop.version || '1.0'}) đã quá 6 tháng chưa được xem xét lại. Theo ISO 45001 Cl.8.1.`,
        'SOP', sop.id
      );
    }
  }
}

// ─── PHASE 7: Auto Reminder ────────────────────────────────────────
export async function runAutoReminder(cfg) {
  if (!cfg.auto_create_actions) return;
  aiLog('REMINDER_SCAN', 'Checking scheduled reminders...');

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Quarterly MSLĐ monitoring reminder (every 3 months on 1st)
  if (day === 1 && [1, 4, 7, 10].includes(month)) {
    await createAction(
      `[AI] Quan trắc môi trường lao động Q${Math.ceil(month / 3)}/${today.getFullYear()}`,
      'Theo NĐ 44/2016/NĐ-CP, tần suất quan trắc MTLĐ ít nhất 6 tháng/lần với yếu tố có hại thông thường và 3 tháng/lần với yếu tố nguy hiểm. AI nhắc nhở thực hiện đúng hạn.',
      'preventive', 'high', 14
    );
  }

  // Check actions due in 3 days
  const threeDays = addDays(today, 3);
  const actions = await base44.entities.Action.filter({ status: 'open' });
  const soonDue = actions.filter(a => {
    if (!a.due_date) return false;
    const d = new Date(a.due_date);
    return d >= today && d <= threeDays;
  });

  if (soonDue.length > 0) {
    await createAlert(
      'reminder', 'medium',
      `⏰ ${soonDue.length} hành động sắp đến hạn (3 ngày)`,
      `Các hành động sắp hết hạn: ${soonDue.map(a => a.title).slice(0, 5).join(', ')}`,
      'Action', ''
    );
  }
}

// ─── MASTER RUN ────────────────────────────────────────────────────
export async function runAIEngine() {
  aiLog('ENGINE_START', '🤖 HSE AI Engine starting...');
  const cfg = await loadAIConfig();
  if (!cfg.enabled) {
    aiLog('ENGINE_SKIP', 'AI disabled by config');
    return { skipped: true };
  }

  const results = {};
  results.kpi = await runKPIMonitor(cfg);
  if (cfg.mode === 'proactive') {
    await runIncidentIntelligence(cfg);
    await runSOPImprove(cfg);
    await runAutoReminder(cfg);
  }

  // Update last scan
  const existing = await base44.entities.AIConfig.filter({ key: 'global' });
  if (existing.length > 0) {
    await base44.entities.AIConfig.update(existing[0].id, { last_scan_date: new Date().toISOString() });
  } else {
    await base44.entities.AIConfig.create({ key: 'global', last_scan_date: new Date().toISOString(), ...cfg });
  }

  aiLog('ENGINE_DONE', '✅ HSE AI Engine completed', results);
  return results;
}