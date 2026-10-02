/** `supporting_documents` is a JSON array of relative upload paths, or (legacy)
 * a single path string. `safety_tools` is a JSON array of strings. Both can be
 * null/empty. Mirrors clearearth-frontend's utils/inspectionRequestHelpers.js. */
export function parseSupportingDocuments(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
}

export function parseSafetyTools(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|heic)$/i.test(path);
}

export function formatRequestNumber(id: number): string {
  return `REQ-${String(id).padStart(4, '0')}`;
}
