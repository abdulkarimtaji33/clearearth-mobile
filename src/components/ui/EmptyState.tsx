import React from 'react';
import { Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-16 px-8">
      {icon ? <View className="mb-4">{icon}</View> : null}
      <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-200 text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1.5 leading-5">
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
