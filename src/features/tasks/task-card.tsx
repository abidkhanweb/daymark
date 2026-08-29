import { styles } from './task-card.styles';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/app-icon';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatDate, formatTime } from '@/utils/date';

import { Folder, Task } from './model';

export function TaskCard({ task, folder, onToggle, onToggleSubtask, onPress, compact }: { task: Task; folder?: Folder; onToggle: () => void; onToggleSubtask?: (id: string) => void; onPress?: () => void; compact?: boolean }) {
  const colors = useAppTheme();
  const due = new Date(task.dueAt);
  const overdue = !task.completed && due < new Date();
  return (
    <Animated.View entering={FadeInDown.duration(240)} layout={LinearTransition.duration(200)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
      <Pressable accessibilityLabel={`Mark ${task.title} as ${task.completed ? 'open' : 'complete'}`} accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} android_ripple={{ color: colors.primaryContainer }} onPress={onToggle} style={({ pressed }) => [styles.checkbox, { borderColor: task.completed ? colors.primary : colors.outline, backgroundColor: task.completed ? colors.primary : 'transparent', opacity: pressed ? .65 : 1 }]}>
        {task.completed && <AppIcon name={{ ios: 'checkmark', android: 'check' }} size={15} tintColor="#FFFFFF" />}
      </Pressable>
      <View style={styles.body}>
        <Pressable disabled={!onPress} onPress={onPress} style={styles.details}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>{task.title}</Text>
          {task.priority === 'high' && <AppIcon name={{ ios: 'alarm.fill', android: 'alarm' }} size={18} tintColor={colors.error} />}
        </View>
        {!compact && task.notes && <Text numberOfLines={1} style={[styles.notes, { color: colors.textSecondary }]}>{task.notes}</Text>}
        <View style={styles.meta}>
          <View style={[styles.dot, { backgroundColor: folder?.color ?? colors.primary }]} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{folder?.name ?? 'Unsorted'}</Text>
          <Text style={[styles.metaText, { color: overdue ? colors.error : colors.textSecondary }]}>
            {formatDate(due)} · {formatTime(due)}
          </Text>
          {task.repeat.type !== 'none' && <View style={styles.repeatMeta}><AppIcon name="repeat" size={14} tintColor={colors.primary} /><Text style={[styles.metaText, { color: colors.primary }]}>{task.repeat.type === 'daily' ? 'Daily' : `${task.repeat.weekdays.length} day${task.repeat.weekdays.length === 1 ? '' : 's'}/week`}</Text></View>}
        </View>
        </Pressable>
        {!compact && task.subtasks.length > 0 && <View style={[styles.subtasks, { borderTopColor: colors.outline }]}>{task.subtasks.map((subtask) => <Pressable key={subtask.id} android_ripple={{ color: colors.primaryContainer }} onPress={() => onToggleSubtask?.(subtask.id)} style={styles.subtask}><AppIcon name={subtask.completed ? 'check-circle' : 'radio-button-unchecked'} size={18} tintColor={subtask.completed ? colors.success : colors.textSecondary} /><Text style={[styles.subtaskText, { color: colors.textSecondary, textDecorationLine: subtask.completed ? 'line-through' : 'none' }]}>{subtask.title}</Text></Pressable>)}</View>}
      </View>
    </Animated.View>
  );
}
