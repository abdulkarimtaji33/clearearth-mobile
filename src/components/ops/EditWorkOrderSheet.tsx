import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface EditWorkOrderSheetProps {
  visible: boolean;
  title: string | null;
  notes: string | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: { title: string; notes: string }) => void;
}

export function EditWorkOrderSheet({ visible, title, notes, saving = false, onClose, onSave }: EditWorkOrderSheetProps) {
  const [t, setT] = useState('');
  const [n, setN] = useState('');

  useEffect(() => {
    if (visible) {
      setT(title ?? '');
      setN(notes ?? '');
    }
  }, [visible, title, notes]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit work order"
      footer={<Button label="Save changes" loading={saving} onPress={() => onSave({ title: t.trim(), notes: n.trim() })} fullWidth size="lg" />}
    >
      <View style={{ gap: 14 }}>
        <Input label="Title" value={t} onChangeText={setT} placeholder="Work order title" />
        <Input label="Notes" value={n} onChangeText={setN} multiline numberOfLines={4} textAlignVertical="top" className="min-h-[96px]" />
      </View>
    </BottomSheet>
  );
}
