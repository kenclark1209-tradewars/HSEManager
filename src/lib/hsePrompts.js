// HSE Expert System Prompts - Vietnam labor safety standards
export const HSE_EXPERT_SYSTEM_PROMPT = `Bạn là chuyên gia HSE Manager với hơn 15 năm kinh nghiệm vận hành hệ thống An toàn - Sức khoẻ - Môi trường tại Việt Nam.

CHUYÊN MÔN:
- Luật An toàn vệ sinh lao động số 84/2015/QH13 và các Nghị định hướng dẫn
- Nghị định 39/2016/NĐ-CP (kiểm định MLAN, thiết bị có yêu cầu nghiêm ngặt)  
- Thông tư 07/2016/TT-BLĐTBXH (huấn luyện ATVSLĐ - 6 nhóm đối tượng)
- QCVN 01:2022/BYT, QCVN 08:2022/BYT (môi trường lao động)
- Nghị định 44/2016/NĐ-CP (quan trắc môi trường lao động)
- ISO 45001:2018 (OHSMS), ISO 14001:2015 (EMS), ISO 9001:2015
- OSHA 29 CFR 1910/1926, ILO Conventions
- Phương pháp: HAZOP, FMEA, Bowtie, 5 Whys, Fault Tree Analysis
- KPIs: LTIFR, TRIFR, DART, Near Miss Rate, Safety Observation Rate

NHIỆM VỤ HỆ THỐNG:
- Hỗ trợ phân tích sự cố theo phương pháp điều tra chuyên nghiệp
- Viết SOP/quy trình theo tiêu chuẩn ISO và pháp luật VN
- Đánh giá rủi ro và đề xuất biện pháp kiểm soát (Hierarchy of Controls)
- Kiểm tra tuân thủ pháp luật ATVSLĐ Việt Nam
- Tạo hành động khắc phục SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Nhắc nhở lịch kiểm định, huấn luyện, quan trắc định kỳ

NGUYÊN TẮC:
- Luôn ưu tiên an toàn con người trước tài sản
- Trích dẫn cụ thể điều khoản pháp luật khi cần
- Đề xuất thực tế, khả thi trong bối cảnh doanh nghiệp VN
- Sử dụng thuật ngữ HSE chuyên nghiệp song ngữ Việt-Anh khi phù hợp`;

export const INTENT_DETECTION_SCHEMA = {
  type: 'object',
  properties: {
    intent: {
      type: 'string',
      description: 'One of: create_action, analyze_incident, write_sop, set_reminder, audit_compliance, extract_document, general_answer'
    },
    data: { type: 'object', description: 'Structured data for the intent' },
    message: { type: 'string', description: 'Human-readable response to show the user' },
    citations: { type: 'array', items: { type: 'string' }, description: 'Legal/standard references used' }
  },
  required: ['intent', 'message']
};

export const ACTION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    type: { type: 'string', enum: ['corrective', 'preventive', 'improvement'] },
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    assigned_to: { type: 'string' },
    due_date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
  },
  required: ['title', 'description', 'type', 'priority']
};

export const SOP_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string', enum: ['safety', 'health', 'environmental', 'emergency', 'general'] },
    content: { type: 'string', description: 'Full SOP content in Markdown' },
    version: { type: 'string' },
  },
  required: ['title', 'content', 'category']
};

export const INCIDENT_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    immediate_causes: { type: 'string' },
    unsafe_acts: { type: 'string' },
    unsafe_conditions: { type: 'string' },
    root_cause_why1: { type: 'string' },
    root_cause_why2: { type: 'string' },
    root_cause_why3: { type: 'string' },
    root_cause_why4: { type: 'string' },
    root_cause_why5: { type: 'string' },
    root_cause_technical: { type: 'string' },
    root_cause_human: { type: 'string' },
    root_cause_systemic: { type: 'string' },
    root_cause_procedural: { type: 'string' },
    root_cause_training: { type: 'string' },
    root_cause_summary: { type: 'string' },
    preventive_measures: { type: 'string' },
    lessons_learned: { type: 'string' },
    regulation_reference: { type: 'string' },
    suggested_actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: { type: 'string' },
          priority: { type: 'string' },
          description: { type: 'string' },
          due_days: { type: 'number' }
        }
      }
    }
  }
};

export const COMPLIANCE_AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          regulation_code: { type: 'string' },
          requirement: { type: 'string' },
          compliance_status: { type: 'string', enum: ['compliant', 'partial', 'non_compliant', 'not_applicable'] },
          gap_description: { type: 'string' },
          action_plan: { type: 'string' },
          deadline: { type: 'string' },
          responsible_person: { type: 'string' },
        }
      }
    }
  }
};

export const REMINDER_SCHEMA = {
  type: 'object',
  properties: {
    reminders: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['corrective', 'preventive', 'improvement'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          assigned_to: { type: 'string' },
          due_date: { type: 'string' },
        }
      }
    },
    message: { type: 'string' }
  }
};

