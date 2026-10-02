import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { callPhoneNumber, openPickupLocation } from '@/lib/linking';
import type { InspectionRequest } from '@/api/types';

export function InspectionDealCard({ request }: { request: InspectionRequest }) {
  const deal = request.deal;
  const contact = deal?.contact;
  const contactName = contact ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() : null;
  const contactNumber = contact?.mobile || contact?.phone;

  if (!deal) return null;

  return (
    <Card>
      <View className="flex-row items-center gap-1.5 mb-2">
        <Ionicons name="business-outline" size={17} color="#0F172A" />
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">
          {deal.company?.company_name ?? 'Company'}
        </Text>
      </View>
      {deal.deal_number ? (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Deal #{deal.deal_number}</Text>
      ) : null}
      {contactName ? (
        <Text className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Contact: {contactName}</Text>
      ) : null}

      <View className="flex-row gap-3">
        {request.location ? (
          <View className="flex-1">
            <Button
              label="Open in Maps"
              variant="secondary"
              icon={<Ionicons name="map-outline" size={17} color="#059669" />}
              onPress={() => openPickupLocation(request.location!)}
            />
          </View>
        ) : null}
        {contactNumber ? (
          <View className="flex-1">
            <Button
              label="Call"
              icon={<Ionicons name="call-outline" size={17} color="#fff" />}
              onPress={() => callPhoneNumber(contactNumber)}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
