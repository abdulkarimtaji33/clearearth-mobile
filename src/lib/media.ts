import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { UploadFile } from '@/lib/upload';

function fromImageAsset(asset: ImagePicker.ImagePickerAsset, index: number): UploadFile {
  const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo-${Date.now()}-${index}.${ext}`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

export async function takePhoto(): Promise<UploadFile[]> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera permission needed', 'Enable camera access in Settings to take photos.');
    return [];
  }
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  return result.canceled ? [] : result.assets.map(fromImageAsset);
}

export async function pickPhotos(limit = 10): Promise<UploadFile[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photo library permission needed', 'Enable photo access in Settings to attach photos.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.8,
  });
  return result.canceled ? [] : result.assets.slice(0, limit).map(fromImageAsset);
}

/** Documents (PDF, Office, images) from the system file picker. */
export async function pickDocuments(): Promise<UploadFile[]> {
  const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
  if (result.canceled) return [];
  return result.assets.map((a) => ({
    uri: a.uri,
    name: a.name,
    type: a.mimeType ?? 'application/octet-stream',
  }));
}

export const isImageName = (name?: string | null) => /\.(jpe?g|png|gif|webp|heic)$/i.test(name ?? '');
