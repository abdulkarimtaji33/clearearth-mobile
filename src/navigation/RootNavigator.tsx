import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@/hooks/AuthContext';
import { isInspectionRole } from '@/lib/roles';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { InspectionStack } from './InspectionStack';

export function RootNavigator() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-primary-900">
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }

  if (status !== 'signedIn') {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {isInspectionRole(user?.role) ? <InspectionStack /> : <AppStack />}
    </NavigationContainer>
  );
}
