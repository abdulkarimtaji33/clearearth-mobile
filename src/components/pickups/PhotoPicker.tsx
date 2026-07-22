import React from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface PickedPhoto {
  uri: string;
  name: string;
  type: string;
}

interface PhotoPickerProps {
  photos: PickedPhoto[];
  onChange: (photos: PickedPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

function assetToPhoto(asset: ImagePicker.ImagePickerAsset, index: number): PickedPhoto {
  const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `pickup-${Date.now()}-${index}.${ext}`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

export function PhotoPicker({ photos, onChange, maxPhotos = 20, disabled }: PhotoPickerProps) {
  const remaining = maxPhotos - photos.length;

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access in Settings to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets.length) {
      onChange([...photos, ...result.assets.map((a, i) => assetToPhoto(a, i))]);
    }
  }

  async function handlePickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo library permission needed', 'Enable photo access in Settings to attach photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(remaining, 1),
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length) {
      onChange([...photos, ...result.assets.slice(0, remaining).map((a, i) => assetToPhoto(a, i))]);
    }
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">Photos</Text>
        <Text className="text-xs text-neutral-400 dark:text-neutral-500">
          {photos.length}/{maxPhotos}
        </Text>
      </View>

      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2.5">
            {photos.map((photo, index) => (
              <View key={`${photo.uri}-${index}`} className="relative">
                <Image source={{ uri: photo.uri }} className="w-20 h-20 rounded-md" />
                {!disabled ? (
                  <Pressable
                    onPress={() => removeAt(index)}
                    className="absolute -top-1.5 -right-1.5 bg-danger-500 rounded-full w-5 h-5 items-center justify-center"
                    hitSlop={8}
                  >
                    <Text className="text-white text-xs font-bold">×</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      {!disabled && remaining > 0 ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button label="Take photo" variant="secondary" onPress={handleTakePhoto} />
          </View>
          <View className="flex-1">
            <Button label="Choose photos" variant="secondary" onPress={handlePickFromLibrary} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}
