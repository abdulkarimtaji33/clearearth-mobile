import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/hooks/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiUrlSheet } from '@/components/ui/ApiUrlSheet';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim().length > 3 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      // error state surfaced via useAuth().error
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-primary-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6">
          <Animated.View entering={FadeInDown.duration(500)} className="items-center mt-16 mb-10">
            <View className="w-20 h-20 rounded-2xl bg-primary-500 items-center justify-center mb-5">
              <Text className="text-3xl">🌿</Text>
            </View>
            <Text className="text-2xl font-bold text-white">ClearEarth Driver</Text>
            <Text className="text-primary-200 mt-1.5">Pickups made simple</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            className="bg-white dark:bg-neutral-900 rounded-xl p-6"
            style={{
              shadowColor: '#0F3A27',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-5">Sign in</Text>

            <View className="gap-4">
              <Input
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@company.com"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) clearError();
                }}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <Input
                ref={passwordRef}
                label="Password"
                secureTextEntry={!showPassword}
                textContentType="password"
                placeholder="••••••••"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) clearError();
                }}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                    <Text className="text-primary-600 text-sm font-medium">
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                }
              />
            </View>

            {error ? (
              <View className="bg-danger-500/10 rounded-md px-3.5 py-3 mt-4">
                <Text className="text-danger-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <View className="mt-6">
              <Button label="Sign in" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} fullWidth />
            </View>
          </Animated.View>

          {__DEV__ ? (
            <TouchableOpacity
              onPress={() => setSettingsOpen(true)}
              className="items-center mt-6 mb-8"
              hitSlop={12}
            >
              <Text className="text-primary-300 text-xs">Connection settings</Text>
            </TouchableOpacity>
          ) : (
            <View className="mb-8" />
          )}
        </View>
      </ScrollView>

      {__DEV__ ? <ApiUrlSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} /> : null}
    </KeyboardAvoidingView>
  );
}
