import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickDocuments, pickPhotos, takePhoto } from '@/lib/media';
import type { UploadFile } from '@/lib/upload';

interface AttachBarProps {
  onPicked: (files: UploadFile[]) => void;
  disabled?: boolean;
  allowDocuments?: boolean;
  limit?: number;
}

const Btn = ({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    className={`flex-1 items-center py-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 ${
      disabled ? 'opacity-50' : 'active:opacity-70'
    }`}
    style={{ gap: 4 }}
  >
    <Ionicons name={icon} size={20} color="#059669" />
    <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">{label}</Text>
  </Pressable>
);

/** Camera / gallery / (optionally) document buttons that hand back picked files. */
export function AttachBar({ onPicked, disabled, allowDocuments = true, limit = 10 }: AttachBarProps) {
  const run = async (fn: () => Promise<UploadFile[]>) => {
    const files = await fn();
    if (files.length) onPicked(files);
  };
  return (
    <View className="flex-row" style={{ gap: 10 }}>
      <Btn icon="camera-outline" label="Camera" disabled={disabled} onPress={() => run(takePhoto)} />
      <Btn icon="images-outline" label="Gallery" disabled={disabled} onPress={() => run(() => pickPhotos(limit))} />
      {allowDocuments ? <Btn icon="document-attach-outline" label="File" disabled={disabled} onPress={() => run(pickDocuments)} /> : null}
    </View>
  );
}
