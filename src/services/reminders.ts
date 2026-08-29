import { Platform } from 'react-native';

import type { Task } from '@/features/tasks/model';

const PRIORITY_CHANNEL = 'priority-alarms-v2';
const NORMAL_CHANNEL = 'task-reminders';

export async function configureReminders() {
  if (Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldPlaySound: notification.request.content.data?.priority === 'high',
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: notification.request.content.data?.priority === 'high'
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.DEFAULT,
    }),
  });

  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync(PRIORITY_CHANNEL, {
        name: 'Priority alarms',
        description: 'Urgent task alarms with sound and vibration',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 300, 200, 300],
        enableVibrate: true,
        bypassDnd: true,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      }),
      Notifications.setNotificationChannelAsync(NORMAL_CHANNEL, {
        name: 'Task reminders',
        description: 'Quiet reminders for normal tasks',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: null,
      }),
    ]);
  }
}

export async function scheduleTaskReminder(task: Task) {
  if (Platform.OS === 'web' || (task.repeat.type === 'none' && new Date(task.dueAt) <= new Date())) return [];
  const Notifications = await import('expo-notifications');
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return [];

  const content = {
    title: task.priority === 'high' ? `Priority: ${task.title}` : task.title,
    body: task.notes || 'This task is due now.',
    data: { taskId: task.id, priority: task.priority },
    sound: task.priority === 'high' ? 'default' as const : undefined,
    interruptionLevel: task.priority === 'high' ? 'timeSensitive' as const : 'passive' as const,
    priority: task.priority === 'high'
      ? Notifications.AndroidNotificationPriority.MAX
      : Notifications.AndroidNotificationPriority.DEFAULT,
    vibrate: task.priority === 'high' ? [0, 500, 250, 500, 250, 800] : undefined,
    sticky: false,
    autoDismiss: true,
  };
  const due = new Date(task.dueAt);
  const channelId = task.priority === 'high' ? PRIORITY_CHANNEL : NORMAL_CHANNEL;
  const triggers = task.repeat.type === 'daily'
    ? [{ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: due.getHours(), minute: due.getMinutes(), channelId }]
    : task.repeat.type === 'weekly'
      ? task.repeat.weekdays.map((weekday) => ({ type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour: due.getHours(), minute: due.getMinutes(), channelId }))
      : [{ type: Notifications.SchedulableTriggerInputTypes.DATE, date: due, channelId }];

  return Promise.all(triggers.map((trigger) => Notifications.scheduleNotificationAsync({
    content: {
      ...content,
    },
    trigger,
  })));
}

export async function cancelTaskReminder(ids: string[] = []) {
  if (!ids.length || Platform.OS === 'web') return;
  const Notifications = await import('expo-notifications');
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function addTaskToCalendar(task: Task) {
  if (Platform.OS === 'web') return false;
  const Calendar = await import('expo-calendar');
  const permission = await Calendar.requestCalendarPermissions();
  if (permission.status !== 'granted') return false;

  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  const calendar = calendars.find((item) => item.isPrimary && item.allowsModifications)
    ?? calendars.find((item) => item.allowsModifications);
  if (!calendar) return false;

  const startDate = new Date(task.dueAt);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  await calendar.addEventWithForm({
    title: task.title,
    notes: task.notes,
    startDate,
    endDate,
    alarms: task.priority === 'high' ? [{ relativeOffset: 0 }] : undefined,
  });
  return true;
}
