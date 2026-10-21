import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  color?: string;
  height?: number;
  trackClassName?: string;
}

/** Thin animated progress bar. */
export function ProgressBar({
  value,
  color = '#10B981',
  height = 6,
  trackClassName = 'bg-neutral-100 dark:bg-neutral-800',
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: 450 });
  }, [clamped, progress]);

  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View className={`rounded-full overflow-hidden ${trackClassName}`} style={{ height }}>
      <Animated.View style={[style, { height, backgroundColor: color, borderRadius: height }]} />
    </View>
  );
}