export const LEGAL_RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    topic_summary: { type: 'string', description: 'Tóm tắt ngắn về chủ đề nghiên cứu và bối cảnh pháp lý' },
    documents: {
      type: 'array',
      description: 'Danh sách văn bản pháp luật liên quan tìm được (luật, nghị định, thông tư, QCVN, TCVN)',
      items: {
        type: 'object',
        properties: {
          doc_code: { type: 'string', description: 'Mã ngắn gọn, VD: ND-39-2016, TT-07-2016, QCVN-01-2022' },
          doc_type: { type: 'string', enum: ['LUAT', 'NGHI_DINH', 'THONG_TU', 'QUYET_DINH', 'QCVN', 'TCVN', 'TIEU_CHUAN_QT'] },
          doc_number: { type: 'string', description: 'Số hiệu đầy đủ, VD: 39/2016/NĐ-CP' },
          doc_name: { type: 'string', description: 'Tên đầy đủ văn bản' },
          issuing_body: { type: 'string' },
          effective_date: { type: 'string', description: 'YYYY-MM-DD nếu biết, để trống nếu không rõ' },
          official_url: { type: 'string', description: 'URL văn bản gốc (thuvienphapluat, vanban, luatvietnam...)' },
          summary: { type: 'string', description: 'Tóm tắt nội dung và phạm vi áp dụng (2-3 câu)' },
          applicable_categories: { type: 'array', items: { type: 'string' }, description: 'Mã HSECategory áp dụng, VD: FIRE_SAFETY, PPE' },
          is_mandatory: { type: 'boolean' }
        },
        required: ['doc_code', 'doc_name', 'doc_type']
      }
    },
    key_obligations: {
      type: 'array',
      description: 'Nghĩa vụ pháp lý chính doanh nghiệp phải thực hiện',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          related_doc: { type: 'string', description: 'Mã văn bản liên quan' },
          frequency: { type: 'string', description: 'Tần suất thực hiện, VD: 6 tháng/lần, hàng năm' },
          evidence_required: { type: 'string', description: 'Hồ sơ/bằng chứng cần lưu' },
          action_required: { type: 'string', description: 'Hành động cụ thể doanh nghiệp cần làm' }
        },
        required: ['title', 'description']
      }
    },
    action_plan: {
      type: 'array',
      description: 'Kế hoạch hành động cụ thể để tuân thủ',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['corrective', 'preventive', 'improvement'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          due_days: { type: 'number', description: 'Số ngày đề nghị hoàn thành kể từ hôm nay' },
          related_doc: { type: 'string' }
        },
        required: ['title', 'type', 'priority']
      }
    },
    implementation_steps: {
      type: 'array',
      description: 'Các bước triển khai thực tế để làm đúng',
      items: { type: 'string' }
    },
    risks_and_penalties: { type: 'string', description: 'Rủi ro pháp lý và chế tài xử phạt nếu không tuân thủ' },
    message: { type: 'string', description: 'Báo cáo tổng hợp bằng Markdown cho người dùng' }
  },
  required: ['topic_summary', 'documents', 'message']
};

export const LEGAL_RESEARCH_SYSTEM_PROMPT = `Bạn là chuyên gia pháp luật ATVSLĐ Việt Nam với hơn 15 năm tư vấn cho doanh nghiệp.

NHIỆM VỤ NGHIÊN CỨU PHÁP LUẬT:
- TÌM KIẾM trên internet các văn bản pháp luật Việt Nam ĐANG HIỆU LỰC liên quan đến chủ đề người dùng nêu
- Bao gồm: Luật, Nghị định, Thông tư, Quyết định, QCVN (Quy chuẩn kỹ thuật quốc gia), TCVN (Tiêu chuẩn Việt Nam), tiêu chuẩn quốc tế (ISO, ILO)
- Ưu tiên văn bản mới nhất, đang hiệu lực, có liên quan TRỰC TIẾP đến ATVSLĐ
- Trích dẫn chính xác số hiệu, ngày ban hành, cơ quan ban hành, link văn bản gốc nếu có

PHÂN TÍCH VÀ ĐỀ XUẤT:
- Nghĩa vụ pháp lý chính doanh nghiệp phải thực hiện (key_obligations)
- Kế hoạch hành động SMART cụ thể (action_plan): What - Who - When - How
- Các bước triển khai thực tế theo thứ tự ưu tiên (implementation_steps)
- Rủi ro pháp lý và chế tài xử phạt (risks_and_penalties)

NGUYÊN TẮC:
- CHỈ liệt kê văn bản THẬT, không bịa ra số hiệu hoặc ngày tháng
- Nếu không chắc về chi tiết, bỏ trống trường đó thay vì đoán
- Link official_url phải là URL thật (thuvienphapluat.vn, vanban.chinhphu.vn, luatvietnam.vn...)
- Tránh văn bản đã hết hiệu lực, trừ khi cần đối chiếu
- Đề xuất phải khả thi trong bối cảnh doanh nghiệp Việt Nam
- Ngôn ngữ: Tiếng Việt chuyên nghiệp`;