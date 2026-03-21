// lib/ai-client.ts
// Centralized AI client factory for all API routes
// Simplified: local (Ollama) or cloud (OpenAI-compatible API)
// Default: local Ollama with qwen3-coder-next:latest

import { createOpenAI } from '@ai-sdk/openai';
import { auth } from '@/lib/auth';

// Types
export interface AIConfig {
  provider?: 'local' | 'cloud';
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

// ============================================================================
// 🔧 DEFAULT CONFIGURATION - Change these values to modify defaults
// ============================================================================
// 默认使用 MiniMax 云端 API
const DEFAULT_CLOUD_MODEL = 'MiniMax-M2.7-highspeed';
const DEFAULT_CLOUD_BASE_URL = 'https://api.minimaxi.com/v1';

// 本地 Ollama 配置（备选）
const DEFAULT_LOCAL_MODEL = 'qwen3-coder-next:latest';
const DEFAULT_LOCAL_BASE_URL = 'http://host.docker.internal:11434/v1';

// 默认 provider: 'cloud' 使用云端 API，'local' 使用本地 Ollama
const DEFAULT_PROVIDER: 'local' | 'cloud' = 'cloud';
// ============================================================================

/**
 * Extract API config from request body safely
 * Call this at the start of each API route
 */
export async function extractApiConfig(req: Request): Promise<{ apiConfig?: AIConfig; body: Record<string, unknown> }> {
  try {
    const body = await req.json();
    const { apiConfig, ...rest } = body;
    return { apiConfig, body: rest };
  } catch {
    return { body: {} };
  }
}

/**
 * Get user's saved API config from database (if logged in)
 * Safely handles cases where prisma is not available
 */
async function getDbConfig(userId?: string): Promise<AIConfig | null> {
  if (!userId) return null;

  try {
    // Dynamic import to avoid build-time issues
    const { prisma } = await import('@/lib/prisma');

    // Check if prisma and userSetting are available (note: singular 'userSetting')
    if (!prisma?.userSetting) {
      return null;
    }

    const userSettings = await prisma.userSetting.findUnique({
      where: { userId },
      select: { apiProvider: true, apiModel: true, apiKey: true, apiBaseUrl: true },
    });

    if (!userSettings) return null;

    // Map old provider values to new simplified values
    let provider = userSettings.apiProvider as string;
    if (provider === 'ollama') provider = 'local';
    else if (['openai', 'deepseek', 'custom'].includes(provider)) provider = 'cloud';

    return {
      provider: provider as AIConfig['provider'],
      model: userSettings.apiModel || undefined,
      apiKey: userSettings.apiKey || undefined,
      baseUrl: userSettings.apiBaseUrl || undefined,
    };
  } catch (error) {
    // Silently fail - this is optional enhancement, not critical
    console.error('Failed to fetch user API config:', error);
    return null;
  }
}

/**
 * Get environment variable config as fallback
 * Now defaults to cloud MiniMax
 */
function getEnvConfig(): AIConfig {
  const envProvider = process.env.AI_PROVIDER?.toLowerCase();

  // Determine provider from env, default to cloud
  let provider: 'local' | 'cloud' = DEFAULT_PROVIDER;
  if (envProvider === 'local' || envProvider === 'ollama') {
    provider = 'local';
  } else if (envProvider && ['openai', 'deepseek', 'cloud'].includes(envProvider)) {
    provider = 'cloud';
  }

  if (provider === 'local') {
    return {
      provider: 'local',
      model: process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL,
      apiKey: '',
      baseUrl: process.env.OLLAMA_BASE_URL || DEFAULT_LOCAL_BASE_URL,
    };
  } else {
    return {
      provider: 'cloud',
      model: process.env.OPENAI_MODEL || process.env.DEEPSEEK_MODEL || DEFAULT_CLOUD_MODEL,
      apiKey: process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || process.env.DEEPSEEK_BASE_URL || DEFAULT_CLOUD_BASE_URL,
    };
  }
}

/**
 * Merge configs with priority: request > database > environment
 */
export function mergeConfigs(
  requestConfig?: AIConfig,
  dbConfig?: AIConfig | null,
  envConfig?: AIConfig
): AIConfig {
  const env = envConfig || getEnvConfig();

  // Start with env config, then overlay db config, then request config
  const merged: AIConfig = {
    provider: requestConfig?.provider || dbConfig?.provider || env.provider,
    model: requestConfig?.model || dbConfig?.model || env.model,
    apiKey: requestConfig?.apiKey || dbConfig?.apiKey || env.apiKey,
    baseUrl: requestConfig?.baseUrl || dbConfig?.baseUrl || env.baseUrl,
  };

  return merged;
}

/**
 * Create and return an AI model instance
 * This is the main function to call in API routes
 *
 * @param requestConfig - Config passed from frontend (optional)
 * @param userId - User ID for database lookup (optional, auto-detected if not provided)
 * @returns Configured AI model instance
 */
export async function getAIModel(requestConfig?: AIConfig, userId?: string): Promise<ReturnType<ReturnType<typeof createOpenAI>>> {
  // Get current user if not provided
  if (!userId) {
    const session = await auth();
    userId = session?.user?.id;
  }

  // Get configs from all sources
  const envConfig = getEnvConfig();
  const dbConfig = await getDbConfig(userId);

  // Merge with priority: request > db > env
  const config = mergeConfigs(requestConfig, dbConfig, envConfig);

  // Determine settings based on provider
  const isLocal = config.provider === 'local';

  const baseUrl = config.baseUrl || (isLocal ? DEFAULT_LOCAL_BASE_URL : DEFAULT_CLOUD_BASE_URL);
  const modelName = config.model || (isLocal ? DEFAULT_LOCAL_MODEL : DEFAULT_CLOUD_MODEL);
  const apiKey = isLocal ? '' : (config.apiKey || '');

  // Validate required fields for cloud provider
  if (!isLocal && !apiKey) {
    console.warn('Cloud API selected but no API key provided');
  }

  // MiniMax compatibility: use custom fetch to filter unsupported params
  const isMiniMax = baseUrl.includes('minimax');

  // 流式输出优化配置
  // 不设置超时中断，让流自然完成，避免意外中断
  // 通过 keep-alive 和重试机制来保证稳定性
  const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // 对于 MiniMax API，需要清理不支持的参数
    if (isMiniMax && init?.body) {
      const rawBody = init.body;
      const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

      // Build clean request body with only MiniMax-supported params
      const cleanBody: Record<string, any> = {
        model: body.model,
        messages: body.messages,
        stream: body.stream === true,
      };

      // Only add optional params if they exist
      if (body.temperature !== undefined) cleanBody.temperature = body.temperature;
      if (body.max_tokens !== undefined) cleanBody.max_tokens = body.max_tokens;
      if (body.top_p !== undefined) cleanBody.top_p = body.top_p;

      // MiniMax: Disable thinking/reasoning process to get direct output
      cleanBody.disable_thinking = true;

      console.log('[MiniMax] stream:', cleanBody.stream, '| model:', cleanBody.model);

      return fetch(url, {
        ...init,
        body: JSON.stringify(cleanBody),
        // 不设置 signal，让流自然完成
      });
    }

    // 其他 API 正常调用
    return fetch(url, init);
  };

