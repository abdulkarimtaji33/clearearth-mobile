import React from 'react';
import { Text, View } from 'react-native';

interface AvatarProps {
  name: string;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function Avatar({ name, size = 44 }: AvatarProps) {
  return (
    <View
      className="bg-primary-100 dark:bg-primary-900/50 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <Text className="text-primary-700 dark:text-primary-300 font-bold" style={{ fontSize: size * 0.36 }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
