import React, { useRef, useState } from 'react';
import {
  Image,
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiUrlSheet } from '@/components/ui/ApiUrlSheet';
import { BRAND } from '@/theme/tokens';

const LOGO = require('../../../assets/images/clearearth-logo.png');

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
    <LinearGradient
      colors={[BRAND.dark, '#0d2137', '#0a2e1f']}
      locations={[0, 0.6, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className="flex-1"
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Hero ── */}
          <Animated.View entering={FadeInDown.duration(500)} className="items-center pt-10 pb-8 px-6">
            <View
              className="w-24 h-24 rounded-2xl bg-white items-center justify-center mb-5 p-3"
              style={{
                shadowColor: BRAND.green,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Image source={LOGO} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
            </View>
            <Text className="text-2xl font-extrabold text-white text-center">Clear Earth</Text>
            <Text className="text-emerald-200/80 mt-1.5 text-center" style={{ color: '#A7F3D0' }}>
              Smarter waste. Greener future.
            </Text>
          </Animated.View>

          {/* ── Form sheet ── */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            className="flex-1 bg-white dark:bg-neutral-950 rounded-t-3xl px-6 pt-8"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <Text className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Welcome back</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 mb-6">
              Sign in to your Clear Earth account
            </Text>

            <View className="gap-4">
              <Input
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@company.com"
                defaultValue={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) clearError();
                }}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                leftIcon={<Ionicons name="mail-outline" size={18} color="#94A3B8" />}
              />
              <Input
                ref={passwordRef}
                label="Password"
                secureTextEntry={!showPassword}
                textContentType="password"
                placeholder="••••••••"
                defaultValue={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) clearError();
                }}
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            {error ? (
              <View className="flex-row items-start gap-2 bg-danger-500/10 rounded-md px-3.5 py-3 mt-4">
                <Ionicons name="alert-circle-outline" size={16} color="#B93838" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-danger-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <View className="mt-6">
              <Button label="Sign in" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} fullWidth size="lg" />
            </View>

            <View className="flex-row items-center gap-3 my-6">
              <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              <Text className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">CLEAR EARTH ERP</Text>
              <View className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </View>

            <Text className="text-xs text-neutral-400 dark:text-neutral-500 text-center mb-4">
              Don&apos;t have an account? Contact your system administrator.
            </Text>

            {__DEV__ ? (
              <TouchableOpacity onPress={() => setSettingsOpen(true)} className="items-center mb-8" hitSlop={12}>
                <Text className="text-neutral-300 dark:text-neutral-600 text-xs">Connection settings</Text>
              </TouchableOpacity>
            ) : (
              <View className="mb-8" />
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {__DEV__ ? <ApiUrlSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} /> : null}
    </LinearGradient>
  );
}
