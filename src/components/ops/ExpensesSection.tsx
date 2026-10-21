import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { AttachBar } from '@/components/ops/AttachBar';
import { useSetTaskExpenses } from '@/hooks/ops/useWorkOrders';
import { uploadExpenseEvidence, type ExpenseInput } from '@/api/ops/workOrders.api';
import { resolveUploadUrl } from '@/lib/linking';
import { toUserMessage } from '@/lib/errors';
import { haptic } from '@/lib/haptics';
import type { TaskExpense } from '@/api/ops/types';
import type { StatusMeta } from '@/constants/opsStatus';

interface ExpensesSectionProps {
  workOrderId: number;
  taskId: number;
  expenses: TaskExpense[];
}

const ACCOUNTS_STATUS: Record<string, StatusMeta> = {
  pending: { label: 'Pending', tone: 'today', icon: 'time-outline' },
  approved: { label: 'Approved', tone: 'completed', icon: 'checkmark-circle-outline' },
  rejected: { label: 'Rejected', tone: 'overdue', icon: 'close-circle-outline' },
};

const toInput = (e: TaskExpense): ExpenseInput => ({
  description: e.description,
  amount: e.amount,
  evidencePath: e.evidence_path,
  evidenceFileName: e.evidence_file_name,
});

const money = (v: number | string) =>
  `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A line is locked once accounts has posted it to the ledger. */
const isLocked = (e: TaskExpense) => !!e.ledgerExpense || e.accounts_status === 'approved';

/** Per-task expense lines: add with receipt photo, edit/remove while accounts hasn't posted them. */
export function ExpensesSection({ workOrderId, taskId, expenses }: ExpensesSectionProps) {
  const toast = useToast();
  const save = useSetTaskExpenses(workOrderId);
  const [editing, setEditing] = useState<{ index: number | null } | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [evidence, setEvidence] = useState<{ path: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  function openEditor(index: number | null) {
    const line = index === null ? null : expenses[index];
    setDescription(line?.description ?? '');
    setAmount(line ? String(Number(line.amount)) : '');
    setEvidence(line?.evidence_path ? { path: line.evidence_path, name: line.evidence_file_name ?? 'Receipt' } : null);
    setError(null);
    setEditing({ index });
  }

  async function persist(next: ExpenseInput[], successMessage: string) {
    try {
      await save.mutateAsync({ taskId, expenses: next });
      haptic.success();
      toast.show(successMessage, 'success');
      return true;
    } catch (err) {
      haptic.error();
      toast.show(toUserMessage(err), 'error');
      return false;
    }
  }

  async function handleSaveLine() {
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    const line: ExpenseInput = {
      description: description.trim() || null,
      amount: value,
      evidencePath: evidence?.path ?? null,
      evidenceFileName: evidence?.name ?? null,
    };
    const next = expenses.map(toInput);
    if (editing?.index === null || editing === null) next.push(line);
    else next[editing.index] = line;
    if (await persist(next, editing?.index === null ? 'Expense added' : 'Expense updated')) setEditing(null);
  }

  function handleRemove(index: number) {
    Alert.alert('Remove this expense?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => persist(expenses.filter((_, i) => i !== index).map(toInput), 'Expense removed'),
      },
    ]);
  }

  async function handleReceipt(files: Parameters<React.ComponentProps<typeof AttachBar>['onPicked']>[0]) {
    setUploading(true);
    try {
      const res = await uploadExpenseEvidence(files[0]!);
      setEvidence({ path: res.path, name: res.fileName ?? files[0]!.name });
    } catch (err) {
      toast.show(toUserMessage(err, 'Receipt upload failed.'), 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2.5">
        <View>
          <Text className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">Expenses</Text>
          {expenses.length > 0 ? (
            <Text className="text-xs text-neutral-500 mt-0.5">Total {money(total)}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => openEditor(null)}
          accessibilityRole="button"
          className="flex-row items-center px-3 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30"
          style={{ gap: 4 }}
        >
          <Ionicons name="add" size={17} color="#059669" />
          <Text className="text-sm font-bold text-primary-700 dark:text-primary-300">Add</Text>
        </Pressable>
      </View>

      {expenses.length === 0 ? (
        <View className="items-center py-5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <Ionicons name="receipt-outline" size={26} color="#94A3B8" />
          <Text className="text-sm text-neutral-500 mt-1">No expenses logged for this task.</Text>
        </View>
      ) : (
        expenses.map((e, i) => {
          const locked = isLocked(e);
          const status = e.accounts_status ? ACCOUNTS_STATUS[e.accounts_status] : undefined;
          return (
            <Pressable
              key={e.id}
              onPress={() => (locked ? toast.show('Accounts has already processed this expense.', 'info') : openEditor(i))}
              className="flex-row items-center py-3 border-b border-neutral-100 dark:border-neutral-800"
              style={{ gap: 12 }}
            >
              {e.evidence_path ? (
                <Image source={{ uri: resolveUploadUrl(e.evidence_path) }} style={{ width: 44, height: 44, borderRadius: 10 }} contentFit="cover" />
              ) : (
                <View className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 items-center justify-center">
                  <Ionicons name="receipt-outline" size={20} color="#94A3B8" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-neutral-900 dark:text-neutral-50">{money(e.amount)}</Text>
                <Text className="text-xs text-neutral-500 mt-0.5" numberOfLines={1}>
                  {e.description || 'No description'}
                </Text>
              </View>
              <View className="items-end" style={{ gap: 4 }}>
                {status ? <StatusPill meta={status} /> : null}
                {locked ? (
                  <Ionicons name="lock-closed" size={13} color="#94A3B8" />
                ) : (
                  <Pressable onPress={() => handleRemove(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove expense">
                    <Ionicons name="trash-outline" size={17} color="#C23B3B" />
                  </Pressable>
                )}
              </View>
            </Pressable>
          );
        })
      )}

      <BottomSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.index === null ? 'Add expense' : 'Edit expense'}
        footer={<Button label="Save expense" loading={save.isPending} onPress={handleSaveLine} fullWidth size="lg" />}
      >
        <View style={{ gap: 14 }}>
          <Input
            label="Amount (AED)"
            value={amount}
            onChangeText={(t) => {
              setAmount(t.replace(/[^0-9.]/g, ''));
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0.00"
            error={error ?? undefined}
          />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="e.g. Fuel, tolls, labour" />
          <View>
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Receipt (optional)</Text>
            {evidence ? (
              <View className="flex-row items-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 mb-2" style={{ gap: 10 }}>
                <Image source={{ uri: resolveUploadUrl(evidence.path) }} style={{ width: 44, height: 44, borderRadius: 8 }} contentFit="cover" />
                <Text className="flex-1 text-sm text-neutral-700 dark:text-neutral-200" numberOfLines={1}>
                  {evidence.name}
                </Text>
                <Pressable onPress={() => setEvidence(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove receipt">
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </Pressable>
              </View>
            ) : null}
            <AttachBar onPicked={handleReceipt} disabled={uploading} allowDocuments={false} limit={1} />
            {uploading ? <Text className="text-xs text-neutral-500 mt-2">Uploading receipt...</Text> : null}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
