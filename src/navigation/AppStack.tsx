import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PickupListScreen } from '@/screens/pickups/PickupListScreen';
import { PickupDetailScreen } from '@/screens/pickups/PickupDetailScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PickupList" component={PickupListScreen} />
      <Stack.Screen
        name="PickupDetail"
        component={PickupDetailScreen}
        options={{ animation: 'slide_from_right', fullScreenGestureEnabled: true }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right', fullScreenGestureEnabled: true }}
      />
    </Stack.Navigator>
  );
}
