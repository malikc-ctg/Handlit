// app/(tabs)/tasks.tsx — Task List Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useTaskStore } from '../../stores/useTaskStore';
import { useUserStore } from '../../stores/useUserStore';
import { Task } from '../../lib/db';
import TaskForm from '../../components/TaskForm';
import { Colors, Spacing, Radius, FontSize, FontWeight, DIFFICULTY_COLORS, DIFFICULTY_LABELS, TIME_LABELS } from '../../lib/theme';
import { NewTaskInput } from '../../stores/useTaskStore';
import Svg, { Path } from 'react-native-svg';

function PlusIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

interface TaskRowProps {
  task: Task;
  onEdit: (task: Task) => void;
  onArchive: (id: string) => void;
}

function TaskRow({ task, onEdit, onArchive }: TaskRowProps) {
  const isPaused = task.status === 'paused';
  const diffColor = DIFFICULTY_COLORS[task.difficulty] ?? Colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.taskRow, isPaused && styles.taskRowPaused, pressed && styles.taskRowPressed]}
      onLongPress={() => onEdit(task)}
      accessibilityLabel={`Task: ${task.title}`}
    >
      <View style={styles.taskLeft}>
        <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
          <View style={styles.taskMeta}>
            {isPaused && (
              <View style={styles.pausedBadge}>
                <Text style={styles.pausedText}>Paused</Text>
              </View>
            )}
            <Text style={styles.taskMetaText}>
              {TIME_LABELS[task.estimated_minutes] ?? `${task.estimated_minutes}m`}
            </Text>
            <Text style={styles.taskMetaText}>·</Text>
            <Text style={[styles.taskMetaText, { color: diffColor }]}>
              {DIFFICULTY_LABELS[task.difficulty] ?? task.difficulty}
            </Text>
            {task.category ? (
              <>
                <Text style={styles.taskMetaText}>·</Text>
                <Text style={styles.taskMetaText}>{task.category}</Text>
              </>
            ) : null}
          </View>
        </View>
      </View>
      <Pressable
        onPress={() => onArchive(task.id)}
        style={styles.archiveBtn}
        accessibilityLabel="Archive task"
        hitSlop={12}
        id={`archive-task-${task.id}`}
      >
        <Text style={styles.archiveBtnText}>···</Text>
      </Pressable>
    </Pressable>
  );
}

export default function TasksScreen() {
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const editTask = useTaskStore((s) => s.editTask);
  const archiveTask = useTaskStore((s) => s.archiveTask);
  const userState = useUserStore((s) => s.userState);
  const streak = userState?.current_streak ?? 0;

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openTasks = tasks.filter((t) => t.status === 'open' || t.status === 'paused');
  const archivedTasks = tasks.filter((t) => t.status === 'archived');

  async function handleSaveNew(input: NewTaskInput) {
    await addTask(input, streak);
    setShowForm(false);
  }

  async function handleSaveEdit(input: NewTaskInput) {
    if (!editingTask) return;
    await editTask(editingTask.id, input, streak);
    setEditingTask(null);
  }

  function handleArchivePress(id: string) {
    Alert.alert(
      'Archive Task',
      'This will remove the task from your active list. You can view archived tasks below.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () => archiveTask(id, streak),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
          onPress={() => setShowForm(true)}
          id="add-task-fab"
          accessibilityLabel="Add new task"
        >
          <PlusIcon />
        </Pressable>
      </View>

      <FlatList
        data={openTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow task={item} onEdit={setEditingTask} onArchive={handleArchivePress} />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tasks yet.</Text>
            <Text style={styles.emptyBody}>Tap + to add your first task.</Text>
          </View>
        }
        ListFooterComponent={
          archivedTasks.length > 0 ? (
            <View style={styles.archivedSection}>
              <Text style={styles.archivedLabel}>ARCHIVED ({archivedTasks.length})</Text>
              {archivedTasks.map((t) => (
                <View key={t.id} style={styles.archivedRow}>
                  <Text style={styles.archivedTitle} numberOfLines={1}>{t.title}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* New Task Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="fullScreen">
        <TaskForm
          onSave={handleSaveNew}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal visible={!!editingTask} animationType="slide" presentationStyle="fullScreen">
        {editingTask && (
          <TaskForm
            initialValues={{
              title: editingTask.title,
              estimated_minutes: editingTask.estimated_minutes,
              difficulty: editingTask.difficulty,
              category: editingTask.category ?? '',
              notes: editingTask.notes ?? '',
            }}
            onSave={handleSaveEdit}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 40 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderMuted,
    gap: Spacing.md,
  },
  taskRowPaused: { borderColor: Colors.warningDim, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  taskRowPressed: { opacity: 0.8 },
  taskLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  diffDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  taskInfo: { flex: 1, gap: 4 },
  taskTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.medium, lineHeight: 22 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  taskMetaText: { color: Colors.textMuted, fontSize: FontSize.xs },
  pausedBadge: {
    backgroundColor: Colors.warningDim + '55',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pausedText: { color: Colors.warning, fontSize: 10, fontWeight: FontWeight.semibold },
  archiveBtn: { padding: Spacing.xs },
  archiveBtnText: { color: Colors.textMuted, fontSize: FontSize.lg, letterSpacing: 2 },
  emptyState: { padding: Spacing.xxl, alignItems: 'center', gap: Spacing.sm },
  emptyTitle: { color: Colors.textSecondary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },
  emptyBody: { color: Colors.textMuted, fontSize: FontSize.md },
  archivedSection: { marginTop: Spacing.xl, gap: Spacing.sm },
  archivedLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, letterSpacing: 1, textTransform: 'uppercase' },
  archivedRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    opacity: 0.5,
  },
  archivedTitle: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
