import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * HTML特殊文字をエスケープする関数
 * XSS対策のために使用
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#039;");
}

/**
 * URLが安全かどうかチェックする関数
 * 特に画像URLのXSS対策のために使用
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // 許可されたプロトコルのみ
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
}