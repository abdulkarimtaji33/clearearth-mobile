import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StepIndicatorProps {
  steps: string[];
  /** Zero-based current step. */
  current: number;
}

/** Numbered progress dots for the multi-step wizards. */
export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center px-5 py-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View className="items-center" style={{ width: 64 }}>
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  done || active ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              >
                {done ? (
                  <Ionicons name="checkmark" size={17} color="#fff" />
                ) : (
                  <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-neutral-500 dark:text-neutral-300'}`}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                className={`text-[11px] mt-1 font-semibold ${
                  active ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-500 dark:text-neutral-400'
                }`}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 ? (
              <View
                className={`flex-1 h-0.5 -mt-4 ${i < current ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}
