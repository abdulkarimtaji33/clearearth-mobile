import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useWorkTypes } from '@/hooks/ops/useLookups';
import { createWorkType } from '@/api/ops/common.api';
import { opsKeys } from '@/api/ops/keys';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';

interface WorkTypePickerSheetProps {
  visible: boolean;
  selectedId: number | null;
  onClose: () => void;
  onPick: (id: number, name: string) => void;
}

/** Single-select work type list with inline "new work type" creation. */
export function WorkTypePickerSheet({ visible, selectedId, onClose, onPick }: WorkTypePickerSheetProps) {
  const { data } = useWorkTypes();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const created = await createWorkType(trimmed);
      await qc.invalidateQueries({ queryKey: opsKeys.workTypes });
      haptic.success();
      setName('');
      setAdding(false);
      onPick(created.id, created.name);
    } catch (err) {
      toast.show(toUserMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Work type">
      {(data ?? [])
        .filter((w) => w.is_active !== false)
        .map((w) => {
          const on = w.id === selectedId;
          return (
            <Pressable
              key={w.id}
              onPress={() => {
                haptic.tap();
                onPick(w.id, w.name);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              className="flex-row items-center py-3.5 border-b border-neutral-100 dark:border-neutral-800"
            >
              <Text className={`flex-1 text-base ${on ? 'font-bold text-primary-700 dark:text-primary-300' : 'text-neutral-900 dark:text-neutral-50'}`}>
                {w.name}
              </Text>
              {on ? <Ionicons name="checkmark-circle" size={22} color="#059669" /> : null}
            </Pressable>
          );
        })}
      {adding ? (
        <View className="mt-4" style={{ gap: 10 }}>
          <Input label="New work type" value={name} onChangeText={setName} placeholder="e.g. Sorting" autoFocus />
          <Button label="Create and use" loading={saving} onPress={handleCreate} fullWidth />
        </View>
      ) : (
        <Pressable onPress={() => setAdding(true)} className="flex-row items-center py-4" style={{ gap: 8 }} accessibilityRole="button">
          <Ionicons name="add-circle-outline" size={22} color="#059669" />
          <Text className="text-base font-semibold text-primary-700 dark:text-primary-300">New work type</Text>
        </Pressable>
      )}
    </BottomSheet>
  );
}
