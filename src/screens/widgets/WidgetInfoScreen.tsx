import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme';

export function WidgetInfoScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 12 }]}>Home & lock screen widgets</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 16 }]}>
        MAXX includes an iOS widget showing your streak, level, and credits — add it from the home screen (long-press →
        Edit Home Screen → +) or the lock screen (long-press the lock screen → Customize).
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}>
        Widgets update automatically whenever you complete a level. If the widget isn’t available yet, it needs to be
        built with Xcode as part of an EAS or local iOS build — it isn’t available in Expo Go.
      </Text>
    </ScreenContainer>
  );
}
