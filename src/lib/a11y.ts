import { AccessibilityInfo } from 'react-native';

/** Polite screen-reader announcement; queued where the platform supports it. */
export function announce(message: string) {
  try {
    if (typeof AccessibilityInfo.announceForAccessibilityWithOptions === 'function') {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
    } else {
      AccessibilityInfo.announceForAccessibility?.(message);
    }
  } catch {
    // Announcements are best effort.
  }
}
