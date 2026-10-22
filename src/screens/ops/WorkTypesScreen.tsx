import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWorkTypes } from '@/hooks/ops/useLookups';
import { usePermission } from '@/hooks/usePermission';
import { createWorkType, deleteWorkType, updateWorkType } from '@/api/ops/common.api';
import { opsKeys } from '@/api/ops/keys';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { WorkType } from '@/api/ops/types';

export function WorkTypesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();
  const { can } = usePermission();
  const { data, isLoading, isError, refetch } = useWorkTypes();

  const [editing, setEditing] = useState<{ type: WorkType | null } | null>(null);
  const [deleting, setDeleting] = useState<WorkType | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const canCreate = can('operations.create');
  const canUpdate = can('operations.update');
  const canDelete = can('operations.delete');

  function openEditor(type: WorkType | null) {
    setName(type?.name ?? '');
    setEditing({ type });
  }

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: opsKeys.workTypes });
      haptic.success();
      toast.show(ok, 'success');
      return true;
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const ok = editing?.type
      ? await run(() => updateWorkType(editing.type!.id, trimmed), 'Work type renamed')
      : await run(() => createWorkType(trimmed), 'Work type added');
    if (ok) setEditing(null);
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader
        title="Work types"
        subtitle="Used when building tasks"
        back
        right={canCreate ? (
          <Pressable onPress={() => openEditor(null)} accessibilityRole="button" accessibilityLabel="Add work type" className="w-10 h-10 rounded-full bg-primary-600 items-center justify-center">
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        ) : null}
      />
      {isLoading ? (
        <View className="p-5" style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </View>
      ) : isError ? (
        <EmptyState title="Couldn't load work types" action={<Button label="Retry" onPress={() => refetch()} />} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          {(data ?? []).length === 0 ? (
            <EmptyState icon={<Ionicons name="pricetags-outline" size={40} color="#94A3B8" />} title="No work types yet" description="Add one to start building tasks." />
          ) : (
            <Card padded={false}>
              {(data ?? []).map((w, i) => (
                <View
                  key={w.id}
                  className={`flex-row items-center px-4 py-3.5 ${i > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''}`}
                  style={{ gap: 12 }}
                >
                  <Text className="flex-1 text-base font-semibold text-neutral-900 dark:text-neutral-50">{w.name}</Text>
                  {canUpdate ? (
                    <Pressable onPress={() => openEditor(w)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Rename ${w.name}`}>
                      <Ionicons name="create-outline" size={20} color="#64748B" />
                    </Pressable>
                  ) : null}
                  {canDelete ? (
                    <Pressable onPress={() => setDeleting(w)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${w.name}`}>
                      <Ionicons name="trash-outline" size={20} color="#C23B3B" />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      )}

      <BottomSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.type ? 'Rename work type' : 'New work type'}
        footer={<Button label="Save" loading={busy} onPress={save} fullWidth size="lg" disabled={!name.trim()} />}
      >
        <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Sorting" autoFocus />
      </BottomSheet>

      <ConfirmSheet
        visible={deleting !== null}
        destructive
        title={`Delete "${deleting?.name ?? ''}"?`}
        message="This is blocked while any task uses this work type."
        confirmLabel="Delete"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting && (await run(() => deleteWorkType(deleting.id), 'Work type deleted'))) setDeleting(null);
          else setDeleting(null);
        }}
      />
    </View>
  );
}
