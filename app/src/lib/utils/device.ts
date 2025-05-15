// File: app/src/lib/utils/device.ts

/**
 * Determines if the current device is running iOS (iPhone or iPad).
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Determines if the current browser is Mobile Safari on iOS.
 */
export function isMobileSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isIOS() && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}
