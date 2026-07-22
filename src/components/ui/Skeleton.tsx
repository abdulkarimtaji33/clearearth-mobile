import React, { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function Skeleton({ className = '', style, ...rest }: ViewProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`bg-neutral-200 dark:bg-neutral-800 rounded-md ${className}`}
      style={[animatedStyle, style]}
      {...rest}
    />
  );
}

export function PickupCardSkeleton() {
  return (
    <View className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800 p-4 mb-3">
      <View className="flex-row justify-between mb-3">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </View>
      <Skeleton className="h-3 w-3/5 mb-2" />
      <Skeleton className="h-3 w-2/5" />
    </View>
  );
}
