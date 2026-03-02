/**
 * Telegram WebApp SDK utilities
 */

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: any;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  showPopup(params: {
    title?: string;
    message: string;
    buttons?: Array<{ id?: string; type?: string; text: string }>;
  }, callback?: (buttonId: string) => void): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
}

/**
 * Get Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  const WebApp = (window as any).Telegram?.WebApp;
  if (!WebApp) {
    console.warn('[Telegram] WebApp SDK not available');
    return null;
  }
  return WebApp;
}


/**
 * Initialize Telegram WebApp
 */
export function initTelegram(): void {
  const WebApp = getTelegramWebApp();
  if (!WebApp) return;

  WebApp.ready();
  WebApp.expand();

  // Force dark header/background to match our fixed dark theme
  if ((WebApp as any).setHeaderColor)     (WebApp as any).setHeaderColor('#111318');
  if ((WebApp as any).setBackgroundColor) (WebApp as any).setBackgroundColor('#111318');

  console.log('[Telegram] WebApp initialized', {
    version: WebApp.version,
    platform: WebApp.platform,
    colorScheme: WebApp.colorScheme,
  });
}

/**
 * Haptic feedback helpers
 */
export const haptic = {
  light: () => getTelegramWebApp()?.HapticFeedback.impactOccurred('light'),
  medium: () => getTelegramWebApp()?.HapticFeedback.impactOccurred('medium'),
  heavy: () => getTelegramWebApp()?.HapticFeedback.impactOccurred('heavy'),
  success: () => getTelegramWebApp()?.HapticFeedback.notificationOccurred('success'),
  error: () => getTelegramWebApp()?.HapticFeedback.notificationOccurred('error'),
  warning: () => getTelegramWebApp()?.HapticFeedback.notificationOccurred('warning'),
  selection: () => getTelegramWebApp()?.HapticFeedback.selectionChanged(),
};

/**
 * Open external link
 */
export function openLink(url: string): void {
  const WebApp = getTelegramWebApp();
  if (WebApp) {
    WebApp.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Open Telegram link
 */
export function openTelegramLink(url: string): void {
  const WebApp = getTelegramWebApp();
  if (WebApp) {
    WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Show alert
 */
export function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    const WebApp = getTelegramWebApp();
    if (WebApp) {
      WebApp.showAlert(message, () => resolve());
    } else {
      alert(message);
      resolve();
    }
  });
}

/**
 * Show confirm dialog
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const WebApp = getTelegramWebApp();
    if (WebApp) {
      WebApp.showConfirm(message, (confirmed) => resolve(confirmed));
    } else {
      resolve(confirm(message));
    }
  });
}
