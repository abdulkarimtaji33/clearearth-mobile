import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, { container: string; text: string }> = {
  primary: { container: 'bg-primary-600 active:bg-primary-700', text: 'text-white' },
  secondary: {
    container: 'bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800',
    text: 'text-primary-700 dark:text-primary-300',
  },
  ghost: { container: 'bg-transparent', text: 'text-primary-700 dark:text-primary-300' },
  destructive: { container: 'bg-danger-500 active:bg-danger-600', text: 'text-white' },
};

const SIZE_STYLES: Record<ButtonSize, { container: string; text: string }> = {
  md: { container: 'px-4 py-3 rounded-md', text: 'text-base' },
  lg: { container: 'px-5 py-4 rounded-lg', text: 'text-lg' },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  fullWidth,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = disabled || loading;
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={(e) => {
        scale.value = withTiming(0.97, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 120 });
        onPressOut?.(e);
      }}
      style={animatedStyle}
      className={`flex-row items-center justify-center gap-2 ${s.container} ${v.container} ${
        fullWidth ? 'w-full' : ''
      } ${isDisabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? '#1F7F4E' : '#fff'} />
      ) : (
        icon
      )}
      <Text className={`font-semibold ${s.text} ${v.text}`}>{label}</Text>
    </AnimatedPressable>
  );
}
