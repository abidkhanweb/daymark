import { styles } from '@/styles/screens/tasks.styles';
import { useMemo, useState } from "react";
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
import type { Category, Folder, Task } from "@/features/tasks/model";
import { TaskCard } from "@/features/tasks/task-card";
import { TaskForm } from "@/features/tasks/task-form";
import { useTasks } from "@/features/tasks/task-store";
import { useAppTheme } from "@/hooks/use-app-theme";
import { confirmAction } from "@/utils/confirm-action";

type CreateMode = "folder" | "category";

export default function TasksScreen() {
  const colors = useAppTheme();
  const {
    tasks,
    folders,
    categories,
    toggleTask,
    toggleSubtask,
    addFolder,
    addCategory,
    deleteCategory,
    deleteFolder,
  } = useTasks();
  const [categoryId, setCategoryId] = useState("all");
  const [folderId, setFolderId] = useState("all");
  const [query, setQuery] = useState("");
  const [showTask, setShowTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createMode, setCreateMode] = useState<CreateMode | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);

  const shownFolders =
    categoryId === "all"
      ? folders
      : folders.filter((folder) => folder.categoryId === categoryId);
  const visible = useMemo(
    () =>
      tasks
        .filter((task) => {
          const taskFolder = folders.find(
            (folder) => folder.id === task.folderId,
          );
          const matchesCategory =
            categoryId === "all" || taskFolder?.categoryId === categoryId;
          const searchText =
            `${task.title} ${task.notes ?? ""} ${task.subtasks.map((subtask) => subtask.title).join(" ")}`.toLocaleLowerCase();
          return (
            matchesCategory &&
            (folderId === "all" || task.folderId === folderId) &&
            searchText.includes(query.trim().toLocaleLowerCase())
          );
        })
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) ||
            a.dueAt.localeCompare(b.dueAt),
        ),
    [tasks, folders, categoryId, folderId, query],
  );

  const chooseCategory = (id: string) => {
    setCategoryId(id);
    setFolderId("all");
  };
  const removeFolder = async (deleteTasks: boolean) => {
    if (!deleting) return;
    await deleteFolder(deleting.id, deleteTasks);
    if (folderId === deleting.id) setFolderId("all");
    setDeleting(null);
  };
  const removeCategory = (category: Category) => {
    confirmAction(
      "Delete category?",
      `Folders in “${category.name}” will be kept and moved to another category.`,
      () => {
        deleteCategory(category.id);
        if (categoryId === category.id) chooseCategory("all");
      },
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.kicker, { color: colors.primary }]}>
                ORGANIZE
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>
                All tasks
              </Text>
            </View>
            <View style={styles.headerActions}>
              <ActionButton
                icon="create-new-folder"
                label="Folder"
                onPress={() => setCreateMode("folder")}
              />
              <ActionButton
                icon="category"
                label="Category"
                onPress={() => setCreateMode("category")}
              />
            </View>
          </View>
          <View
            style={[
              styles.search,
              { backgroundColor: colors.surface, borderColor: colors.outline },
            ]}
          >
            <AppIcon name="search" tintColor={colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search tasks and subtasks"
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              CATEGORIES
            </Text>
            <ScrollView
              style={styles.filterScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              <FilterChip
                name="All"
                selected={categoryId === "all"}
                onPress={() => chooseCategory("all")}
              />
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  name={category.name}
                  color={category.color}
                  selected={categoryId === category.id}
                  onPress={() => chooseCategory(category.id)}
                  onDelete={category.name.trim().toLocaleLowerCase() === "general" ? undefined : () => removeCategory(category)}
                />
              ))}
            </ScrollView>
          </View>
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
              FOLDERS
            </Text>
            <ScrollView
              style={styles.filterScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              <FilterChip
                name="All"
                selected={folderId === "all"}
                onPress={() => setFolderId("all")}
              />
              {shownFolders.map((folder) => (
                <FolderChip
                  key={folder.id}
                  folder={folder}
                  count={
                    tasks.filter((task) => task.folderId === folder.id).length
                  }
                  selected={folderId === folder.id}
                  onPress={() => setFolderId(folder.id)}
                  onDelete={
                    folder.id === "uncategorized" || folder.name.trim().toLocaleLowerCase() === "general"
                      ? undefined
                      : () => setDeleting(folder)
                  }
                />
              ))}
            </ScrollView>
          </View>

          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {visible.filter((task) => !task.completed).length} open ·{" "}
            {visible.filter((task) => task.completed).length} completed
          </Text>
          <View style={styles.list}>
            {visible.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                folder={folders.find((folder) => folder.id === task.folderId)}
                onToggle={() => toggleTask(task.id)}
                onToggleSubtask={(subtaskId) =>
                  toggleSubtask(task.id, subtaskId)
                }
                onPress={() => {
                  setEditingTask(task);
                  setShowTask(true);
                }}
              />
            ))}
            {!visible.length && (
              <View
                style={[
                  styles.empty,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                  },
                ]}
              >
                <AppIcon name="task-alt" size={28} tintColor={colors.primary} />
                <Text style={{ color: colors.textSecondary }}>
                  No tasks match this view.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <FloatingActionButton
        label="Create task"
        onPress={() => {
          setEditingTask(null);
          setShowTask(true);
        }}
      />
      {showTask && (
        <TaskForm
          task={editingTask}
          visible
          onClose={() => {
            setShowTask(false);
            setEditingTask(null);
          }}
        />
      )}
      <CreateOrganizerModal
        mode={createMode}
        categories={categories}
        onClose={() => setCreateMode(null)}
        onSave={(name, selectedCategory) =>
          createMode === "folder"
            ? addFolder(name, selectedCategory)
            : addCategory(name)
        }
      />
      <DeleteFolderModal
        folder={deleting}
        taskCount={
          deleting
            ? tasks.filter((task) => task.folderId === deleting.id).length
            : 0
        }
        onClose={() => setDeleting(null)}
        onKeep={() => removeFolder(false)}
        onDelete={() => removeFolder(true)}
      />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: "create-new-folder" | "category";
  label: string;
  onPress: () => void;
}) {
  const colors = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.actionButton,
        { backgroundColor: colors.surface, borderColor: colors.outline },
      ]}
    >
      <AppIcon name={icon} size={18} tintColor={colors.primary} />
      <Text style={[styles.actionText, { color: colors.primary }]}>
        {label}
      </Text>
    </Pressable>
  );
}
function FilterChip({
  name,
  color,
  selected,
  onPress,
  onDelete,
}: {
  name: string;
  color?: string;
  selected: boolean;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const colors = useAppTheme();
  const content = <>{color && <View style={[styles.dot, { backgroundColor: color }]} />}<Text style={[styles.filterText, { color: colors.text }]}>{name}</Text></>;
  if (onDelete) return (
    <View style={[styles.filterGroup, { backgroundColor: selected ? colors.primaryContainer : colors.surface, borderColor: selected ? colors.primary : colors.outline }]}>
      <Pressable onPress={onPress} style={styles.filterMain}>{content}</Pressable>
      <Pressable accessibilityLabel={`Delete ${name} category`} onPress={onDelete} style={styles.deleteIcon}><AppIcon name="delete-outline" size={17} tintColor={colors.error} /></Pressable>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filter,
        {
          backgroundColor: selected ? colors.primaryContainer : colors.surface,
          borderColor: selected ? colors.primary : colors.outline,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}
function FolderChip({
  folder,
  count,
  selected,
  onPress,
  onDelete,
}: {
  folder: Folder;
  count: number;
  selected: boolean;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const colors = useAppTheme();
  return (
    <View
      style={[
        styles.folderChip,
        {
          backgroundColor: selected ? colors.primaryContainer : colors.surface,
          borderColor: selected ? colors.primary : colors.outline,
        },
      ]}
    >
      <Pressable onPress={onPress} style={styles.folderMain}>
        <View style={[styles.dot, { backgroundColor: folder.color }]} />
        <Text style={[styles.filterText, { color: colors.text }]}>
          {folder.name}
        </Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {count}
        </Text>
      </Pressable>
      {onDelete && (
        <Pressable
          accessibilityLabel={`Delete ${folder.name} folder`}
          onPress={onDelete}
          style={styles.deleteIcon}
        >
          <AppIcon name="delete-outline" size={18} tintColor={colors.error} />
        </Pressable>
      )}
    </View>
  );
}

function CreateOrganizerModal({
  mode,
  categories,
  onClose,
  onSave,
}: {
  mode: CreateMode | null;
  categories: { id: string; name: string; color: string }[];
  onClose: () => void;
  onSave: (name: string, categoryId: string) => boolean;
}) {
  const colors = useAppTheme();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "life");
  const save = () => {
    if (!name.trim()) return;
    if (!onSave(name, categoryId)) {
      Alert.alert("Name already exists", `Choose a different ${mode} name.`);
      return;
    }
    setName("");
    onClose();
  };
  return (
    <Modal
      transparent
      visible={mode !== null}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <View style={styles.dialogHeading}>
            <View
              style={[
                styles.dialogIcon,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <AppIcon
                name={mode === "category" ? "category" : "create-new-folder"}
                tintColor={colors.primary}
              />
            </View>
            <View>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>
                Create {mode}
              </Text>
              <Text
                style={[styles.dialogSubtitle, { color: colors.textSecondary }]}
              >
                {mode === "folder"
                  ? "Folders live inside a category."
                  : "Categories group related folders."}
              </Text>
            </View>
          </View>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            onSubmitEditing={save}
            placeholder={mode === "folder" ? "e.g. Finance" : "e.g. Business"}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.dialogInput,
              { color: colors.text, borderColor: colors.outline },
            ]}
          />
          {mode === "folder" && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  name={category.name}
                  color={category.color}
                  selected={category.id === categoryId}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </ScrollView>
          )}
          <View style={styles.dialogActions}>
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontWeight: "700" }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={save}
              style={[styles.dialogSave, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.dialogSaveText}>Create</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DeleteFolderModal({
  folder,
  taskCount,
  onClose,
  onKeep,
  onDelete,
}: {
  folder: Folder | null;
  taskCount: number;
  onClose: () => void;
  onKeep: () => void;
  onDelete: () => void;
}) {
  const colors = useAppTheme();
  return (
    <Modal
      transparent
      visible={folder !== null}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <View style={[styles.dialogIcon, { backgroundColor: "#FFDAD6" }]}>
            <AppIcon name="delete-outline" tintColor={colors.error} />
          </View>
          <View>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>
              Delete “{folder?.name}”?
            </Text>
            <Text
              style={[styles.deleteMessage, { color: colors.textSecondary }]}
            >
              {taskCount
                ? `This folder contains ${taskCount} task${taskCount === 1 ? "" : "s"}. Choose what should happen to them.`
                : "This folder has no tasks and can be removed safely."}
            </Text>
          </View>
          {taskCount > 0 && (
            <Pressable
              onPress={onKeep}
              style={[styles.choiceButton, { borderColor: colors.outline }]}
            >
              <AppIcon name="drive-file-move" tintColor={colors.primary} />
              <View>
                <Text style={[styles.choiceTitle, { color: colors.text }]}>
                  Keep tasks
                </Text>
                <Text
                  style={[
                    styles.dialogSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Move them to Uncategorized
                </Text>
              </View>
            </Pressable>
          )}
          <Pressable
            onPress={onDelete}
            style={[styles.choiceButton, { borderColor: colors.error }]}
          >
            <AppIcon name="delete-forever" tintColor={colors.error} />
            <View>
              <Text style={[styles.choiceTitle, { color: colors.error }]}>
                {taskCount ? "Delete folder and tasks" : "Delete folder"}
              </Text>
              <Text
                style={[styles.dialogSubtitle, { color: colors.textSecondary }]}
              >
                This cannot be undone
              </Text>
            </View>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={{ color: colors.textSecondary, fontWeight: "800" }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
