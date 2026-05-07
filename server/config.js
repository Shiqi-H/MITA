import 'dotenv/config';

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  port: parseInt(process.env.PORT || '3001', 10),
};

if (!config.openai.apiKey) {
  console.warn('[config] Warning: OPENAI_API_KEY is not set. LLM calls will fail.');
}
