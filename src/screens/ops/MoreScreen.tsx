import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useNotifications } from '@/hooks/ops/useNotifications';
import { useTheme, type ThemePreference } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { OpsStackParamList } from '@/navigation/types';

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  badge?: number;
  onPress: () => void;
}

function Row({ icon, label, hint, badge, onPress }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center px-4 py-3.5 active:bg-neutral-50 dark:active:bg-neutral-800"
      style={{ gap: 14 }}
    >
      <View className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/40 items-center justify-center">
        <Ionicons name={icon} size={20} color="#059669" />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-neutral-900 dark:text-neutral-50">{label}</Text>
        {hint ? <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{hint}</Text> : null}
      </View>
      {badge && badge > 0 ? (
        <View className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-danger-500 items-center justify-center">
          <Text className="text-white text-xs font-extrabold">{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </Pressable>
  );
}

const Divider = () => <View className="h-px bg-neutral-100 dark:bg-neutral-800 ml-[70px]" />;

export function MoreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const { user, tenant, signOut } = useAuth();
  const { can } = usePermission();
  const { data: notes } = useNotifications();
  const { preference, setPreference } = useTheme();

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User';
  const canCerts = can('certificates.read');
  const canLeave = can('hr.leave.approve');

  function handleSignOut() {
    Alert.alert('Sign out?', "You'll need to sign in again to continue.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Open profile">
          <Card>
            <View className="flex-row items-center" style={{ gap: 14 }}>
              <Avatar name={fullName} size={56} />
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-neutral-900 dark:text-neutral-50">{fullName}</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Operations Manager</Text>
                {tenant?.companyName ? <Text className="text-xs text-neutral-400 mt-0.5">{tenant.companyName}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </Card>
        </Pressable>

        <Card padded={false}>
          <Row icon="notifications-outline" label="Notifications" hint="Pickup dates, expenses, GRN updates" badge={notes?.unreadCount} onPress={() => navigation.navigate('Notifications')} />
          <Divider />
          <Row icon="briefcase-outline" label="Deals" hint="Read-only, with pickup details" onPress={() => navigation.navigate('Deals')} />
          <Divider />
          <Row icon="pricetags-outline" label="Work types" hint="Pickup, delivery, destruction..." onPress={() => navigation.navigate('WorkTypes')} />
          {canCerts ? (
            <>
              <Divider />
              <Row icon="ribbon-outline" label="Certificates" hint="Requests and issued register" onPress={() => navigation.navigate('Certificates')} />
            </>
          ) : null}
          {canLeave ? (
            <>
              <Divider />
              <Row icon="airplane-outline" label="Team leave" hint="Approve your team's requests" onPress={() => navigation.navigate('Leave')} />
            </>
          ) : null}
        </Card>

        <Card>
          <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 mb-3">Appearance</Text>
          <SegmentedControl<ThemePreference>
            options={[
              { key: 'system', label: 'System' },
              { key: 'light', label: 'Light' },
              { key: 'dark', label: 'Dark' },
            ]}
            value={preference}
            onChange={setPreference}
          />
        </Card>

        <Card padded={false}>
          <Row icon="person-circle-outline" label="Profile and password" onPress={() => navigation.navigate('Profile')} />
          <Divider />
          <Pressable onPress={handleSignOut} accessibilityRole="button" className="flex-row items-center px-4 py-3.5" style={{ gap: 14 }}>
            <View className="w-10 h-10 rounded-full bg-overdue-bg items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#C23B3B" />
            </View>
            <Text className="text-[15px] font-bold text-danger-500">Sign out</Text>
          </Pressable>
        </Card>

        <Text className="text-center text-xs text-neutral-400">ClearEarth Operations · v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
    </View>
  );
}
