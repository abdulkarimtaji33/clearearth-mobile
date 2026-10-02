import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { useToast } from '@/components/ui/Toast';
import { PhotoPicker, type PickedPhoto } from '@/components/pickups/PhotoPicker';
import { useInspectionRequest, useSaveInspectionReport } from '@/hooks/useInspections';
import { useUomOptions } from '@/hooks/useDropdown';
import type { InspectionStackParamList } from '@/navigation/types';

const CARGO_TYPES = ['unpacked', 'packed', 'palletized'] as const;
const TRANSPORT_OPTIONS = ['1 ton', '3 ton', '10 ton', 'trailer', 'reefer', 'lowbed trailer'] as const;
const LUMPSUM = 'lumpsum';

function Chip({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`px-3.5 py-2 rounded-full ${selected ? 'bg-primary-600' : 'bg-neutral-100 dark:bg-neutral-800'}`}
    >
      <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InspectionReportScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<InspectionStackParamList>>();
  const route = useRoute<RouteProp<InspectionStackParamList, 'InspectionReport'>>();
  const { id, dealId } = route.params;
  const toast = useToast();

  const { data: request } = useInspectionRequest(id);
  const existingReport = request?.deal?.inspectionReport;
  const { options: uomOptions } = useUomOptions();

  const [inspectionDateTime, setInspectionDateTime] = useState(
    existingReport?.inspection_datetime ? new Date(existingReport.inspection_datetime) : new Date()
  );
  const [weightUom, setWeightUom] = useState(existingReport?.weight_uom ?? '');
  const [weight, setWeight] = useState(existingReport?.approximate_weight?.toString() ?? '');
  const [cargoType, setCargoType] = useState(existingReport?.cargo_type ?? '');
  const [transport, setTransport] = useState(existingReport?.transportation_arrangement ?? '');
  const [value, setValue] = useState(existingReport?.approximate_value?.toString() ?? '');
  const [notes, setNotes] = useState(existingReport?.notes ?? '');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLumpsum = weightUom === LUMPSUM;
  const hasExistingImages = (existingReport?.images?.length ?? 0) > 0;
  const saveMutation = useSaveInspectionReport(id, dealId, setUploadProgress);

  // Snapshot the pre-filled values once so "discard changes?" only fires on
  // fields the inspector actually touched, not on every edit of an existing report.
  const [initialSnapshot] = useState({ weightUom, weight, cargoType, transport, value, notes });
  const isDirty =
    photos.length > 0 ||
    weightUom !== initialSnapshot.weightUom ||
    weight !== initialSnapshot.weight ||
    cargoType !== initialSnapshot.cargoType ||
    transport !== initialSnapshot.transport ||
    value !== initialSnapshot.value ||
    notes !== initialSnapshot.notes;

  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (!isDirty || saveMutation.isSuccess) return;
      e.preventDefault();
      Alert.alert('Discard report?', 'You have unsaved changes to this inspection report.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [navigation, isDirty, saveMutation.isSuccess]);

  function validate(): string | null {
    if (!weightUom) return 'Select a unit of measure.';
    if (!isLumpsum && !weight.trim()) return 'Approximate weight is required.';
    if (!cargoType) return 'Select a cargo packing type.';
    if (!transport) return 'Select a transportation arrangement.';
    if (photos.length === 0 && !hasExistingImages) return 'Attach at least one photo.';
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await saveMutation.mutateAsync({
        inspectionDatetime: inspectionDateTime.toISOString(),
        approximateWeight: isLumpsum ? undefined : weight.trim(),
        weightUom,
        cargoType,
        transportationArrangement: transport,
        approximateValue: value.trim() || undefined,
        notes: notes.trim() || undefined,
        photos,
        existingImages: existingReport?.images,
      });
      toast.show('Inspection report submitted', 'success');
      navigation.goBack();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not submit the report — please try again.');
    } finally {
      setUploadProgress(null);
    }
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <View
        className="flex-row items-center px-5 pb-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          className="mr-3"
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Inspection report</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Card>
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Inspection date &amp; time</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <DateTimeField
                label="Date"
                mode="date"
                value={inspectionDateTime}
                maximumDate={new Date()}
                disabled={saveMutation.isPending}
                onChange={(picked) =>
                  setInspectionDateTime((prev) => {
                    const next = new Date(prev);
                    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
                    return next;
                  })
                }
              />
            </View>
            <View className="flex-1">
              <DateTimeField
                label="Time"
                mode="time"
                value={inspectionDateTime}
                disabled={saveMutation.isPending}
                onChange={(picked) =>
                  setInspectionDateTime((prev) => {
                    const next = new Date(prev);
                    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
                    return next;
                  })
                }
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Weight</Text>
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Unit of measure</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {[...uomOptions, LUMPSUM].map((option) => (
                <Chip key={option} label={option} selected={weightUom === option} onPress={() => setWeightUom(option)} />
              ))}
            </View>
          </ScrollView>
          {!isLumpsum ? (
            <Input
              label="Approximate weight"
              keyboardType="decimal-pad"
              placeholder="0"
              value={weight}
              onChangeText={setWeight}
            />
          ) : (
            <Text className="text-xs text-neutral-400 dark:text-neutral-500">
              Lumpsum pricing — weight is not required.
            </Text>
          )}
        </Card>

        <Card>
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Cargo packing type</Text>
          <View className="flex-row gap-2 flex-wrap">
            {CARGO_TYPES.map((option) => (
              <Chip key={option} label={option} selected={cargoType === option} onPress={() => setCargoType(option)} />
            ))}
          </View>
        </Card>

        <Card>
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Transportation arrangement</Text>
          <View className="flex-row gap-2 flex-wrap">
            {TRANSPORT_OPTIONS.map((option) => (
              <Chip key={option} label={option} selected={transport === option} onPress={() => setTransport(option)} />
            ))}
          </View>
        </Card>

        <Card>
          <Input
            label="Approximate value (optional)"
            keyboardType="decimal-pad"
            placeholder="0"
            value={value}
            onChangeText={setValue}
          />
        </Card>

        <PhotoPicker photos={photos} onChange={setPhotos} disabled={saveMutation.isPending} />
        {hasExistingImages ? (
          <Text className="text-xs text-neutral-400 dark:text-neutral-500 -mt-2">
            This report already has {existingReport!.images.length} photo(s). New ones are added alongside them.
          </Text>
        ) : null}

        <Card>
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">Notes</Text>
          <TextInput
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            editable={!saveMutation.isPending}
            placeholder="Any additional notes..."
            placeholderTextColor="#94A3B8"
            className="text-base text-neutral-900 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-700 rounded-md p-3.5 min-h-[96px]"
            textAlignVertical="top"
          />
        </Card>

        {error ? (
          <View className="bg-danger-500/10 rounded-md px-3.5 py-3">
            <Text className="text-danger-600 text-sm">{error}</Text>
          </View>
        ) : null}

        <Button
          label={
            saveMutation.isPending
              ? uploadProgress != null
                ? `Uploading ${uploadProgress}%...`
                : 'Submitting...'
              : 'Submit report'
          }
          onPress={handleSubmit}
          loading={saveMutation.isPending}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </View>
  );
}
