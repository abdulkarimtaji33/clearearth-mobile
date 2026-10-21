import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  /** Extra content between the message and the buttons (summaries, lists). */
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation bottom sheet. Replaces Alert.alert for anything consequential. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  children,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={loading ? () => undefined : onCancel}
      footer={
        <View style={{ gap: 10 }}>
          <Button
            label={confirmLabel}
            variant={destructive ? 'destructive' : 'primary'}
            loading={loading}
            onPress={onConfirm}
            fullWidth
            size="lg"
          />
          <Button label={cancelLabel} variant="ghost" onPress={onCancel} disabled={loading} fullWidth />
        </View>
      }
    >
      <View className="items-center pt-2 pb-3">
        <View
          className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
            destructive ? 'bg-overdue-bg' : 'bg-primary-50'
          }`}
        >
          <Ionicons
            name={destructive ? 'warning-outline' : 'help-circle-outline'}
            size={28}
            color={destructive ? '#C23B3B' : '#059669'}
          />
        </View>
        <Text className="text-xl font-extrabold text-neutral-900 dark:text-neutral-50 text-center">{title}</Text>
        {message ? (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-2 leading-5">{message}</Text>
        ) : null}
      </View>
      {children}
    </BottomSheet>
  );
}
