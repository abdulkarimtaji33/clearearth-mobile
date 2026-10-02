import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { resolveUploadUrl } from '@/lib/linking';
import { isImagePath } from '@/lib/inspectionHelpers';

interface InspectionImageGalleryProps {
  title: string;
  paths: string[];
  emptyHint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const PEEK_COUNT = 8;

/** Same peek-grid-plus-viewer pattern as PhotoGallery, but for plain upload-path
 * strings (inspection supporting documents / report images) rather than
 * {id, imageUrl} task-file objects. */
export function InspectionImageGallery({ title, paths, emptyHint, icon = 'document-outline' }: InspectionImageGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const imagePaths = paths.filter(isImagePath);

  if (paths.length === 0) {
    if (!emptyHint) return null;
    return (
      <Card>
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50 mb-1">{title}</Text>
        <Text className="text-sm text-neutral-400 dark:text-neutral-500">{emptyHint}</Text>
      </Card>
    );
  }

  const viewerImages = imagePaths.map((p) => ({ uri: resolveUploadUrl(p) }));
  const visible = imagePaths.slice(0, PEEK_COUNT);
  const overflow = imagePaths.length - visible.length;

  return (
    <Card>
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name={icon} size={18} color="#059669" />
          <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">{title}</Text>
        </View>
        <View className="bg-primary-50 dark:bg-primary-900/40 rounded-full px-2.5 py-0.5">
          <Text className="text-xs font-bold text-primary-700 dark:text-primary-300">{paths.length}</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {visible.map((path, index) => {
          const isLastPeek = overflow > 0 && index === visible.length - 1;
          return (
            <Pressable
              key={path}
              onPress={() => setViewerIndex(index)}
              className="rounded-lg overflow-hidden"
              style={{ width: '31.5%', aspectRatio: 1 }}
            >
              <Image
                source={{ uri: resolveUploadUrl(path) }}
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
        images={viewerImages}
        imageIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onRequestClose={() => setViewerIndex(null)}
      />
    </Card>
  );
}
