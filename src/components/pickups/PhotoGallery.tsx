import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { resolveUploadUrl } from '@/lib/linking';
import type { PickupTaskFile } from '@/api/types';

interface PhotoGalleryProps {
  title: string;
  files: PickupTaskFile[];
  emptyHint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const PEEK_COUNT = 8; // show up to 8 tiles + a "+N more" tile before opening the full viewer

export function PhotoGallery({ title, files, emptyHint, icon = 'camera-outline' }: PhotoGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (files.length === 0) {
    if (!emptyHint) return null;
    return (
      <Card>
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-1">{title}</Text>
        <Text className="text-sm text-neutral-400 dark:text-neutral-500">{emptyHint}</Text>
      </Card>
    );
  }

  const images = files.map((f) => ({ uri: resolveUploadUrl(f.imageUrl) }));
  const visible = files.slice(0, PEEK_COUNT);
  const overflow = files.length - visible.length;

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name={icon} size={18} color="#059669" />
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">{title}</Text>
        </View>
        <View className="bg-primary-50 dark:bg-primary-900/40 rounded-full px-2.5 py-0.5">
          <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">{files.length}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {visible.map((file, index) => {
          const isLastPeek = overflow > 0 && index === visible.length - 1;
          return (
            <Pressable
              key={file.id}
              onPress={() => setViewerIndex(index)}
              className="rounded-lg overflow-hidden"
              style={{ width: '31.5%', aspectRatio: 1 }}
            >
              <Image
                source={{ uri: resolveUploadUrl(file.imageUrl) }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={150}
              />
              {isLastPeek ? (
                <View className="absolute inset-0 bg-black/55 items-center justify-center">
                  <Text className="text-white text-lg font-extrabold">+{overflow}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
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
