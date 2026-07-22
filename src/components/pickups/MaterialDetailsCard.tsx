import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { PickupMaterial } from '@/api/types';

interface MaterialDetailsCardProps {
  material: PickupMaterial;
}

export function MaterialDetailsCard({ material }: MaterialDetailsCardProps) {
  return (
    <Card>
      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Material details</Text>
      <View className="flex-row flex-wrap gap-3">
        {material.materialType ? (
          <View className="bg-primary-50 dark:bg-primary-900/30 rounded-md px-3 py-2 flex-1 min-w-[45%]">
            <Text className="text-xs text-primary-600 dark:text-primary-300 mb-0.5">Type</Text>
            <Text className="text-sm font-semibold text-primary-800 dark:text-primary-200">
              {material.materialType}
            </Text>
          </View>
        ) : null}
        {material.quantity != null ? (
          <View className="bg-primary-50 dark:bg-primary-900/30 rounded-md px-3 py-2 flex-1 min-w-[45%]">
            <Text className="text-xs text-primary-600 dark:text-primary-300 mb-0.5">Expected qty</Text>
            <Text className="text-sm font-semibold text-primary-800 dark:text-primary-200">
              {material.quantity} {material.unit ?? ''}
            </Text>
          </View>
        ) : null}
      </View>
      {material.specification ? (
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 leading-5">
          {material.specification}
        </Text>
      ) : null}
    </Card>
  );
}
