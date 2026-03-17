// lib/errors/chat-errors.ts

/**
 * AI解读对话错误类型定义
 * 用于统一错误处理和用户反馈
 */

export enum ChatErrorCode {
  // 会话相关错误
  SESSION_LOAD_FAILED = 'SESSION_LOAD_FAILED',
  SESSION_CREATE_FAILED = 'SESSION_CREATE_FAILED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',

  // 消息相关错误
  MESSAGE_SAVE_FAILED = 'MESSAGE_SAVE_FAILED',
  MESSAGE_LOAD_FAILED = 'MESSAGE_LOAD_FAILED',

  // 网络相关错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // AI相关错误
  AI_GENERATION_FAILED = 'AI_GENERATION_FAILED',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',

  // 未知错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ChatErrorDetails {
  code: ChatErrorCode;
  message: string;
  recoverable: boolean;
  retryAction?: string;
  userMessage: string;
}

/**
 * 自定义聊天错误类
 */
export class ChatError extends Error {
  public readonly code: ChatErrorCode;
  public readonly recoverable: boolean;
  public readonly retryAction?: string;
  public readonly userMessage: string;

  constructor(
    code: ChatErrorCode,
    message: string,
    options?: {
      recoverable?: boolean;
      retryAction?: string;
      userMessage?: string;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ChatError';
    this.code = code;
    this.recoverable = options?.recoverable ?? true;
    this.retryAction = options?.retryAction;
    this.userMessage = options?.userMessage || this.getDefaultUserMessage(code);
  }

  private getDefaultUserMessage(code: ChatErrorCode): string {
    switch (code) {
      case ChatErrorCode.SESSION_LOAD_FAILED:
        return '无法加载对话历史，请检查网络连接';
      case ChatErrorCode.SESSION_CREATE_FAILED:
        return '创建对话失败，请重试';
      case ChatErrorCode.SESSION_NOT_FOUND:
        return '对话不存在或已被删除';
      case ChatErrorCode.MESSAGE_SAVE_FAILED:
        return '消息保存失败，请重试';
      case ChatErrorCode.MESSAGE_LOAD_FAILED:
        return '无法加载消息，请检查网络连接';
      case ChatErrorCode.NETWORK_ERROR:
        return '网络连接失败，请检查网络设置';
      case ChatErrorCode.TIMEOUT_ERROR:
        return '请求超时，请重试';
      case ChatErrorCode.AI_GENERATION_FAILED:
        return 'AI 生成失败，请重试';
      case ChatErrorCode.AI_RATE_LIMITED:
        return '请求过于频繁，请稍后再试';
      default:
        return '发生未知错误，请重试';
    }
  }

  /**
   * 从原始错误创建 ChatError
   */
  static fromError(error: unknown, defaultCode: ChatErrorCode = ChatErrorCode.UNKNOWN_ERROR): ChatError {
    if (error instanceof ChatError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);

    // 根据错误信息推断错误类型
    if (message.includes('fetch') || message.includes('network') || message.includes('ECONNREFUSED')) {
      return new ChatError(ChatErrorCode.NETWORK_ERROR, message, {
        recoverable: true,
        retryAction: 'retry',
        cause: error instanceof Error ? error : undefined,
      });
    }

    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return new ChatError(ChatErrorCode.TIMEOUT_ERROR, message, {
        recoverable: true,
        retryAction: 'retry',
        cause: error instanceof Error ? error : undefined,
      });
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return new ChatError(ChatErrorCode.AI_RATE_LIMITED, message, {
        recoverable: true,
        retryAction: 'wait',
        cause: error instanceof Error ? error : undefined,
      });
    }

    return new ChatError(defaultCode, message, {
      recoverable: true,
      retryAction: 'retry',
      cause: error instanceof Error ? error : undefined,
    });
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON(): ChatErrorDetails {
    return {
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      retryAction: this.retryAction,
      userMessage: this.userMessage,
    };
  }
}

/**
 * 错误恢复策略
 */
export type ErrorRecoveryAction = 'retry' | 'reload' | 'wait' | 'contact_support';

export function getRecoveryAction(error: ChatError): ErrorRecoveryAction {
  switch (error.code) {
    case ChatErrorCode.NETWORK_ERROR:
    case ChatErrorCode.TIMEOUT_ERROR:
    case ChatErrorCode.AI_GENERATION_FAILED:
    case ChatErrorCode.MESSAGE_SAVE_FAILED:
    case ChatErrorCode.MESSAGE_LOAD_FAILED:
      return 'retry';

    case ChatErrorCode.AI_RATE_LIMITED:
      return 'wait';

    case ChatErrorCode.SESSION_NOT_FOUND:
    case ChatErrorCode.SESSION_LOAD_FAILED:
      return 'reload';

    default:
      return 'contact_support';
  }
}

/**
 * 错误日志记录
 */
export function logChatError(error: ChatError, context?: Record<string, unknown>): void {
  const logData = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    recoverable: error.recoverable,
    ...context,
  };

  console.error('[ChatError]', JSON.stringify(logData, null, 2));
}