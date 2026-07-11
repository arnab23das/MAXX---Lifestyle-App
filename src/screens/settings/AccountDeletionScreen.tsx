import React, { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme';
import { deleteMyAccount } from '@/api/account';

const CONFIRM_PHRASE = 'DELETE';

export function AccountDeletionScreen() {
  const theme = useTheme();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteMyAccount();
    } catch (err: any) {
      Alert.alert('Couldn’t delete account', err.message ?? 'Please try again or contact support.');
      setLoading(false);
    }
    // On success, the auth session clears and RootNavigator returns to onboarding automatically.
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.h1, { color: theme.colors.danger, marginBottom: 12 }]}>Delete your account</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 8, lineHeight: 22 }]}>
        This permanently deletes your profile, progress, XP, credits, streaks, journal entries, and community posts. This
        can’t be undone.
      </Text>
      <View style={{ marginTop: 20 }}>
        <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Type {CONFIRM_PHRASE} to confirm
        </Text>
        <TextInput
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          style={{
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            borderRadius: 14,
            padding: 14,
            fontSize: 16,
            color: theme.colors.textPrimary,
          }}
        />
      </View>
      <View style={{ marginTop: 24 }}>
        <Button label="Permanently delete my account" onPress={handleDelete} variant="danger" disabled={confirmText !== CONFIRM_PHRASE} loading={loading} />
      </View>
    </ScreenContainer>
  );
}
