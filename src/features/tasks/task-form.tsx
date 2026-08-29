import { styles } from './task-form.styles';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { DateTimeField } from '@/components/ui/date-time-field';
import { useAppTheme } from '@/hooks/use-app-theme';
import { confirmAction } from '@/utils/confirm-action';

import { Priority, RepeatType, Subtask, Task, TaskDraft, TaskTemplate } from './model';
import { useTasks } from './task-store';

type Props = { task?: Task | null; visible: boolean; onClose: () => void };
const defaultDueDate = () => { const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(18, 0, 0, 0); return date; };
const weekDays = [{ label: 'S', value: 1 }, { label: 'M', value: 2 }, { label: 'T', value: 3 }, { label: 'W', value: 4 }, { label: 'T', value: 5 }, { label: 'F', value: 6 }, { label: 'S', value: 7 }];

export function TaskForm({ task, visible, onClose }: Props) {
  const colors = useAppTheme();
  const { folders, templates, addTask, updateTask, deleteTask, addTemplate, deleteTemplate } = useTasks();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [folderId, setFolderId] = useState(task?.folderId ?? folders.find((folder) => folder.id !== 'uncategorized')?.id ?? 'uncategorized');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'normal');
  const [dueAt, setDueAt] = useState(() => task ? new Date(task.dueAt) : defaultDueDate());
  const [calendar, setCalendar] = useState(false);
  const [repeat, setRepeat] = useState<RepeatType>(task?.repeat.type ?? 'none');
  const [weekdays, setWeekdays] = useState<number[]>(task?.repeat.weekdays ?? [new Date().getDay() + 1]);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [subtask, setSubtask] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);

  const suggestions = useMemo(() => {
    const query = title.trim().toLocaleLowerCase();
    return templates
      .filter((item) => !query || item.title.toLocaleLowerCase().includes(query))
      .slice(0, 6);
  }, [templates, title]);

  const chooseTemplate = (template: TaskTemplate) => {
    setTitle(template.title); setNotes(template.notes ?? ''); setPriority(template.priority);
    if (folders.some((folder) => folder.id === template.folderId)) setFolderId(template.folderId);
    if (template.repeat) { setRepeat(template.repeat.type); setWeekdays(template.repeat.weekdays); }
    setSubtasks(template.subtasks.map((item, index) => ({ ...item, id: `draft-${Date.now()}-${index}`, completed: false })));
    setShowSuggestions(false);
  };
  const addSubtask = () => {
    if (!subtask.trim()) return;
    setSubtasks((current) => [...current, { id: `draft-${Date.now()}`, title: subtask.trim(), completed: false }]);
    setSubtask('');
  };
  const submit = async () => {
    if (!title.trim()) { Alert.alert('Task title required', 'Choose a suggested task or enter your own title.'); return; }
    if (repeat === 'weekly' && !weekdays.length) { Alert.alert('Choose a repeat day', 'Select at least one weekday.'); return; }
    const draft: TaskDraft = { title: title.trim(), notes: notes.trim(), folderId, priority, dueAt: dueAt.toISOString(), subtasks, repeat: { type: repeat, weekdays: repeat === 'weekly' ? weekdays : [] }, addToCalendar: calendar };
    setSaving(true);
    if (task) await updateTask(task.id, draft); else await addTask(draft);
    setSaving(false);
    onClose();
  };
  const remove = () => {
    if (!task) return;
    const confirmDelete = async () => { await deleteTask(task.id); onClose(); };
    confirmAction('Delete task?', `“${task.title}” will be permanently deleted.`, () => void confirmDelete());
  };
  const savePreset = () => {
    if (!title.trim()) { Alert.alert('Add a title first', 'A preset needs a task title.'); return; }
    const saved = addTemplate({ title: title.trim(), notes: notes.trim(), folderId, priority, subtasks, repeat: { type: repeat, weekdays } });
    Alert.alert(saved ? 'Preset saved' : 'Preset already exists', saved ? 'It is now available in the task dropdown.' : 'Use a different task title.');
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>{task ? 'EDIT TASK' : 'NEW TASK'}</Text><Text style={[styles.heading, { color: colors.text }]}>{task ? 'Update task' : 'Plan the next action'}</Text></View><Pressable accessibilityLabel="Close" onPress={onClose} style={[styles.iconButton, { backgroundColor: colors.surfaceVariant }]}><AppIcon name="close" tintColor={colors.text} /></Pressable></View>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.searchWrap}>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.surface, borderColor: showSuggestions ? colors.primary : colors.outline }]}><AppIcon name="search" tintColor={colors.textSecondary} /><TextInput autoFocus placeholder="Search templates or type a custom task" placeholderTextColor={colors.textSecondary} value={title} onFocus={() => setShowSuggestions(true)} onChangeText={(value) => { setTitle(value); setShowSuggestions(true); }} style={[styles.titleInput, { color: colors.text }]} /></View>
          {showSuggestions && <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            {!!title.trim() && <Pressable onPress={() => setShowSuggestions(false)} style={styles.suggestion}><View style={[styles.suggestionIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name="add" size={19} tintColor={colors.primary} /></View><View><Text style={[styles.suggestionTitle, { color: colors.text }]}>Use “{title.trim()}”</Text><Text style={[styles.suggestionCaption, { color: colors.textSecondary }]}>Create a custom task</Text></View></Pressable>}
            {suggestions.map((item) => <View key={item.title} style={styles.suggestionRow}><Pressable onPress={() => chooseTemplate(item)} android_ripple={{ color: colors.primaryContainer }} style={styles.suggestion}><View style={[styles.suggestionIcon, { backgroundColor: colors.surfaceVariant }]}><AppIcon name="task-alt" size={19} tintColor={colors.primary} /></View><View style={styles.suggestionCopy}><Text style={[styles.suggestionTitle, { color: colors.text }]}>{item.title}</Text><Text style={[styles.suggestionCaption, { color: colors.textSecondary }]}>{item.repeat?.type && item.repeat.type !== 'none' ? `Repeats ${item.repeat.type}` : item.priority === 'high' ? 'Priority template' : 'Suggested task'}</Text></View><AppIcon name="north-west" size={17} tintColor={colors.textSecondary} /></Pressable><Pressable accessibilityLabel={`Delete ${item.title} preset`} onPress={() => deleteTemplate(item.title)} style={styles.deletePreset}><AppIcon name="delete-outline" size={19} tintColor={colors.error} /></Pressable></View>)}
            {!suggestions.length && !title.trim() && <Text style={[styles.noSuggestions, { color: colors.textSecondary }]}>Start typing to create a custom task.</Text>}
          </View>}
        </View>

        <TextInput multiline placeholder="Add details or notes…" placeholderTextColor={colors.textSecondary} value={notes} onChangeText={setNotes} style={[styles.notesInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.outline }]} />
        <Pressable onPress={savePreset} style={[styles.savePreset, { borderColor: colors.outline }]}><AppIcon name="playlist-add" size={20} tintColor={colors.primary} /><Text style={[styles.savePresetText, { color: colors.primary }]}>Save current task as preset</Text></Pressable>
        <Field label="Folder"><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{folders.map((folder) => <Chip key={folder.id} label={folder.name} selected={folderId === folder.id} onPress={() => setFolderId(folder.id)} color={folder.color} />)}</ScrollView></Field>
        <Field label="Due date & time" hint="The task becomes overdue after this time; it is never deleted."><DateTimeField label="Task due date and time" minimumDate={new Date()} value={dueAt} onChange={setDueAt} /></Field>
        <Field label="Repeat" hint="A completed repeating task rolls forward to its next occurrence."><View style={styles.chips}><Chip label="Never" selected={repeat === 'none'} onPress={() => setRepeat('none')} /><Chip label="Daily" selected={repeat === 'daily'} onPress={() => setRepeat('daily')} /><Chip label="Weekly" selected={repeat === 'weekly'} onPress={() => setRepeat('weekly')} /></View>{repeat === 'weekly' && <View style={styles.weekdays}>{weekDays.map((day, index) => <Pressable key={`${day.label}-${index}`} onPress={() => setWeekdays((current) => current.includes(day.value) ? current.filter((value) => value !== day.value) : [...current, day.value])} style={[styles.weekday, { backgroundColor: weekdays.includes(day.value) ? colors.primary : colors.surface, borderColor: weekdays.includes(day.value) ? colors.primary : colors.outline }]}><Text style={{ color: weekdays.includes(day.value) ? '#FFFFFF' : colors.text, fontWeight: '800' }}>{day.label}</Text></Pressable>)}</View>}</Field>
        <Field label="Subtasks" hint="Break the task into checkable steps.">
          <View style={styles.subtaskInputRow}><TextInput value={subtask} onChangeText={setSubtask} onSubmitEditing={addSubtask} placeholder="Add a step" placeholderTextColor={colors.textSecondary} style={[styles.subtaskInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.outline }]} /><Pressable accessibilityLabel="Add subtask" onPress={addSubtask} style={[styles.addStep, { backgroundColor: colors.primaryContainer }]}><AppIcon name="add" tintColor={colors.primary} /></Pressable></View>
          {subtasks.map((item) => <View key={item.id} style={styles.draftSubtask}><AppIcon name="radio-button-unchecked" size={18} tintColor={colors.textSecondary} /><Text style={[styles.draftSubtaskText, { color: colors.text }]}>{item.title}</Text><Pressable onPress={() => setSubtasks((current) => current.filter((entry) => entry.id !== item.id))}><AppIcon name="close" size={18} tintColor={colors.textSecondary} /></Pressable></View>)}
        </Field>
        <Field label="Reminder type"><View style={styles.priorityRow}><PriorityCard title="Normal" caption="Quiet notification" selected={priority === 'normal'} onPress={() => setPriority('normal')} icon="notifications-none" /><PriorityCard title="Priority" caption="Alarm + vibration" selected={priority === 'high'} onPress={() => setPriority('high')} icon="alarm" /></View></Field>
        <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.outline }]}><View style={styles.switchLabel}><AppIcon name="calendar-today" tintColor={colors.primary} /><View><Text style={[styles.switchTitle, { color: colors.text }]}>Add to calendar</Text><Text style={[styles.caption, { color: colors.textSecondary }]}>Review in the system calendar</Text></View></View><Switch value={calendar} onValueChange={setCalendar} trackColor={{ true: colors.primary }} /></View>
        {task && <Pressable onPress={remove} style={styles.deleteTask}><AppIcon name="delete-outline" size={20} tintColor={colors.error} /><Text style={[styles.deleteTaskText, { color: colors.error }]}>Delete task</Text></Pressable>}
      </ScrollView>
      <Pressable disabled={saving} onPress={submit} style={({ pressed }) => [styles.save, { backgroundColor: colors.primary, opacity: pressed || saving ? .7 : 1 }]}><Text style={styles.saveText}>{saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}</Text><AppIcon name="arrow-forward" tintColor="#FFFFFF" size={20} /></Pressable>
    </SafeAreaView>
  </Modal>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { const colors = useAppTheme(); return <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>{label}</Text>{hint && <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}{children}</View>; }
function Chip({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color?: string }) { const colors = useAppTheme(); return <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}>{color && <View style={[styles.chipDot, { backgroundColor: color }]} />}<Text style={{ color: colors.text, fontWeight: selected ? '700' : '500' }}>{label}</Text></Pressable>; }
function PriorityCard({ title, caption, selected, onPress, icon }: { title: string; caption: string; selected: boolean; onPress: () => void; icon: 'notifications-none' | 'alarm' }) { const colors = useAppTheme(); return <Pressable onPress={onPress} style={[styles.priority, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}><AppIcon name={icon} tintColor={selected ? colors.primary : colors.textSecondary} /><Text style={[styles.priorityTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text></Pressable>; }
