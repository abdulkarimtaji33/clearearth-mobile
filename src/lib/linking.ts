import { Linking } from 'react-native';
import { getApiOrigin } from './env';

/**
 * pickup_location is a free-text/URL field on the backend — there is no lat/lng
 * anywhere in this API. If it already looks like a URL, open it directly;
 * otherwise treat it as an address/description and open a maps search for it.
 */
export async function openPickupLocation(pickupLocation: string): Promise<void> {
  const trimmed = pickupLocation.trim();
  const isUrl = /^https?:\/\//i.test(trimmed);
  const url = isUrl
    ? trimmed
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
  await Linking.openURL(url);
}

export async function callPhoneNumber(phoneNumber: string): Promise<void> {
  const cleaned = phoneNumber.trim();
  await Linking.openURL(`tel:${cleaned}`);
}

export function resolveUploadUrl(imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${getApiOrigin()}${path}`;
}
