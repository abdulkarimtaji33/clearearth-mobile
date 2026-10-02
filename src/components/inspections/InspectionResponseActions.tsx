import React, { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAcceptInspection, useRejectInspection } from '@/hooks/useInspections';
import { useToast } from '@/components/ui/Toast';

interface InspectionResponseActionsProps {
  requestId: number;
}

/** Shown while response_status === 'pending'. Reject opens an inline reason
 * field (required by the backend) instead of a native-only Alert.prompt, so
 * it behaves the same on iOS and Android. Both accept and reject require a
 * final native confirmation before the mutation actually fires. */
export function InspectionResponseActions({ requestId }: InspectionResponseActionsProps) {
  const toast = useToast();
  const acceptMutation = useAcceptInspection(requestId);
  const rejectMutation = useRejectInspection(requestId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  async function acceptNow() {
    try {
      await acceptMutation.mutateAsync();
      toast.show('Request accepted', 'success');
    } catch {
      toast.show('Could not accept — please try again.', 'error');
    }
  }

  function handleAccept() {
    Alert.alert('Accept this request?', "You'll be responsible for carrying out this inspection.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: acceptNow },
    ]);
  }

  async function rejectNow() {
    try {
      await rejectMutation.mutateAsync(reason.trim());
      toast.show('Request rejected', 'success');
      setRejecting(false);
      setReason('');
    } catch {
      toast.show('Could not reject — please try again.', 'error');
    }
  }

  function handleReject() {
    if (!reason.trim()) return;
    Alert.alert('Reject this request?', 'This cannot be undone. The requester will be notified with your reason.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: rejectNow },
    ]);
  }

  const busy = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <Card>
      <View className="flex-row items-center gap-1.5 mb-3">
        <Ionicons name="help-circle-outline" size={17} color="#0F172A" />
        <Text className="text-base font-bold text-neutral-900 dark:text-neutral-50">Respond to this request</Text>
      </View>

      {rejecting ? (
        <View className="gap-3">
          <TextInput
            autoFocus
            multiline
            placeholder="Reason for rejecting (required)"
            placeholderTextColor="#94A3B8"
            value={reason}
            onChangeText={setReason}
            editable={!busy}
            className="text-base text-neutral-900 dark:text-neutral-50 border border-neutral-200 dark:border-neutral-700 rounded-md p-3.5 min-h-[72px]"
            textAlignVertical="top"
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label="Cancel" variant="secondary" onPress={() => setRejecting(false)} disabled={busy} />
            </View>
            <View className="flex-1">
              <Button
                label="Confirm reject"
                variant="destructive"
                onPress={handleReject}
                loading={rejectMutation.isPending}
                disabled={!reason.trim()}
              />
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Reject"
              variant="destructive"
              onPress={() => setRejecting(true)}
              disabled={busy}
            />
          </View>
          <View className="flex-1">
            <Button label="Accept" onPress={handleAccept} loading={acceptMutation.isPending} disabled={busy} />
          </View>
        </View>
      )}
    </Card>
  );
}
