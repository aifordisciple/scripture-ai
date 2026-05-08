// lib/ai-client.ts
// Centralized AI client factory for all API routes
// Simplified: local (Ollama) or cloud (OpenAI-compatible API)
// Default: local Ollama with qwen3-coder-next:latest

import { createOpenAI } from '@ai-sdk/openai';
import { auth } from '@/lib/auth';
import { ChatError, ChatErrorCode } from '@/lib/errors/chat-errors';

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

// 备用 API 配置（主 API 429 时自动降级）
const FALLBACK_CLOUD_MODEL = process.env.FALLBACK_MODEL || 'deepseek-chat';
const FALLBACK_CLOUD_BASE_URL = process.env.FALLBACK_BASE_URL || 'https://api.deepseek.com/v1';
const FALLBACK_CLOUD_API_KEY = process.env.FALLBACK_API_KEY || '';

// 默认 provider: 'cloud' 使用云端 API，'local' 使用本地 Ollama
const DEFAULT_PROVIDER: 'local' | 'cloud' = 'cloud';

// 429 重试配置
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000; // 1s, 2s
// ============================================================================

/**
 * Extract API config from request body safely
 * Call this at the start of each API route
 */
export async function extractApiConfig(req: Request): Promise<{ apiConfig?: AIConfig; body: Record<string, unknown>; error?: string }> {
  try {
    const body = await req.json();
    const { apiConfig, ...rest } = body;
    return { apiConfig, body: rest };
  } catch (parseError) {
    // [P1-6修复] 返回错误标记而非静默返回空body
    console.error('[AI Client] Failed to parse request body:', parseError);
    return { body: {}, error: 'Failed to parse request body' };
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
export function getEnvConfig(): AIConfig {
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

  // 带重试和降级的 fetch
  const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const makeBody = (rawBody: any, overrideModel?: string): string => {
      const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

      if (isMiniMax) {
        // Build clean request body with only MiniMax-supported params
        const cleanBody: Record<string, any> = {
          model: overrideModel || body.model,
          messages: body.messages,
          stream: body.stream === true,
        };
        if (body.temperature !== undefined) cleanBody.temperature = body.temperature;
        if (body.max_tokens !== undefined) cleanBody.max_tokens = body.max_tokens;
        if (body.top_p !== undefined) cleanBody.top_p = body.top_p;
        cleanBody.disable_thinking = true;
        return JSON.stringify(cleanBody);
      }

      // 非 MiniMax API：如果需要覆盖 model
      if (overrideModel) {
        const modified = { ...body, model: overrideModel };
        return JSON.stringify(modified);
      }
      return typeof rawBody === 'string' ? rawBody : JSON.stringify(body);
    };

    const attemptRequest = async (attempt: number): Promise<Response> => {
      const bodyStr = makeBody(init?.body);

      // P1-9: Add 120s timeout with AbortController (AI search needs longer)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let response: Response;
      try {
        response = await fetch(url, {
          ...init,
          body: bodyStr,
          signal: controller.signal,
        });
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        // Convert to ChatError for better error handling
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new ChatError(ChatErrorCode.TIMEOUT_ERROR, 'Request timed out after 30s', {
            recoverable: true,
            retryAction: 'retry',
          });
        }
        throw ChatError.fromError(fetchError, ChatErrorCode.NETWORK_ERROR);
      }
      clearTimeout(timeoutId);

      // 429: 自动重试（带指数退避）
      if (response.status === 429 && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[AI] Rate limited (429), retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptRequest(attempt + 1);
      }

      // 429 重试耗尽：尝试降级到备用 API
      if (response.status === 429 && attempt >= MAX_RETRIES && FALLBACK_CLOUD_API_KEY) {
        console.warn(`[AI] Rate limited (429) after ${MAX_RETRIES} retries, falling back to ${FALLBACK_CLOUD_BASE_URL}`);
        const fallbackBody = makeBody(init?.body, FALLBACK_CLOUD_MODEL);
        try {
          const fallbackUrl = String(url).replace(new URL(baseUrl).origin, new URL(FALLBACK_CLOUD_BASE_URL).origin);
          const fallbackResponse = await fetch(fallbackUrl, {
            ...init,
            body: fallbackBody,
            headers: {
              ...(init?.headers as Record<string, string> || {}),
              'Authorization': `Bearer ${FALLBACK_CLOUD_API_KEY}`,
            },
          });
          if (fallbackResponse.ok) {
            console.log('[AI] Fallback API succeeded');
            return fallbackResponse;
          }
          console.warn('[AI] Fallback API also failed:', fallbackResponse.status);
        } catch (fallbackErr) {
          console.warn('[AI] Fallback API error:', fallbackErr);
        }
      }

      return response;
    };

    return attemptRequest(0);
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

  // [P3-10修复] 同步版本也添加 MiniMax 兼容的 customFetch
  const customFetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (isMiniMax && init?.body) {
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      const cleanBody: Record<string, any> = {
        model: body.model,
        messages: body.messages,
        stream: body.stream === true,
      };
      if (body.temperature !== undefined) cleanBody.temperature = body.temperature;
      if (body.max_tokens !== undefined) cleanBody.max_tokens = body.max_tokens;
      if (body.top_p !== undefined) cleanBody.top_p = body.top_p;
      cleanBody.disable_thinking = true;
      return fetch(url, { ...init, body: JSON.stringify(cleanBody) });
    }
    return fetch(url, init);
  };

  const client = createOpenAI({
    baseURL: baseUrl,
    apiKey,
    compatibility: isMiniMax ? 'compatible' : 'strict',
    fetch: isMiniMax ? customFetch : undefined,
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