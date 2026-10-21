import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

const MAX_WIDTH = 1600;

/**
 * Shrinks a camera/gallery image before upload (max 1600px wide, JPEG q0.7). Phones produce 4-8 MB
 * photos; evidence uploads of 10-20 of them are slow and can hit the server's 10 MB limit.
 * Non-images (PDF etc.) and any failure fall back to the original file untouched.
 */
export async function compressImage(file: UploadFile): Promise<UploadFile> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const ref = await ImageManipulator.manipulate(file.uri).resize({ width: MAX_WIDTH }).renderAsync();
    const out = await ref.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    const base = file.name.replace(/\.[^.]+$/, '') || `photo-${Date.now()}`;
    return { uri: out.uri, name: `${base}.jpg`, type: 'image/jpeg' };
  } catch {
    return file;
  }
}

/** Builds a React Native multipart body: one repeated field of files, optional extra text fields. */
export async function buildFileForm(
  field: string,
  files: UploadFile[],
  extra: Record<string, string | undefined> = {}
): Promise<FormData> {
  const form = new FormData();
  const prepared = await Promise.all(files.map(compressImage));
  prepared.forEach((f) => {
    // React Native FormData file shape: { uri, name, type }
    form.append(field, f as unknown as Blob);
  });
  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined) form.append(k, v);
  });
  return form;
}

export const multipartConfig = (onProgress?: (percent: number) => void) => ({
  headers: { 'Content-Type': 'multipart/form-data' },
  // Large photo batches take longer than the default 20s API timeout.
  timeout: 120_000,
  onUploadProgress: (event: { loaded: number; total?: number }) => {
    if (!onProgress || !event.total) return;
    onProgress(Math.round((event.loaded / event.total) * 100));
  },
});
