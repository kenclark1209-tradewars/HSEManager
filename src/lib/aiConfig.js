// AI Configuration management
const CONFIG_KEY = 'hse_ai_config';

export const AI_PROVIDERS = [
  {
    id: 'base44',
    label: 'Base44 AI (Miễn phí)',
    description: 'Dùng AI tích hợp sẵn của nền tảng Base44',
    requiresKey: false,
    models: ['automatic'],
  },
  {
    id: 'base44_pro',
    label: 'Base44 AI Pro (Chất lượng cao)',
    description: 'Claude Sonnet 4 - phân tích sâu, độ chính xác cao hơn',
    requiresKey: false,
    models: ['claude_sonnet_4_6'],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter (Tùy chọn mô hình)',
    description: 'Kết nối hàng trăm mô hình AI qua OpenRouter API',
    requiresKey: true,
    keyLabel: 'OpenRouter API Key',
    keyPlaceholder: 'sk-or-v1-...',
    models: [
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'anthropic/claude-3.5-sonnet',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-r1:free',
      'mistralai/mistral-nemo:free',
    ],
  },
  {
    id: 'local',
    label: 'Local AI (Ollama)',
    description: 'Chạy AI cục bộ với Ollama - bảo mật tuyệt đối',
    requiresKey: false,
    requiresEndpoint: true,
    endpointPlaceholder: 'http://localhost:11434',
    models: ['llama3.2', 'mistral', 'qwen2.5', 'phi3'],
  },
];

export function getAIConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    provider: 'base44',
    model: 'automatic',
    apiKey: '',
    endpoint: '',
    temperature: 0.3,
  };
}

export function saveAIConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getProviderInfo(providerId) {
  return AI_PROVIDERS.find(p => p.id === providerId) || AI_PROVIDERS[0];
}