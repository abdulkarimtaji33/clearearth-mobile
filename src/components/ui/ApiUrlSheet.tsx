import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiBaseUrl, resetApiBaseUrl, setApiBaseUrl } from '@/lib/env';
import { Button } from './Button';
import { Input } from './Input';

interface ApiUrlSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Dev-only override so testers on different networks can point the app at their
 * machine's LAN IP without a rebuild. Never rendered in production builds (guarded
 * by __DEV__ at the call site).
 */
export function ApiUrlSheet({ visible, onClose }: ApiUrlSheetProps) {
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState(getApiBaseUrl());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      onShow={() => setUrl(getApiBaseUrl())}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <View
          className="bg-white dark:bg-neutral-900 rounded-t-xl px-5 pt-5"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <View className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 self-center mb-5" />
          <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-1">
            API connection (dev only)
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Point this app at your backend&apos;s address, e.g. http://192.168.1.23:3000/api/v1
          </Text>
          <Input
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://192.168.1.23:3000/api/v1"
          />
          <View className="flex-row gap-3 mt-5">
            <View className="flex-1">
              <Button
                label="Reset to default"
                variant="secondary"
                onPress={async () => {
                  await resetApiBaseUrl();
                  setUrl(getApiBaseUrl());
                }}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Save"
                onPress={async () => {
                  await setApiBaseUrl(url.trim());
                  onClose();
                }}
              />
            </View>
          </View>
          <TouchableOpacity onPress={onClose} className="items-center mt-4">
            <Text className="text-neutral-500 dark:text-neutral-400 text-sm">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
