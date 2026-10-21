import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back chevron (stack screens). */
  back?: boolean;
  right?: React.ReactNode;
  /** Navy gradient-free dark variant used by hero screens. */
  dark?: boolean;
}

/** Standard top bar for ops screens: safe-area aware, optional back button and right actions. */
export function ScreenHeader({ title, subtitle, back = false, right, dark = false }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      className={`px-5 pb-3 flex-row items-center ${
        dark ? 'bg-neutral-950' : 'bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800'
      }`}
      style={{ paddingTop: insets.top + 10 }}
    >
      {back ? (
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mr-3 w-9 h-9 rounded-full items-center justify-center bg-neutral-100 dark:bg-neutral-800"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text
          className={`text-xl font-extrabold ${dark ? 'text-white' : 'text-neutral-900 dark:text-neutral-50'}`}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View className="flex-row items-center ml-3" style={{ gap: 8 }}>{right}</View> : null}
    </View>
  );
}

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  badge?: number;
  tone?: 'default' | 'light';
}

/** Round icon button for header actions, with an optional count badge. */
export function IconButton({ icon, onPress, label, badge, tone = 'default' }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`w-10 h-10 rounded-full items-center justify-center ${
        tone === 'light' ? 'bg-white/15' : 'bg-neutral-100 dark:bg-neutral-800'
      }`}
    >
      <Ionicons name={icon} size={20} color={tone === 'light' ? '#FFFFFF' : '#334155'} />
      {badge && badge > 0 ? (
        <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 items-center justify-center">
          <Text className="text-white text-[10px] font-extrabold">{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
