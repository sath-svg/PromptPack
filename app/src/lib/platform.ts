/**
 * Platform detection and utilities for cross-platform functionality
 */

export const isMac = () => {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

export const isWindows = () => {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('WIN') >= 0;
};

export const isLinux = () => {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('LINUX') >= 0;
};

/**
 * Formats a keyboard shortcut for display based on the current platform
 * Replaces CommandOrControl with Cmd on macOS, Ctrl on other platforms
 */
export const formatShortcut = (shortcut: string): string => {
  if (isMac()) {
    return shortcut
      .replace('CommandOrControl', 'Cmd')
      .replace('Control', 'Cmd')
      .replace('Alt', 'Option');
  }
  return shortcut.replace('CommandOrControl', 'Ctrl');
};

/**
 * Gets the modifier key symbol for the current platform
 */
export const getModifierKey = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};

/**
 * Gets the alt/option key symbol for the current platform
 */
export const getAltKey = (): string => {
  return isMac() ? '⌥' : 'Alt';
};

/**
 * Gets the platform-specific app data directory
 */
export const getAppDataDir = async (): Promise<string> => {
  // This will be implemented via Tauri API
  // For now, return empty string
  return '';
};
