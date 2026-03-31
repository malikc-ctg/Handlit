// components/TaskForm.tsx
// Full-screen modal form for creating/editing tasks.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../lib/theme';
import { Difficulty } from '../lib/db';
import { NewTaskInput } from '../stores/useTaskStore';

const TIME_OPTIONS = [5, 15, 30, 60, 90];
const TIME_LABELS: Record<number, string> = { 5: '5m', 15: '15m', 30: '30m', 60: '1hr', 90: '90m' };
const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'medium', 'hard'];

interface Props {
  initialValues?: Partial<NewTaskInput>;
  onSave: (input: NewTaskInput) => void;
  onCancel: () => void;
}

export default function TaskForm({ initialValues, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialValues?.estimated_minutes ?? 30);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialValues?.difficulty ?? 'medium');
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  const canSave = title.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({ title, estimated_minutes: estimatedMinutes, difficulty, category, notes });
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.cancelBtn} id="cancel-task-btn">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Task</Text>
        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          disabled={!canSave}
          id="save-task-btn"
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={Colors.textMuted}
            maxLength={200}
            autoFocus
            returnKeyType="done"
            id="task-title-input"
            accessibilityLabel="Task title"
          />
        </View>

        {/* Estimated time */}
        <View style={styles.field}>
          <Text style={styles.label}>Estimated Time</Text>
          <View style={styles.pillRow}>
            {TIME_OPTIONS.map((min) => (
              <Pressable
                key={min}
                style={[styles.pill, estimatedMinutes === min && styles.pillActive]}
                onPress={() => setEstimatedMinutes(min)}
                accessibilityLabel={`${TIME_LABELS[min]} time option`}
              >
                <Text style={[styles.pillText, estimatedMinutes === min && styles.pillTextActive]}>
                  {TIME_LABELS[min]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.field}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.pillRow}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <Pressable
                key={d}
                style={[
                  styles.pill,
                  difficulty === d && { backgroundColor: DIFFICULTY_COLORS[d] + '33', borderColor: DIFFICULTY_COLORS[d] },
                ]}
                onPress={() => setDifficulty(d)}
                accessibilityLabel={`${DIFFICULTY_LABELS[d]} difficulty`}
              >
                <Text
                  style={[
                    styles.pillText,
                    difficulty === d && { color: DIFFICULTY_COLORS[d], fontWeight: FontWeight.semibold },
                  ]}
                >
                  {DIFFICULTY_LABELS[d]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Work, Health, Personal"
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
            returnKeyType="next"
            id="task-category-input"
          />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any context or steps..."
            placeholderTextColor={Colors.textMuted}
            maxLength={1000}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            id="task-notes-input"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  cancelBtn: { padding: Spacing.xs },
  cancelText: { color: Colors.textSecondary, fontSize: FontSize.md },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  saveBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  saveText: { color: Colors.textPrimary, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  saveTextDisabled: { color: Colors.textMuted },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 60 },
  field: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  optional: { color: Colors.textMuted, fontWeight: FontWeight.regular, textTransform: 'none' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesInput: { minHeight: 100 },
  pillRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: { backgroundColor: Colors.accent + '33', borderColor: Colors.accent },
  pillText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  pillTextActive: { color: Colors.accent, fontWeight: FontWeight.semibold },
});
