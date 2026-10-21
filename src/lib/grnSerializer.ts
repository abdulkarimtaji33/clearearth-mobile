import type { GrnItem, GrnItemInput } from '../api/ops/types';

/**
 * PATCH /grn/:id replaces all items (delete + recreate). Existing items must be sent back whole,
 * including their photos, or editing one item would wipe every other item's images.
 */
export function grnItemToInput(item: GrnItem): GrnItemInput {
  return {
    itemName: item.item_name,
    materialTypeId: item.material_type_id,
    quantity: item.quantity,
    unitOfMeasure: item.unit_of_measure,
    make: item.make,
    model: item.model,
    serialNumber: item.serial_number,
    units: item.units,
    notes: item.notes,
    images: (item.images ?? []).map((i) => ({ imageUrl: i.image_url, originalName: i.original_name })),
  };
}

export function replaceGrnItem(items: GrnItem[], itemId: number, next: GrnItemInput): GrnItemInput[] {
  return items.map((it) =>
    it.id === itemId ? { ...next, images: next.images ?? grnItemToInput(it).images } : grnItemToInput(it)
  );
}

export const appendGrnItem = (items: GrnItem[], next: GrnItemInput): GrnItemInput[] => [...items.map(grnItemToInput), next];

export const removeGrnItem = (items: GrnItem[], itemId: number): GrnItemInput[] =>
  items.filter((i) => i.id !== itemId).map(grnItemToInput);
