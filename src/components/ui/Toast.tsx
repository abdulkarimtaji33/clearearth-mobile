import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ToastTone = 'success' | 'error' | 'info';

const TONE_ICONS: Record<ToastTone, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-primary-700',
  error: 'bg-danger-600',
  info: 'bg-neutral-800',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const idRef = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = ++idRef.current;
      setToast({ id, message, tone });
      translateY.value = withSpring(0, { damping: 16 });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 220 });
        setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 220);
      }, 2600);
    },
    [translateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          style={[animatedStyle, { top: insets.top + 8 }]}
          className={`absolute left-4 right-4 flex-row items-center gap-2 rounded-lg px-4 py-3.5 ${TONE_CLASSES[toast.tone]}`}
        >
          <Ionicons name={TONE_ICONS[toast.tone]} size={18} color="#fff" />
          <Text className="flex-1 text-white text-sm font-medium">{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
