import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { OpsRealtimeProvider } from '@/hooks/ops/OpsRealtimeProvider';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { OpsTabBar } from './OpsTabBar';
import { HomeScreen } from '@/screens/ops/HomeScreen';
import { WorkListScreen } from '@/screens/ops/WorkListScreen';
import { WorkOrderDetailScreen } from '@/screens/ops/WorkOrderDetailScreen';
import { OrdersScreen } from '@/screens/ops/OrdersScreen';
import { OrderDetailScreen } from '@/screens/ops/OrderDetailScreen';
import { CreateWorkOrderScreen } from '@/screens/ops/CreateWorkOrderScreen';
import { StockScreen } from '@/screens/ops/StockScreen';
import { GrnDetailScreen } from '@/screens/ops/GrnDetailScreen';
import { MoreScreen } from '@/screens/ops/MoreScreen';
import { NotificationsScreen } from '@/screens/ops/NotificationsScreen';
import { DealsScreen } from '@/screens/ops/DealsScreen';
import { DealDetailScreen } from '@/screens/ops/DealDetailScreen';
import { CertificatesScreen } from '@/screens/ops/CertificatesScreen';
import { LeaveScreen } from '@/screens/ops/LeaveScreen';
import { WorkTypesScreen } from '@/screens/ops/WorkTypesScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';
import type { OpsStackParamList, OpsTabParamList } from './types';

const Tab = createBottomTabNavigator<OpsTabParamList>();
const Stack = createNativeStackNavigator<OpsStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator tabBar={(props) => <OpsTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Work" component={WorkListScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Stock" component={StockScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

const push = { animation: 'slide_from_right', fullScreenGestureEnabled: true } as const;

/** Everything the operations_manager role sees: a tab shell with detail screens pushed on top. */
export function OperationsNavigator() {
  return (
    <OpsRealtimeProvider>
      <View className="flex-1">
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="WorkOrderDetail" component={WorkOrderDetailScreen} options={push} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={push} />
          <Stack.Screen
            name="CreateWorkOrder"
            component={CreateWorkOrderScreen}
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <Stack.Screen name="GrnDetail" component={GrnDetailScreen} options={push} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={push} />
          <Stack.Screen name="Deals" component={DealsScreen} options={push} />
          <Stack.Screen name="DealDetail" component={DealDetailScreen} options={push} />
          <Stack.Screen name="Certificates" component={CertificatesScreen} options={push} />
          <Stack.Screen name="Leave" component={LeaveScreen} options={push} />
          <Stack.Screen name="WorkTypes" component={WorkTypesScreen} options={push} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={push} />
        </Stack.Navigator>
        <OfflineBanner />
      </View>
    </OpsRealtimeProvider>
  );
}
