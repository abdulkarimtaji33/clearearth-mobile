import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search pickups...' }: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-700 px-3.5">
      <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
      <TextInput
        className="flex-1 py-3 text-base text-neutral-900 dark:text-neutral-50"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} className="pl-2">
          <Ionicons name="close-circle" size={18} color="#94A3B8" />
        </Pressable>
      ) : null}
    </View>
  );
}
