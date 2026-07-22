import React from 'react';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND } from '@/theme/tokens';

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
  primary: { container: '', text: 'text-white' },
  secondary: {
    container: 'bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800',
    text: 'text-primary-700 dark:text-primary-300',
  },
  ghost: { container: 'bg-transparent', text: 'text-primary-700 dark:text-primary-300' },
  destructive: { container: 'bg-danger-500 active:bg-danger-600', text: 'text-white' },
};

const SIZE_STYLES: Record<ButtonSize, { container: string; text: string; radius: number }> = {
  md: { container: 'px-4 py-3', text: 'text-base', radius: 12 },
  lg: { container: 'px-5 py-4', text: 'text-lg', radius: 16 },
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
  const isGradient = variant === 'primary';

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
      className={`overflow-hidden ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      {isGradient ? (
        <LinearGradient
          colors={[BRAND.green, BRAND.teal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: s.radius }}
          className={`flex-row items-center justify-center gap-2 ${s.container}`}
        >
          {loading ? <ActivityIndicator color="#fff" /> : icon}
          <Text className={`font-semibold ${s.text} ${v.text}`}>{label}</Text>
        </LinearGradient>
      ) : (
        <Animated.View
          className={`flex-row items-center justify-center gap-2 rounded-md ${s.container} ${v.container}`}
          style={{ borderRadius: s.radius }}
        >
          {loading ? (
            <ActivityIndicator color={variant === 'destructive' ? '#fff' : BRAND.green} />
          ) : (
            icon
          )}
          <Text className={`font-semibold ${s.text} ${v.text}`}>{label}</Text>
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}
