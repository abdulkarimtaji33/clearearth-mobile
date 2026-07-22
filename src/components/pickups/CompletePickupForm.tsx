import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PhotoPicker, type PickedPhoto } from './PhotoPicker';
import { useUomOptions } from '@/hooks/useDropdown';
import type { CompletePickupPayload } from '@/api/types';

const CONDITIONS = ['Good', 'Fair', 'Poor', 'Damaged'] as const;
const REMARKS_MAX = 250;

interface CompletePickupFormProps {
  initialQuantity?: string | null;
  initialUom?: string | null;
  initialCondition?: string | null;
  initialRemarks?: string | null;
  submitting: boolean;
  uploadProgress?: number | null;
  onSubmit: (payload: CompletePickupPayload) => void;
}

export function CompletePickupForm({
  initialQuantity,
  initialUom,
  initialCondition,
  initialRemarks,
  submitting,
  uploadProgress,
  onSubmit,
}: CompletePickupFormProps) {
  const { options: uomOptions } = useUomOptions();
  const [quantity, setQuantity] = useState(initialQuantity ?? '');
  const [uom, setUom] = useState(initialUom ?? '');
  const [condition, setCondition] = useState(initialCondition ?? '');
  const [remarks, setRemarks] = useState(initialRemarks ?? '');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  function handleSubmit() {
    onSubmit({
      quantity: quantity.trim() || undefined,
      uom: uom.trim() || undefined,
      condition: condition.trim() || undefined,
      remarks: remarks.trim() || undefined,
      photos,
    });
  }

  return (
    <View className="gap-4">
      <Card>
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">
          Quantity &amp; condition
        </Text>

        <View className="mb-4">
          <Input
            label="Quantity collected"
            keyboardType="decimal-pad"
            placeholder="0"
            value={quantity}
            onChangeText={setQuantity}
            editable={!submitting}
          />
        </View>

        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Unit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {uomOptions.map((option) => {
              const selected = uom === option;
              return (
                <Pressable
                  key={option}
                  disabled={submitting}
                  onPress={() => setUom(option)}
                  className={`px-3.5 py-2 rounded-full ${
                    selected ? 'bg-primary-600' : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Condition</Text>
        <View className="flex-row gap-2">
          {CONDITIONS.map((option) => {
            const selected = condition === option;
            return (
              <Pressable
                key={option}
                disabled={submitting}
                onPress={() => setCondition(option)}
                className={`flex-1 py-2.5 rounded-md items-center border ${
                  selected
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <PhotoPicker photos={photos} onChange={setPhotos} disabled={submitting} />

      <Card>
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Remarks</Text>
        <TextInput
          multiline
          numberOfLines={4}
          maxLength={REMARKS_MAX}
          value={remarks}
          onChangeText={setRemarks}
          editable={!submitting}
          placeholder="Any notes about this pickup..."
          placeholderTextColor="#A4AC9B"
          className="text-base text-neutral-900 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-700 rounded-md p-3.5 min-h-[96px]"
          textAlignVertical="top"
        />
        <Text className="text-xs text-neutral-400 dark:text-neutral-500 text-right mt-1.5">
          {remarks.length}/{REMARKS_MAX}
        </Text>
      </Card>

      <Button
        label={
          submitting
            ? uploadProgress != null
              ? `Uploading ${uploadProgress}%...`
              : 'Confirming...'
            : 'Confirm Pickup'
        }
        onPress={handleSubmit}
        loading={submitting}
        fullWidth
        size="lg"
      />
    </View>
  );
}
