// lib/errors/chat-errors.ts

/**
 * AI解读对话错误类型定义
 * 用于统一错误处理和用户反馈
 */

import { t } from '@/lib/i18n'

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
        return t('ai.chat.sessionLoadFailed');
      case ChatErrorCode.SESSION_CREATE_FAILED:
        return t('ai.chat.sessionCreateFailed');
      case ChatErrorCode.SESSION_NOT_FOUND:
        return t('ai.chat.sessionNotFound');
      case ChatErrorCode.MESSAGE_SAVE_FAILED:
        return t('ai.chat.messageSaveFailed');
      case ChatErrorCode.MESSAGE_LOAD_FAILED:
        return t('ai.chat.messageLoadFailed');
      case ChatErrorCode.NETWORK_ERROR:
        return t('common.networkError');
      case ChatErrorCode.TIMEOUT_ERROR:
        return t('ai.chat.timeoutError');
      case ChatErrorCode.AI_GENERATION_FAILED:
        return t('ai.chat.generationFailed');
      case ChatErrorCode.AI_RATE_LIMITED:
        return t('ai.chat.rateLimited');
      default:
        return t('common.error');
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

    if (message.includes('rate limit') || message.includes('429') || message.includes('usage limit exceeded')) {
      return new ChatError(ChatErrorCode.AI_RATE_LIMITED, message, {
        recoverable: true,
        retryAction: 'wait',
        userMessage: 'AI service is currently busy, please try again later',
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