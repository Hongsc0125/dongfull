interface LogContext {
  component?: string;
  action?: string;
  user?: string;
  [key: string]: any;
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private shouldLog(level: string): boolean {
    if (!this.isDevelopment && level === 'debug') return false;
    return true;
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return;
    console.log(`🟦 ${this.formatMessage('info', message, context)}`);
    this.sendToServer('info', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (!this.shouldLog('error')) return;
    const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
    console.error(`🔴 ${this.formatMessage('error', message, errorContext)}`);
    this.sendToServer('error', message, errorContext);
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return;
    console.warn(`🟨 ${this.formatMessage('warn', message, context)}`);
    this.sendToServer('warn', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return;
    console.debug(`🟣 ${this.formatMessage('debug', message, context)}`);
    if (this.isDevelopment) {
      this.sendToServer('debug', message, context);
    }
  }

  success(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return;
    console.log(`🟢 ${this.formatMessage('success', message, context)}`);
    this.sendToServer('info', message, { ...context, type: 'success' });
  }

  // API 요청 로깅
  apiRequest(method: string, url: string, context?: LogContext) {
    this.info(`API ${method} ${url}`, { ...context, type: 'api_request' });
  }

  // API 응답 로깅  
  apiResponse(method: string, url: string, status: number, context?: LogContext) {
    const level = status >= 400 ? 'error' : 'info';
    const message = `API ${method} ${url} - ${status}`;
    
    if (level === 'error') {
      this.error(message, undefined, { ...context, type: 'api_response', status });
    } else {
      this.info(message, { ...context, type: 'api_response', status });
    }
  }

  // 사용자 액션 로깅
  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, { ...context, type: 'user_action' });
  }

  // 네비게이션 로깅
  navigation(from: string, to: string, context?: LogContext) {
    this.info(`Navigation: ${from} → ${to}`, { ...context, type: 'navigation' });
  }

  // 폼 제출 로깅
  formSubmit(formName: string, context?: LogContext) {
    this.info(`Form submitted: ${formName}`, { ...context, type: 'form_submit' });
  }

  private async sendToServer(level: string, message: string, context?: LogContext) {
    try {
      // 프로덕션에서만 서버로 로그 전송 (에러는 항상 전송)
      if (!this.isDevelopment && level !== 'error') return;
      
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // 서버 로그 전송 실패는 무시 (콘솔에는 이미 출력됨)
      });
    } catch {
      // 서버 로그 전송 실패는 무시
    }
  }
}

export const logger = new ClientLogger();

// React 컴포넌트에서 사용할 수 있는 훅
export function useLogger(componentName: string) {
  return {
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...context, component: componentName }),
    error: (message: string, error?: Error, context?: LogContext) => 
      logger.error(message, error, { ...context, component: componentName }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...context, component: componentName }),
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...context, component: componentName }),
    success: (message: string, context?: LogContext) => 
      logger.success(message, { ...context, component: componentName }),
    userAction: (action: string, context?: LogContext) => 
      logger.userAction(action, { ...context, component: componentName }),
    formSubmit: (formName: string, context?: LogContext) => 
      logger.formSubmit(formName, { ...context, component: componentName })
  };
}