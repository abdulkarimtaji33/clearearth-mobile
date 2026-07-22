import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthContext';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, tenant, signOut } = useAuth();
  const toast = useToast();
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Driver';

  function resetPasswordForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleChangePassword() {
    setFormError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('Fill in all three fields.');
      return;
    }
    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      resetPasswordForm();
      toast.show('Password changed successfully', 'success');
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Could not change password — please try again.');
    }
  }

  function handleSignOutPress() {
    Alert.alert('Sign out?', "You'll need to sign in again to see your pickups.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View
        className="flex-row items-center px-5 pb-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} className="mr-3">
          <Ionicons name="chevron-back" size={26} color="#334155" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Card>
          <View className="items-center py-2">
            <Avatar name={fullName} size={72} />
            <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-3">{fullName}</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.email}</Text>
            <View className="flex-row gap-2 mt-3">
              <View className="bg-primary-50 dark:bg-primary-900/40 rounded-full px-3 py-1">
                <Text className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase">
                  {user?.role ?? 'driver'}
                </Text>
              </View>
              {tenant?.companyName ? (
                <View className="bg-neutral-100 dark:bg-neutral-800 rounded-full px-3 py-1">
                  <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    {tenant.companyName}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card>

        <Card>
          <View className="flex-row items-center gap-1.5 mb-1">
            <Ionicons name="lock-closed-outline" size={17} color="#0F172A" />
            <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">Change password</Text>
          </View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Use at least 8 characters.
          </Text>

          <View className="gap-4">
            <Input
              label="Current password"
              secureTextEntry
              textContentType="password"
              placeholder="••••••••"
              defaultValue={currentPassword}
              onChangeText={(t) => {
                setCurrentPassword(t);
                if (formError) setFormError(null);
              }}
            />
            <Input
              label="New password"
              secureTextEntry
              textContentType="newPassword"
              placeholder="••••••••"
              defaultValue={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (formError) setFormError(null);
              }}
            />
            <Input
              label="Confirm new password"
              secureTextEntry
              textContentType="newPassword"
              placeholder="••••••••"
              defaultValue={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (formError) setFormError(null);
              }}
            />
          </View>

          {formError ? (
            <View className="bg-danger-500/10 rounded-md px-3.5 py-3 mt-4">
              <Text className="text-danger-600 text-sm">{formError}</Text>
            </View>
          ) : null}

          <View className="mt-5">
            <Button
              label="Update password"
              onPress={handleChangePassword}
              loading={changePasswordMutation.isPending}
            />
          </View>
        </Card>

        <TouchableOpacity
          onPress={handleSignOutPress}
          className="bg-danger-500/10 rounded-lg py-4 items-center flex-row justify-center gap-2"
        >
          <Ionicons name="log-out-outline" size={19} color="#B93838" />
          <Text className="text-danger-600 font-semibold text-base">Sign out</Text>
        </TouchableOpacity>

        <Text className="text-xs text-neutral-400 dark:text-neutral-600 text-center mt-2">
          ClearEarth Driver v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>
    </View>
  );
}
