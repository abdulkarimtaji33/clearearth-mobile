import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatFullDate } from '@/lib/format';

interface RescheduleSheetProps {
  visible: boolean;
  requestedDate?: string | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}

/** Operations can't pick a date themselves: they ask sales for a different one, with a reason. */
export function RescheduleSheet({ visible, requestedDate, loading = false, onClose, onSubmit }: RescheduleSheetProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) setNote('');
  }, [visible]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Request a different date"
      subtitle={requestedDate ? `Sales asked for ${formatFullDate(requestedDate)}` : undefined}
      footer={<Button label="Send request to sales" loading={loading} onPress={() => onSubmit(note.trim())} fullWidth size="lg" />}
    >
      <View style={{ gap: 8 }}>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400 leading-5">
          Sales will be notified and can submit a new pickup date. Tell them what works (optional).
        </Text>
        <Input
          label="Note for sales"
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Trucks are fully booked that day, can we do the day after?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="min-h-[96px]"
        />
      </View>
    </BottomSheet>
  );
}
