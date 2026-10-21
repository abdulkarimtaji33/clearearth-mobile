import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { Ionicons } from '@expo/vector-icons';
import { AttachBar } from '@/components/ops/AttachBar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { useDeleteTaskFile, useUploadTaskFiles } from '@/hooks/ops/useWorkOrders';
import { resolveUploadUrl } from '@/lib/linking';
import { isImageName } from '@/lib/media';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { TaskFile } from '@/api/ops/types';

interface EvidenceSectionProps {
  workOrderId: number;
  taskId: number;
  files: TaskFile[];
}

/** Task evidence: thumbnail grid, add via camera/gallery/file with progress, long-press to delete. */
export function EvidenceSection({ workOrderId, taskId, files }: EvidenceSectionProps) {
  const toast = useToast();
  const upload = useUploadTaskFiles(workOrderId);
  const remove = useDeleteTaskFile(workOrderId);
  const [progress, setProgress] = useState<number | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const images = files.filter((f) => isImageName(f.original_name) || isImageName(f.image_url));
  const imageSources = images.map((f) => ({ uri: resolveUploadUrl(f.image_url) }));

  async function handlePicked(picked: Parameters<React.ComponentProps<typeof AttachBar>['onPicked']>[0]) {
    setProgress(0);
    try {
      await upload.mutateAsync({ taskId, files: picked, onProgress: setProgress });
      haptic.success();
      toast.show(`${picked.length} file${picked.length > 1 ? 's' : ''} uploaded`, 'success');
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err, 'Upload failed. Please try again.'), 'error');
    } finally {
      setProgress(null);
    }
  }

  function confirmDelete(file: TaskFile) {
    const doDelete = async () => {
      try {
        await remove.mutateAsync({ taskId, fileId: file.id });
        haptic.success();
        toast.show('Evidence removed', 'success');
      } catch (err) {
        toast.show(toUserMessage(err), 'error');
      }
    };
    Alert.alert('Remove this file?', file.original_name ?? 'Evidence file', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: doDelete },
    ]);
  }

  function open(file: TaskFile) {
    const idx = images.findIndex((i) => i.id === file.id);
    if (idx >= 0) setViewerIndex(idx);
    else Linking.openURL(resolveUploadUrl(file.image_url)).catch(() => toast.show('Could not open this file', 'error'));
  }

  function longPress(file: TaskFile) {
    haptic.warning();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Remove'], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
        (i) => i === 1 && confirmDelete(file)
      );
    } else {
      confirmDelete(file);
    }
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">Evidence</Text>
        <Text className="text-xs font-semibold text-neutral-500">{files.length} file{files.length === 1 ? '' : 's'}</Text>
      </View>

      {files.length > 0 ? (
        <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
          {files.map((f) => {
            const isImg = isImageName(f.original_name) || isImageName(f.image_url);
            return (
              <Pressable
                key={f.id}
                onPress={() => open(f)}
                onLongPress={() => longPress(f)}
                accessibilityRole="button"
                accessibilityLabel={`Evidence ${f.original_name ?? f.id}. Long press to remove`}
                className="rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
                style={{ width: 84, height: 84 }}
              >
                {isImg ? (
                  <Image source={{ uri: resolveUploadUrl(f.image_url) }} style={{ width: 84, height: 84 }} contentFit="cover" />
                ) : (
                  <View className="items-center px-1.5">
                    <Ionicons name="document-text" size={26} color="#64748B" />
                    <Text className="text-[10px] text-neutral-500 mt-1" numberOfLines={2}>
                      {f.original_name ?? 'File'}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="items-center py-5 mb-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <Ionicons name="camera-outline" size={26} color="#94A3B8" />
          <Text className="text-sm text-neutral-500 mt-1">No evidence yet. Add photos or documents.</Text>
        </View>
      )}

      {progress !== null ? (
        <View className="mb-3">
          <Text className="text-xs font-semibold text-neutral-500 mb-1.5">Uploading... {progress}%</Text>
          <ProgressBar value={progress / 100} />
        </View>
      ) : null}

      <AttachBar onPicked={handlePicked} disabled={upload.isPending} limit={10} />

      <ImageViewing
        images={imageSources}
        imageIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onRequestClose={() => setViewerIndex(null)}
      />
    </View>
  );
}
