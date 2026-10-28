import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';

/** Current on-screen keyboard height (0 when hidden). */
export function useKeyboardHeight() {
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

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  /**
   * Add the keyboard height as bottom padding so the last field can scroll above the keyboard.
   * Turn off inside containers that already shrink for the keyboard (bottom sheets).
   */
  inset?: boolean;
  /** Extra clearance kept between the focused field and the keyboard / pinned footer. */
  clearance?: number;
}

/**
 * ScrollView that keeps the focused text input visible above the keyboard. Android edge-to-edge
 * apps are not resized by the system when the keyboard opens, so without this a field near the
 * bottom of a form (e.g. Remarks) ends up hidden behind the keyboard.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  ({ inset = true, clearance = 24, contentContainerStyle, onScroll, children, ...rest }, ref) => {
    const inner = useRef<ScrollView>(null);
    const offset = useRef(0);
    const keyboardHeight = useKeyboardHeight();

    useImperativeHandle(ref, () => inner.current as ScrollView);

    const scrollFocusedIntoView = useCallback(() => {
      const field = TextInput.State.currentlyFocusedInput?.();
      if (!field || !inner.current) return;
      field.measureInWindow((_x, y, _w, h) => {
        const visibleBottom = Dimensions.get('window').height - keyboardHeight - clearance;
        const overflow = y + h - visibleBottom;
        if (overflow > 0) inner.current?.scrollTo({ y: offset.current + overflow, animated: true });
      });
    }, [keyboardHeight, clearance]);

    useEffect(() => {
      if (keyboardHeight <= 0) return;
      // Let the padding below commit before measuring.
      const id = setTimeout(scrollFocusedIntoView, 60);
      return () => clearTimeout(id);
    }, [keyboardHeight, scrollFocusedIntoView]);

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = e.nativeEvent.contentOffset.y;
      onScroll?.(e);
    };

    return (
      <ScrollView
        ref={inner}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        {...rest}
        onScroll={handleScroll}
        contentContainerStyle={[contentContainerStyle, inset && keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 24 } : null]}
      >
        {children}
      </ScrollView>
    );
  }
);
KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';
