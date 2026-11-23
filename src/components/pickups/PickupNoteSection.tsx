import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { PickupNoteDetails, PickupNoteItem } from '@/api/types';

export const emptyPickupNote = (): PickupNoteDetails => ({
  noteNumber: '', pickupDate: '', vehicleNo: '', referenceNo: '', pickupType: '', serviceType: '', serviceOffered: '',
  customerName: '', customerAddress: '', contactPerson: '', contactNo: '', email: '',
  specialRequest: '', freeNote: '', items: [],
});

interface Props {
  value: PickupNoteDetails;
  onChange: (v: PickupNoteDetails) => void;
  disabled?: boolean;
}

/** Pick-up note details (header, customer, item lines, special request, free-text note). */
export function PickupNoteSection({ value, onChange, disabled }: Props) {
  const set = (patch: Partial<PickupNoteDetails>) => onChange({ ...value, ...patch });
  const text = (key: keyof PickupNoteDetails, label: string, extra: object = {}) => (
    <View className="mb-3">
      <Input
        label={label}
        value={String(value[key] ?? '')}
        onChangeText={(t) => set({ [key]: t } as Partial<PickupNoteDetails>)}
        editable={!disabled}
        {...extra}
      />
    </View>
  );
  const items = value.items ?? [];
  const setItem = (i: number, patch: Partial<PickupNoteItem>) =>
    set({ items: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const total = items.reduce((s, it) => s + (Number(it.weightKg) || 0), 0);

  return (
    <Card>
      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Pick-up note</Text>
      {text('noteNumber', 'Pick-up note no.', { placeholder: 'Assigned automatically when saved' })}
      {text('pickupDate', 'Date of pick up (YYYY-MM-DD)')}
      {text('vehicleNo', 'Vehicle no.')}
      {text('referenceNo', 'Reference no.')}

      <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Pick-up type</Text>
      <View className="flex-row gap-2 mb-3">
        {(['corporate', 'individual'] as const).map((t) => {
          const selected = value.pickupType === t;
          return (
            <Pressable
              key={t}
              disabled={disabled}
              onPress={() => set({ pickupType: t })}
              className={`flex-1 py-2.5 rounded-md items-center border ${
                selected ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Text className={`text-xs font-semibold ${selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}>
                {t === 'corporate' ? 'Corporate' : 'Individual'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {text('serviceType', 'Service type')}
      {text('serviceOffered', 'Detailed service offered', { multiline: true, textAlignVertical: 'top' })}

      <Text className="text-sm font-bold text-primary-700 mt-1 mb-2">Customer details</Text>
      {text('customerName', 'Name')}
      {text('customerAddress', 'Address')}
      {text('contactPerson', 'Contact person')}
      {text('contactNo', 'Contact no.', { keyboardType: 'phone-pad' })}
      {text('email', 'Email address', { keyboardType: 'email-address', autoCapitalize: 'none' })}

      <Text className="text-sm font-bold text-primary-700 mt-1 mb-2">Items</Text>
      {items.map((it, i) => (
        <View key={i} className="mb-3 p-3 rounded-md border border-neutral-200 dark:border-neutral-700">
          <Input
            label={`Item ${i + 1} description`}
            value={it.description}
            onChangeText={(t) => setItem(i, { description: t })}
            editable={!disabled}
          />
          <View className="flex-row gap-2 mt-2">
            <View className="flex-1">
              <Input label="Unit (nos)" value={it.unit} onChangeText={(t) => setItem(i, { unit: t })} editable={!disabled} />
            </View>
            <View className="flex-1">
              <Input
                label="Weight (kg)"
                keyboardType="decimal-pad"
                value={String(it.weightKg ?? '')}
                onChangeText={(t) => setItem(i, { weightKg: t })}
                editable={!disabled}
              />
            </View>
          </View>
          {!disabled ? (
            <Pressable onPress={() => set({ items: items.filter((_, idx) => idx !== i) })} className="mt-2 self-end">
              <Text className="text-sm font-semibold text-danger-500">Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {!disabled ? (
        <Pressable
          onPress={() => set({ items: [...items, { description: '', unit: '', weightKg: '' }] })}
          className="py-2.5 rounded-md items-center border border-primary-600 mb-2"
        >
          <Text className="text-sm font-semibold text-primary-700">+ Add item</Text>
        </Pressable>
      ) : null}
      <Text className="text-sm font-bold text-neutral-900 dark:text-neutral-50 text-right mb-3">
        Total: {total.toLocaleString('en-US', { maximumFractionDigits: 3 })} kg
      </Text>

      {text('specialRequest', 'Special request', { multiline: true, textAlignVertical: 'top' })}
      {text('freeNote', 'Note', { multiline: true, textAlignVertical: 'top', placeholder: 'Anything else about this pick-up' })}
    </Card>
  );
}
