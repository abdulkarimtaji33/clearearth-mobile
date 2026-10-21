import React from 'react';
import { Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';

interface Person {
  first_name?: string | null;
  last_name?: string | null;
}

export const personName = (p?: Person | null) =>
  p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Unknown' : 'Unassigned';

interface AvatarStackProps {
  people: Person[];
  size?: number;
  max?: number;
}

/** Overlapping avatars with a "+N" overflow bubble. */
export function AvatarStack({ people, size = 28, max = 3 }: AvatarStackProps) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <View className="flex-row items-center">
      {shown.map((p, i) => (
        <View
          key={`${personName(p)}-${i}`}
          className="rounded-full border-2 border-white dark:border-neutral-900"
          style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}
        >
          <Avatar name={personName(p)} size={size} />
        </View>
      ))}
      {extra > 0 ? (
        <View
          className="rounded-full bg-neutral-200 dark:bg-neutral-700 items-center justify-center border-2 border-white dark:border-neutral-900"
          style={{ width: size, height: size, marginLeft: -size * 0.3 }}
        >
          <Text className="text-neutral-600 dark:text-neutral-200 font-bold" style={{ fontSize: size * 0.34 }}>
            +{extra}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
