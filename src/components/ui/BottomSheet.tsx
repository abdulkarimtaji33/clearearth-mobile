import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pinned below the scrolling content (primary action buttons). */
  footer?: React.ReactNode;
  /** Fraction of the screen height the sheet may use. */
  maxHeightRatio?: number;
  /** Fill the available height instead of hugging the content (long pickers). */
  tall?: boolean;
}

/**
 * Modal bottom sheet: dimmed backdrop (tap to dismiss), springy slide-in, keyboard aware,
 * scrolling body and an optional pinned footer. Android back button closes it.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightRatio = 0.9,
  tall = false,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();

  const available = windowHeight * maxHeightRatio - Math.max(keyboardHeight - insets.bottom, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-end" style={{ paddingBottom: keyboardHeight }}>
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
        {visible ? (
          <Animated.View
            entering={SlideInDown.springify().damping(22).stiffness(220)}
            className="bg-white dark:bg-neutral-900 rounded-t-3xl overflow-hidden"
            style={{ maxHeight: available, height: tall ? available : undefined }}
          >
            <View className="items-center pt-2.5 pb-1">
              <View className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            </View>
            {title ? (
              <View className="flex-row items-start px-5 pt-2 pb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-xl font-extrabold text-neutral-900 dark:text-neutral-50">{title}</Text>
                  {subtitle ? (
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={18} color="#64748B" />
                </Pressable>
              </View>
            ) : null}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: footer ? 12 : Math.max(insets.bottom, 16) + 8,
                paddingTop: title ? 0 : 8,
              }}
              style={tall ? { flex: 1 } : { flexGrow: 0 }}
            >
              {children}
            </ScrollView>
            {footer ? (
              <View
                className="px-5 pt-3 border-t border-neutral-100 dark:border-neutral-800"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
              >
                {footer}
              </View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}
