import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * One local "session complete" notification, scheduled at endsAt (docs/SPEC.md §1.2).
 * No push service. Failures are swallowed: the timer works without notifications.
 */
const CHANNEL_ID = 'session-complete';
let scheduledId: string | null = null;
let ready = false;

async function ensureChannel() {
  if (ready) return;
  ready = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // In the foreground the app shows Completion itself.
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Session complete',
      // eslint-disable-next-line import/namespace -- enum is re-exported via `export *`, which the resolver misses
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      enableVibrate: true,
    });
  }
}

/** Asks once, the first time the person starts a practice. Returns whether allowed. */
export async function ensurePermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
}

export async function scheduleEnd(endsAt: number, title: string, body: string) {
  try {
    await ensureChannel();
    await cancelEnd();
    scheduledId = await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: endsAt, channelId: CHANNEL_ID },
    });
  } catch {
    scheduledId = null;
  }
}

export async function cancelEnd() {
  const id = scheduledId;
  scheduledId = null;
  try {
    if (id) await Notifications.cancelScheduledNotificationAsync(id);
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // ignore
  }
}
