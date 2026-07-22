import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import { Card } from '@/components/ui/Card';
import { resolveUploadUrl } from '@/lib/linking';
import type { PickupTaskFile } from '@/api/types';

interface ExistingPhotoGalleryProps {
  files: PickupTaskFile[];
}

export function ExistingPhotoGallery({ files }: ExistingPhotoGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (files.length === 0) return null;

  const images = files.map((f) => ({ uri: resolveUploadUrl(f.imageUrl) }));

  return (
    <Card>
      <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-3">
        Uploaded photos ({files.length})
      </Text>
      <View className="flex-row flex-wrap gap-2.5">
        {files.map((file, index) => (
          <Pressable key={file.id} onPress={() => setViewerIndex(index)}>
            <Image source={{ uri: resolveUploadUrl(file.imageUrl) }} className="w-20 h-20 rounded-md" />
          </Pressable>
        ))}
      </View>

      <ImageViewing
        images={images}
        imageIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onRequestClose={() => setViewerIndex(null)}
      />
    </Card>
  );
}
