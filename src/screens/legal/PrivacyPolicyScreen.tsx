import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme';
import { PRIVACY_POLICY } from '@/content/legal';

export function PrivacyPolicyScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 16 }]}>Privacy Policy</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}>{PRIVACY_POLICY}</Text>
    </ScreenContainer>
  );
}
