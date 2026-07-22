import React from 'react';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND } from '@/theme/tokens';

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
    <LinearGradient
      colors={[BRAND.green, BRAND.teal]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text className="text-white font-bold" style={{ fontSize: size * 0.36 }}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
}
