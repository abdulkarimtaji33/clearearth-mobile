import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApproveGrn, useGrn, useUpdateGrn, useUploadGrnItemImages } from '@/hooks/ops/useGrn';
import { usePermission } from '@/hooks/usePermission';
import { useRefreshOnFocus } from '@/hooks/ops/useRefreshOnFocus';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { InfoRow } from '@/components/ui/InfoRow';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { AttachBar } from '@/components/ops/AttachBar';
import { GrnItemSheet } from '@/components/ops/GrnItemSheet';
import { GRN_STATUS } from '@/constants/opsStatus';
import { openApiPdf } from '@/lib/files';
import { callPhoneNumber } from '@/lib/linking';
import { resolveUploadUrl } from '@/lib/linking';
import { appendGrnItem, removeGrnItem, replaceGrnItem } from '@/lib/grnSerializer';
import { formatQty, fullName } from '@/lib/opsFormat';
import { formatDateTime } from '@/lib/format';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { GrnItem, GrnItemInput } from '@/api/ops/types';
import type { OpsStackParamList } from '@/navigation/types';

export function GrnDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>();
  const { params } = useRoute<RouteProp<OpsStackParamList, 'GrnDetail'>>();
  const toast = useToast();
  const { can } = usePermission();
  const canEdit = can('grn.update');

  const { data: grn, isLoading, isError, refetch, isRefetching } = useGrn(params.id);
  useRefreshOnFocus(refetch);
  const update = useUpdateGrn(params.id);
  const approve = useApproveGrn(params.id);
  const upload = useUploadGrnItemImages(params.id);

  const [editing, setEditing] = useState<{ item: GrnItem | null } | null>(null);
  const [confirm, setConfirm] = useState<null | 'submit' | 'approve'>(null);
  const [viewer, setViewer] = useState<{ uris: string[]; index: number } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<number | null>(null);

  const items = grn?.items ?? [];
  const locked = !grn || grn.status === 'approved' || !canEdit;

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      haptic.success();
      toast.show(ok, 'success');
      return true;
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
      return false;
    }
  }

  async function saveItem(input: GrnItemInput) {
    const ok = await run(
      () =>
        update.mutateAsync({
          items: editing?.item ? replaceGrnItem(items, editing.item.id, input) : appendGrnItem(items, input),
        }),
      editing?.item ? 'Item updated' : 'Item added'
    );
    if (ok) setEditing(null);
  }

  async function deleteItem() {
    if (!editing?.item) return;
    const id = editing.item.id;
    if (await run(() => update.mutateAsync({ items: removeGrnItem(items, id) }), 'Item removed')) setEditing(null);
  }

  async function addPhotos(itemId: number, files: Parameters<React.ComponentProps<typeof AttachBar>['onPicked']>[0]) {
    setUploadingItem(itemId);
    await run(() => upload.mutateAsync({ itemId, files }), `${files.length} photo${files.length > 1 ? 's' : ''} added`);
    setUploadingItem(null);
  }

  async function handlePdf() {
    if (!grn) return;
    setPdfLoading(true);
    try {
      await openApiPdf(`/grn/${grn.id}/pdf`, `${grn.grn_number}.pdf`);
    } catch (err) {
      toast.show(toUserMessage(err, 'Could not open the PDF.'), 'error');
    } finally {
      setPdfLoading(false);
    }
  }

  const stockPreview = items.filter((i) => i.material_type_id && Number(i.quantity) > 0);
  const notInStock = items.filter((i) => !i.material_type_id);

  const primary =
    !grn || !canEdit
      ? null
      : grn.status === 'new'
        ? { label: 'Submit for approval', icon: 'paper-plane' as const, onPress: () => setConfirm('submit'), disabled: items.length === 0 }
        : grn.status === 'submitted'
          ? { label: 'Approve and add to stock', icon: 'shield-checkmark' as const, onPress: () => setConfirm('approve'), disabled: items.length === 0 }
          : null;

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScreenHeader title={grn?.grn_number ?? 'GRN'} subtitle={grn?.deal?.title ?? undefined} back />
      {isLoading ? (
        <View className="p-5" style={{ gap: 12 }}>
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </View>
      ) : isError || !grn ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color="#94A3B8" />}
          title="Couldn't load this GRN"
          action={<Button label="Retry" onPress={() => refetch()} />}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + (primary ? 120 : 32) }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10B981" />}
          >
            <Card className="mb-5">
              <View className="flex-row items-center justify-between mb-1">
                <StatusPill meta={GRN_STATUS[grn.status]} size="md" />
                <Pressable onPress={handlePdf} disabled={pdfLoading} className="flex-row items-center" style={{ gap: 5 }} accessibilityRole="button">
                  <Ionicons name="document-text-outline" size={18} color="#059669" />
                  <Text className="text-sm font-bold text-primary-700 dark:text-primary-300">{pdfLoading ? 'Opening...' : 'PDF'}</Text>
                </Pressable>
              </View>
              <InfoRow icon="business-outline" label="Client" value={grn.deal?.company?.company_name} />
              <InfoRow
                icon="person-outline"
                label="Contact"
                value={grn.deal?.contact ? `${fullName(grn.deal.contact)}${grn.deal.contact.phone ? ` · ${grn.deal.contact.phone}` : ''}` : null}
                onPress={grn.deal?.contact?.phone ? () => callPhoneNumber(grn.deal!.contact!.phone!) : undefined}
                actionIcon="call-outline"
              />
              <InfoRow
                icon="construct-outline"
                label="Work order"
                value={grn.workOrder?.title ?? (grn.work_order_id ? `WO #${grn.work_order_id}` : null)}
                onPress={grn.work_order_id ? () => navigation.navigate('WorkOrderDetail', { id: grn.work_order_id! }) : undefined}
              />
              <InfoRow icon="time-outline" label="Created" value={formatDateTime(grn.created_at)} />
              {grn.status === 'approved' ? (
                <InfoRow icon="shield-checkmark-outline" label="Approved by" value={`${fullName(grn.approvedByUser)} · ${formatDateTime(grn.approved_at) ?? ''}`} />
              ) : null}
              {grn.notes ? (
                <View className="mt-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                  <Text className="text-xs text-neutral-500 mb-0.5">Notes</Text>
                  <Text className="text-sm text-neutral-800 dark:text-neutral-100 leading-5">{grn.notes}</Text>
                </View>
              ) : null}
            </Card>

            <SectionHeader
              title="Items"
              count={items.length}
              padded={false}
              actionLabel={!locked ? 'Add item' : undefined}
              onAction={() => setEditing({ item: null })}
            />
            {items.length === 0 ? (
              <EmptyState
                icon={<Ionicons name="layers-outline" size={36} color="#94A3B8" />}
                title="No items yet"
                description={locked ? undefined : 'Add what was received so it can be approved into stock.'}
                action={!locked ? <Button label="Add item" onPress={() => setEditing({ item: null })} /> : undefined}
              />
            ) : (
              items.map((item) => {
                const uris = (item.images ?? []).map((i) => resolveUploadUrl(i.image_url));
                return (
                  <Card key={item.id} className="mb-3">
                    <Pressable onPress={!locked ? () => setEditing({ item }) : undefined} accessibilityRole={locked ? undefined : 'button'}>
                      <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
                        <View className="flex-1">
                          <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">{item.item_name}</Text>
                          <Text className="text-xs text-neutral-500 mt-0.5">
                            {item.materialType?.display_name ?? 'No material type'}
                            {item.units ? ` · ${item.units} pcs` : ''}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-lg font-extrabold text-primary-700 dark:text-primary-300">{formatQty(item.quantity, item.unit_of_measure)}</Text>
                          {!locked ? <Ionicons name="create-outline" size={16} color="#94A3B8" style={{ marginTop: 4 }} /> : null}
                        </View>
                      </View>
                      {item.make || item.model || item.serial_number ? (
                        <Text className="text-xs text-neutral-500 mt-2">
                          {[item.make, item.model, item.serial_number ? `S/N ${item.serial_number}` : null].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                      {item.notes ? <Text className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5">{item.notes}</Text> : null}
                    </Pressable>

                    {uris.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8 }}>
                        {uris.map((uri, i) => (
                          <Pressable key={uri + i} onPress={() => setViewer({ uris, index: i })} accessibilityRole="button" accessibilityLabel="View photo">
                            <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 10 }} contentFit="cover" />
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}
                    {!locked ? (
                      <View className="mt-3">
                        {uploadingItem === item.id ? (
                          <Text className="text-xs text-neutral-500 mb-2">Uploading photos...</Text>
                        ) : null}
                        <AttachBar onPicked={(f) => addPhotos(item.id, f)} disabled={uploadingItem === item.id} allowDocuments={false} limit={10} />
                      </View>
                    ) : null}
                  </Card>
                );
              })
            )}
          </ScrollView>

          {primary ? (
            <View
              className="absolute left-0 right-0 bottom-0 px-5 pt-3 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-100 dark:border-neutral-800"
              style={{ paddingBottom: Math.max(insets.bottom, 14) }}
            >
              <Button
                label={primary.label}
                size="lg"
                fullWidth
                disabled={primary.disabled}
                icon={<Ionicons name={primary.icon} size={19} color="#fff" />}
                onPress={primary.onPress}
              />
              {primary.disabled ? <Text className="text-xs text-neutral-500 text-center mt-2">Add at least one item first.</Text> : null}
            </View>
          ) : null}
        </>
      )}

      <GrnItemSheet
        visible={editing !== null}
        item={editing?.item ?? null}
        saving={update.isPending}
        onClose={() => setEditing(null)}
        onSave={saveItem}
        onDelete={editing?.item ? deleteItem : undefined}
      />

      <ConfirmSheet
        visible={confirm === 'submit'}
        title="Submit this GRN?"
        message="The sales owner is notified. You can still edit it until it is approved."
        confirmLabel="Submit"
        loading={update.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (await run(() => update.mutateAsync({ status: 'submitted' }), 'GRN submitted. Sales has been notified.')) setConfirm(null);
        }}
      />

      <ConfirmSheet
        visible={confirm === 'approve'}
        title="Approve this GRN?"
        message="Approving locks the GRN and adds these materials to stock. It can't be undone."
        confirmLabel="Approve and add to stock"
        loading={approve.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (await run(() => approve.mutateAsync(), 'GRN approved. Stock updated.')) setConfirm(null);
        }}
      >
        <View className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3.5" style={{ gap: 6 }}>
          {stockPreview.map((i) => (
            <View key={i.id} className="flex-row justify-between">
              <Text className="text-sm text-neutral-700 dark:text-neutral-200">{i.materialType?.display_name ?? i.item_name}</Text>
              <Text className="text-sm font-bold text-primary-700 dark:text-primary-300">+ {formatQty(i.quantity, i.unit_of_measure)}</Text>
            </View>
          ))}
          {notInStock.length > 0 ? (
            <Text className="text-xs text-today mt-1">
              {notInStock.length} item{notInStock.length > 1 ? 's have' : ' has'} no material type and won't be added to stock.
            </Text>
          ) : null}
        </View>
      </ConfirmSheet>

      <ImageViewing
        images={(viewer?.uris ?? []).map((uri) => ({ uri }))}
        imageIndex={viewer?.index ?? 0}
        visible={viewer !== null}
        onRequestClose={() => setViewer(null)}
      />
    </View>
  );
}
