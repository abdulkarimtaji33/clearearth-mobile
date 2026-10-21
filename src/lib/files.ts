import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getApiBaseUrl } from '@/lib/env';
import { tokenStorage } from '@/lib/secureStore';

/**
 * Downloads an authenticated API file (PDF) into the cache and returns its local uri.
 * `path` is relative to the API base, e.g. `/grn/12/pdf`.
 */
export async function downloadApiFile(path: string, fileName: string): Promise<string> {
  const token = await tokenStorage.getAccessToken();
  const safeName = fileName.replace(/[^\w.-]+/g, '_');
  const dest = new File(new Directory(Paths.cache), safeName);
  const file = await File.downloadFileAsync(`${getApiBaseUrl()}${path}`, dest, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    idempotent: true,
  });
  return file.uri;
}

/** Downloads a PDF from the API and opens the system share/open sheet for it. */
export async function openApiPdf(path: string, fileName: string): Promise<void> {
  const uri = await downloadApiFile(path, fileName);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: fileName, UTI: 'com.adobe.pdf' });
}
