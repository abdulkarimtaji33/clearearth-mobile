import React from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

export interface StepperStep {
  key: string;
  label: string;
}

interface StatusStepperProps {
  steps: StepperStep[];
  activeIndex: number; // 0-based index of the current (or last completed) step
}

function StepDot({ filled, active }: { filled: boolean; active: boolean }) {
  const style = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(filled ? '#10B981' : '#E2E8F0', { duration: 250 }),
      transform: [{ scale: withTiming(active ? 1.15 : 1, { duration: 250 }) }],
    }),
    [filled, active]
  );
  return (
    <Animated.View
      style={style}
      className={`w-4 h-4 rounded-full ${active ? 'border-2 border-primary-200' : ''}`}
    />
  );
}

export function StatusStepper({ steps, activeIndex }: StatusStepperProps) {
  return (
    <View className="flex-row items-start">
      {steps.map((step, index) => {
        const filled = index <= activeIndex;
        const isLast = index === steps.length - 1;
        return (
          <View key={step.key} className="flex-1 items-center">
            <View className="flex-row items-center w-full">
              <View className="flex-1" />
              <StepDot filled={filled} active={index === activeIndex} />
              <View className="flex-1">
                {!isLast && (
                  <View
                    className={`h-0.5 ${index < activeIndex ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                  />
                )}
              </View>
            </View>
            <Text
              className={`text-xs mt-2 text-center ${
                filled
                  ? 'text-primary-700 dark:text-primary-300 font-semibold'
                  : 'text-neutral-400 dark:text-neutral-500'
              }`}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
