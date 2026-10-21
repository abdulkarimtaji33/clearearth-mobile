import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMaterialTypes } from '@/hooks/ops/useLookups';
import { useUomOptions } from '@/hooks/useDropdown';
import type { GrnItem, GrnItemInput } from '@/api/ops/types';

interface GrnItemSheetProps {
  visible: boolean;
  item: GrnItem | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: GrnItemInput) => void;
  onDelete?: () => void;
}

const Chip = ({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected: on }}
    className={`px-3.5 py-2 rounded-full border ${
      on ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
    }`}
  >
    <Text className={`text-sm font-semibold ${on ? 'text-white' : 'text-neutral-700 dark:text-neutral-200'}`}>{label}</Text>
  </Pressable>
);

/** Add/edit one GRN line: material, quantity + unit, optional make/model/serial/units/notes. */
export function GrnItemSheet({ visible, item, saving = false, onClose, onSave, onDelete }: GrnItemSheetProps) {
  const { data: materials } = useMaterialTypes();
  const { options: uoms } = useUomOptions();
  const [name, setName] = useState('');
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [qty, setQty] = useState('');
  const [uom, setUom] = useState('kg');
  const [units, setUnits] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; qty?: string }>({});

  useEffect(() => {
    if (!visible) return;
    setName(item?.item_name ?? '');
    setMaterialId(item?.material_type_id ?? null);
    setQty(item ? String(Number(item.quantity)) : '');
    setUom(item?.unit_of_measure ?? 'kg');
    setUnits(item?.units != null ? String(item.units) : '');
    setMake(item?.make ?? '');
    setModel(item?.model ?? '');
    setSerial(item?.serial_number ?? '');
    setNotes(item?.notes ?? '');
    setErrors({});
    // Seed when the sheet opens for a given item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, item?.id]);

  function submit() {
    const q = Number(qty);
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Enter an item name.';
    if (!qty.trim() || !Number.isFinite(q) || q <= 0) next.qty = 'Enter a quantity greater than 0.';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave({
      itemName: name.trim(),
      materialTypeId: materialId,
      quantity: q,
      unitOfMeasure: uom,
      units: units.trim() ? units.trim() : null,
      make: make.trim() || null,
      model: model.trim() || null,
      serialNumber: serial.trim() || null,
      notes: notes.trim() || null,
    });
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={item ? 'Edit item' : 'Add item'}
      tall
      footer={
        <View style={{ gap: 8 }}>
          <Button label="Save item" loading={saving} onPress={submit} fullWidth size="lg" />
          {item && onDelete ? <Button label="Remove item" variant="ghost" onPress={onDelete} disabled={saving} fullWidth /> : null}
        </View>
      }
    >
      <View style={{ gap: 14 }}>
        <Input label="Item name" value={name} onChangeText={setName} placeholder="e.g. Hard drives" error={errors.name} />

        <View>
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Material type</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {(materials ?? []).map((m) => (
              <Chip key={m.id} label={m.display_name} on={materialId === m.id} onPress={() => setMaterialId(materialId === m.id ? null : m.id)} />
            ))}
          </View>
          <Text className="text-xs text-neutral-500 mt-2">Only items with a material type are added to stock on approval.</Text>
        </View>

        <View className="flex-row" style={{ gap: 10 }}>
          <View className="flex-1">
            <Input
              label="Quantity"
              value={qty}
              onChangeText={(t) => setQty(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              error={errors.qty}
            />
          </View>
          <View className="flex-1">
            <Input label="Pieces (optional)" value={units} onChangeText={(t) => setUnits(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="0" />
          </View>
        </View>

        <View>
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Unit</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {uoms.map((u) => (
              <Chip key={u} label={u} on={uom === u} onPress={() => setUom(u)} />
            ))}
          </View>
        </View>

        <View className="flex-row" style={{ gap: 10 }}>
          <View className="flex-1">
            <Input label="Make" value={make} onChangeText={setMake} />
          </View>
          <View className="flex-1">
            <Input label="Model" value={model} onChangeText={setModel} />
          </View>
        </View>
        <Input label="Serial number" value={serial} onChangeText={setSerial} autoCapitalize="characters" />
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" className="min-h-[72px]" />
      </View>
    </BottomSheet>
  );
}
