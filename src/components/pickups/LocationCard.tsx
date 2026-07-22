import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { callPhoneNumber, openPickupLocation } from '@/lib/linking';
import type { PickupDealWithCompany } from '@/api/types';

interface LocationCardProps {
  deal: PickupDealWithCompany;
}

export function LocationCard({ deal }: LocationCardProps) {
  if (!deal.pickup_location && !deal.pickup_contact_number) return null;

  return (
    <Card>
      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Pickup location</Text>

      {deal.pickup_location ? (
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-3" numberOfLines={2}>
          {deal.pickup_location}
        </Text>
      ) : null}

      {deal.pickup_contact_name ? (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          Contact: {deal.pickup_contact_name}
        </Text>
      ) : null}

      <View className="flex-row gap-3">
        {deal.pickup_location ? (
          <View className="flex-1">
            <Button
              label="Open in Maps"
              variant="secondary"
              onPress={() => openPickupLocation(deal.pickup_location!)}
            />
          </View>
        ) : null}
        {deal.pickup_contact_number ? (
          <View className="flex-1">
            <Button label="Call" onPress={() => callPhoneNumber(deal.pickup_contact_number!)} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
