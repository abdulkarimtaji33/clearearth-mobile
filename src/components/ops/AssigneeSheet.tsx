import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAssignees } from '@/hooks/ops/useLookups';
import { fullName } from '@/lib/opsFormat';
import { haptic } from '@/lib/haptics';

interface AssigneeSheetProps {
  visible: boolean;
  onClose: () => void;
  initialIds: number[];
  saving?: boolean;
  title?: string;
  onSave: (ids: number[]) => void;
}

/** Multi-select picker for task assignees. Drivers are listed first. */
export function AssigneeSheet({ visible, onClose, initialIds, saving = false, title = 'Assign to', onSave }: AssigneeSheetProps) {
  const { data, isLoading, isError, refetch } = useAssignees();
  const [selected, setSelected] = useState<number[]>(initialIds);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setSelected(initialIds);
      setSearch('');
    }
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const people = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? [])
      .filter((u) => !q || fullName(u).toLowerCase().includes(q))
      .sort((a, b) => {
        const ad = a.role?.name === 'driver' ? 0 : 1;
        const bd = b.role?.name === 'driver' ? 0 : 1;
        return ad - bd || fullName(a).localeCompare(fullName(b));
      });
  }, [data, search]);

  const toggle = (id: number) => {
    haptic.tap();
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={selected.length ? `${selected.length} selected` : 'Pick one or more people'}
      tall
      footer={
        <Button
          label={selected.length ? `Save (${selected.length})` : 'Save as unassigned'}
          loading={saving}
          onPress={() => onSave(selected)}
          fullWidth
          size="lg"
        />
      }
    >
      <View className="mb-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search people..." />
      </View>
      {isLoading ? (
        <ActivityIndicator color="#10B981" style={{ marginVertical: 32 }} />
      ) : isError ? (
        <EmptyState
          title="Couldn't load people"
          action={<Button label="Retry" variant="secondary" onPress={() => refetch()} />}
        />
      ) : people.length === 0 ? (
        <EmptyState title="No matching people" />
      ) : (
        people.map((u) => {
          const on = selected.includes(u.id);
          return (
            <Pressable
              key={u.id}
              onPress={() => toggle(u.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              className="flex-row items-center py-3 border-b border-neutral-100 dark:border-neutral-800"
              style={{ gap: 12 }}
            >
              <Avatar name={fullName(u)} size={40} />
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-50">{fullName(u)}</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {u.role?.display_name ?? u.role?.name ?? 'Team'}
                </Text>
              </View>
              <View
                className={`w-6 h-6 rounded-md items-center justify-center border-2 ${
                  on ? 'bg-primary-600 border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
                }`}
              >
                {on ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
              </View>
            </Pressable>
          );
        })
      )}
    </BottomSheet>
  );
}
