import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  maximumDate?: Date;
  disabled?: boolean;
  error?: string;
}

/**
 * Native date/time picker, platform-correct: Android opens the system dialog
 * imperatively (the only supported way to show one on Android — rendering
 * `<DateTimePicker>` inline there renders the spinner permanently on-screen),
 * iOS shows a spinner inside a bottom sheet with Cancel/Done so a stray tap
 * can't silently commit a half-scrolled value.
 */
export function DateTimeField({ label, value, onChange, mode = 'date', maximumDate, disabled, error }: DateTimeFieldProps) {
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function handlePress() {
    if (disabled) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        maximumDate,
        is24Hour: true,
        onChange: (_event, selected) => {
          if (selected) onChange(selected);
        },
      });
    } else {
      setDraft(value);
      setIosPickerOpen(true);
    }
  }

  const formatted =
    mode === 'time'
      ? value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View className="w-full">
      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{label}</Text>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        className={`flex-row items-center justify-between rounded-md border px-3.5 py-3.5 bg-white dark:bg-neutral-900 ${
          error ? 'border-danger-500' : 'border-neutral-200 dark:border-neutral-700'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <Text className="text-base text-neutral-900 dark:text-neutral-50">{formatted}</Text>
        <Ionicons name={mode === 'time' ? 'time-outline' : 'calendar-outline'} size={18} color="#94A3B8" />
      </Pressable>
      {error ? <Text className="text-xs text-danger-500 mt-1.5">{error}</Text> : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={iosPickerOpen} transparent animationType="fade" onRequestClose={() => setIosPickerOpen(false)}>
          <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setIosPickerOpen(false)}>
            <Pressable className="bg-white dark:bg-neutral-900 rounded-t-2xl pb-6">
              <View className="flex-row justify-between items-center px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <Pressable onPress={() => setIosPickerOpen(false)} hitSlop={8}>
                  <Text className="text-neutral-500 dark:text-neutral-400 text-base">Cancel</Text>
                </Pressable>
                <Text className="font-bold text-neutral-900 dark:text-neutral-50">{label}</Text>
                <Pressable
                  onPress={() => {
                    onChange(draft);
                    setIosPickerOpen(false);
                  }}
                  hitSlop={8}
                >
                  <Text className="text-primary-600 font-bold text-base">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode={mode}
                display="spinner"
                maximumDate={maximumDate}
                onChange={(_event, selected) => {
                  if (selected) setDraft(selected);
                }}
                style={{ height: 200 }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