  const client = createOpenAI({
    baseURL: baseUrl,
    apiKey,
    compatibility: isMiniMax ? 'compatible' : 'strict',
    fetch: customFetch,
  });

  return client(modelName);
}

/**
 * Synchronous version for routes that don't need database lookup
 * Uses only environment variables, defaults to local Ollama
 */
export function getAIModelSync(config?: AIConfig): ReturnType<ReturnType<typeof createOpenAI>> {
  const isLocal = config?.provider === 'local' || (!config?.provider && getEnvConfig().provider === 'local');

  const baseUrl = config?.baseUrl || (isLocal ? DEFAULT_LOCAL_BASE_URL : DEFAULT_CLOUD_BASE_URL);
  const modelName = config?.model || (isLocal ? DEFAULT_LOCAL_MODEL : DEFAULT_CLOUD_MODEL);
  const apiKey = isLocal ? '' : (config?.apiKey || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY || '');

  // MiniMax compatibility
  const isMiniMax = baseUrl.includes('minimax');

  const client = createOpenAI({
    baseURL: baseUrl,
    apiKey,
    compatibility: isMiniMax ? 'compatible' : 'strict',
  });

  return client(modelName);
}

/**
 * Get embedding model for vector search (always uses local Ollama)
 */
export function getEmbeddingModel(modelName: string = 'bge-m3') {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_LOCAL_BASE_URL;
  const ollama = createOpenAI({ baseURL: baseUrl, apiKey: '' });
  return ollama.embedding(modelName);
}