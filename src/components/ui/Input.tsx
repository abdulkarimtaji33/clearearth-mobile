import React, { forwardRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className = '', onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View className="w-full">
        {label ? (
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">{label}</Text>
        ) : null}
        <View
          className={`flex-row items-center rounded-md border px-3.5 bg-white dark:bg-neutral-900 ${
            error
              ? 'border-danger-500'
              : focused
                ? 'border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700'
          }`}
        >
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <TextInput
            ref={ref}
            className={`flex-1 py-3.5 text-base text-neutral-900 dark:text-neutral-50 ${className}`}
            placeholderTextColor="#94A3B8"
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {rightElement}
        </View>
        {error ? (
          <Text className="text-xs text-danger-500 mt-1.5">{error}</Text>
        ) : hint ? (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">{hint}</Text>
        ) : null}
      </View>
    );
  }
);
Input.displayName = 'Input';
