import { styles } from '@/styles/screens/today.styles';
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppIcon } from "@/components/ui/app-icon";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useDemoMode } from "@/features/demo/demo-mode";
import type { Task } from "@/features/tasks/model";
import { TaskCard } from "@/features/tasks/task-card";
import { TaskForm } from "@/features/tasks/task-form";
import { useTasks } from "@/features/tasks/task-store";
import { canUseDemoMode, profileGreetingName } from "@/features/tasks/profile-utils";
import { useAppTheme } from "@/hooks/use-app-theme";
import { checkAndInstallUpdate } from "@/services/app-updates";

export default function TodayScreen() {
  const colors = useAppTheme();
  const { isDemo, enterDemo, exitDemo } = useDemoMode();
  const { tasks, folders, hydrated, profileName, profileNickname, profileOnboardingComplete, setProfile, toggleTask, toggleSubtask } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const now = new Date();
  const today = now.toDateString();
  const open = tasks.filter((task) => !task.completed);
  const todayTasks = open.filter(
    (task) => new Date(task.dueAt).toDateString() === today,
  );
  const priority = open.filter((task) => task.priority === "high");
  const monthTasks = tasks.filter((task) => {
    const due = new Date(task.dueAt);
    return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
  });
  const monthOpen = monthTasks.filter((task) => !task.completed);
  const monthDone = monthTasks.length - monthOpen.length;
  const progress = monthTasks.length
    ? Math.round(
        (monthDone / monthTasks.length) * 100,
      )
    : 0;
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : now.getHours() < 21 ? "Good evening" : "Good night";
  const greetingName = profileGreetingName(profileName, profileNickname);
  const openTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.kicker, { color: colors.primary }]}>
                MY DAY
              </Text>
              <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>
                {greeting}{greetingName ? `, ${greetingName}` : ''}
              </Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {new Date().toLocaleDateString([], {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Edit profile name"
              onPress={() => setShowProfile(true)}
              style={[
                styles.avatar,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <AppIcon
                name="account-circle"
                size={32}
                tintColor={colors.primary}
              />
            </Pressable>
          </View>
          <View style={styles.stats}>
            <DashboardStat icon="today" value={todayTasks.length} label="Due today" />
            <DashboardStat icon="alarm" value={priority.length} label="Priority" />
            <DashboardStat icon="check-circle" value={monthDone} label="Done" />
          </View>
          <View
            style={[styles.progressCard, { backgroundColor: colors.primary }]}
          >
            <View style={styles.progressCopy}>
              <Text style={styles.progressEyebrow}>MONTHLY PROGRESS</Text>
              <Text style={styles.progressTitle}>{progress}% complete</Text>
              <Text style={styles.progressCaption}>
                {monthOpen.length
                  ? `${monthOpen.length} tasks still in motion`
                  : "Everything is complete — well done!"}
              </Text>
            </View>
            <View style={styles.progressRing}>
              <Text style={styles.progressNumber}>{progress}</Text>
              <Text style={styles.percent}>%</Text>
            </View>
          </View>
          <Section
            title="Priority"
            count={priority.length}
            action={priority.length ? "Alarm enabled" : undefined}
          >
            {priority.length ? (
              priority
                .slice(0, 2)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    folder={folders.find(
                      (folder) => folder.id === task.folderId,
                    )}
                    onToggle={() => toggleTask(task.id)}
                    onToggleSubtask={(subtaskId) =>
                      toggleSubtask(task.id, subtaskId)
                    }
                    onPress={() => openTask(task)}
                  />
                ))
            ) : (
              <Empty
                icon="alarm-off"
                text="No priority tasks — you're all caught up."
              />
            )}
          </Section>
          <Section title="Today" count={todayTasks.length}>
            {todayTasks.length ? (
              todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  folder={folders.find((folder) => folder.id === task.folderId)}
                  onToggle={() => toggleTask(task.id)}
                  onPress={() => openTask(task)}
                  compact
                />
              ))
            ) : (
              <Empty
                icon="event-available"
                text="Your day is clear. Add a task when you're ready."
              />
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>
      <FloatingActionButton label="Create task" onPress={() => { setEditingTask(null); setShowForm(true); }} />
      {showForm && <TaskForm task={editingTask} visible onClose={() => { setShowForm(false); setEditingTask(null); }} />}
      {hydrated && (!profileOnboardingComplete || showProfile) && <ProfileModal
        initialName={profileName}
        initialNickname={profileNickname}
        firstRun={!profileOnboardingComplete}
        isDemo={isDemo}
        onClose={() => setShowProfile(false)}
        onDemo={async (name, nickname) => {
          if (isDemo && !(await exitDemo())) return;
          if (!isDemo) {
            setProfile(name, nickname);
            enterDemo();
          }
          setShowProfile(false);
        }}
        onSave={(name, nickname) => { setProfile(name, nickname); setShowProfile(false); }}
      />}
    </View>
  );
}

function ProfileModal({ initialName, initialNickname, firstRun, isDemo, onClose, onDemo, onSave }: { initialName: string; initialNickname: string; firstRun: boolean; isDemo: boolean; onClose: () => void; onDemo: (name: string, nickname: string) => void; onSave: (name: string, nickname: string) => void }) {
  const colors = useAppTheme();
  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(initialNickname);
  const [updating, setUpdating] = useState(false);
  const hasProfile = Boolean(name.trim() || nickname.trim());
  const showDemo = isDemo || canUseDemoMode(nickname);
  const close = () => firstRun ? onSave('', '') : onClose();
  const installUpdate = async () => {
    setUpdating(true);
    try {
      const result = await checkAndInstallUpdate();
      if (result === 'current') Alert.alert('DayMark is up to date', 'You already have the latest available update.');
      if (result === 'disabled') Alert.alert('Updates unavailable here', 'Use this button in the installed release APK, not Expo Go or development mode.');
    } catch {
      Alert.alert('Update failed', 'Check your internet connection and try again.');
    } finally {
      setUpdating(false);
    }
  };
  return <Modal transparent visible animationType="fade" onRequestClose={close}>
    <View style={styles.profileBackdrop}>
      <View style={[styles.profileDialog, { backgroundColor: colors.surface }]}>
        <View style={[styles.profileIcon, { backgroundColor: colors.primaryContainer }]}><AppIcon name="person" size={28} tintColor={colors.primary} /></View>
        <View><Text style={[styles.profileTitle, { color: colors.text }]}>{firstRun ? 'Welcome to DayMark' : 'Your profile'}</Text><Text style={[styles.profileText, { color: colors.textSecondary }]}>Your nickname is shown in the greeting when provided; otherwise your name is used.</Text></View>
        <TextInput autoFocus value={name} onChangeText={setName} placeholder="Name (optional)" placeholderTextColor={colors.textSecondary} style={[styles.profileInput, { color: colors.text, borderColor: colors.outline }]} />
        <TextInput autoCapitalize="none" autoCorrect={false} value={nickname} onChangeText={setNickname} onSubmitEditing={() => hasProfile && onSave(name, nickname)} placeholder="Nickname (optional)" placeholderTextColor={colors.textSecondary} style={[styles.profileInput, { color: colors.text, borderColor: colors.outline }]} />
        <Pressable disabled={updating} onPress={installUpdate} style={[styles.profileDemo, { backgroundColor: colors.surface, borderColor: colors.outline, opacity: updating ? .6 : 1 }]}><AppIcon name={updating ? 'sync' : 'system-update-alt'} size={20} tintColor={colors.primary} /><View style={styles.profileDemoCopy}><Text style={[styles.profileDemoTitle, { color: colors.text }]}>{updating ? 'Checking for update…' : 'Install latest update'}</Text><Text style={[styles.profileDemoText, { color: colors.textSecondary }]}>Download an available DayMark update and restart.</Text></View><AppIcon name="chevron-right" size={20} tintColor={colors.primary} /></Pressable>
        {showDemo && <Pressable onPress={() => onDemo(name, nickname)} style={[styles.profileDemo, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}><AppIcon name={isDemo ? 'visibility-off' : 'visibility'} size={20} tintColor={colors.primary} /><View style={styles.profileDemoCopy}><Text style={[styles.profileDemoTitle, { color: colors.text }]}>{isDemo ? 'Exit demo mode' : 'Enter demo mode'}</Text><Text style={[styles.profileDemoText, { color: colors.textSecondary }]}>{isDemo ? 'Return to your personal data.' : 'Show sample data while keeping yours hidden.'}</Text></View><AppIcon name="chevron-right" size={20} tintColor={colors.primary} /></Pressable>}
        <View style={styles.profileActions}><Pressable onPress={close}><Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{firstRun ? 'Skip' : 'Cancel'}</Text></Pressable><Pressable disabled={!hasProfile} onPress={() => onSave(name, nickname)} style={[styles.profileSave, { backgroundColor: colors.primary, opacity: hasProfile ? 1 : .45 }]}><Text style={styles.profileSaveText}>Save</Text></Pressable></View>
      </View>
    </View>
  </Modal>;
}

function DashboardStat({ icon, value, label }: { icon: "today" | "alarm" | "check-circle"; value: number; label: string }) {
  const colors = useAppTheme();
  return <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.outline }]}><AppIcon name={icon} size={18} tintColor={colors.primary} /><Text style={[styles.statValue, { color: colors.text }]}>{value}</Text><Text numberOfLines={1} style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text></View>;
}

function Section({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count: number;
  action?: string;
  children: React.ReactNode;
}) {
  const colors = useAppTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title} <Text style={{ color: colors.textSecondary }}>{count}</Text>
        </Text>
        {action && (
          <View
            style={[
              styles.alarmPill,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <AppIcon
              name={{ ios: "alarm", android: "alarm" }}
              size={14}
              tintColor={colors.primary}
            />
            <Text style={[styles.alarmText, { color: colors.primary }]}>
              {action}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.list}>{children}</View>
    </View>
  );
}
function Empty({
  text,
  icon,
}: {
  text: string;
  icon: "alarm-off" | "event-available";
}) {
  const colors = useAppTheme();
  return (
    <View
      style={[
        styles.empty,
        { backgroundColor: colors.surface, borderColor: colors.outline },
      ]}
    >
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}
      >
        <AppIcon name={icon} size={21} tintColor={colors.primary} />
      </View>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
}
