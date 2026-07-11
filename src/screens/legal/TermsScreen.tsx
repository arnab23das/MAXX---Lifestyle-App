import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme';
import { TERMS_OF_USE } from '@/content/legal';

export function TermsScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 16 }]}>Terms of Use</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}>{TERMS_OF_USE}</Text>
    </ScreenContainer>
  );
}
