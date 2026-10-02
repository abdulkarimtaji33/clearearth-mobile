import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InspectionListScreen } from '@/screens/inspections/InspectionListScreen';
import { InspectionDetailScreen } from '@/screens/inspections/InspectionDetailScreen';
import { InspectionReportScreen } from '@/screens/inspections/InspectionReportScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { InspectionStackParamList } from './types';

const Stack = createNativeStackNavigator<InspectionStackParamList>();

export function InspectionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
      <Stack.Screen name="InspectionList" component={InspectionListScreen} />
      <Stack.Screen
        name="InspectionDetail"
        component={InspectionDetailScreen}
        options={{ animation: 'slide_from_right', fullScreenGestureEnabled: true }}
      />
      <Stack.Screen
        name="InspectionReport"
        component={InspectionReportScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right', fullScreenGestureEnabled: true }}
      />
    </Stack.Navigator>
  );
}
