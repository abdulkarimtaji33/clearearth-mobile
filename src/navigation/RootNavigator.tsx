import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@/hooks/AuthContext';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';

export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-primary-900">
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }

  return <NavigationContainer>{status === 'signedIn' ? <AppStack /> : <AuthStack />}</NavigationContainer>;
}
