import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  onPress: () => void;
  size?: 'small' | 'large';
}

/** Always-reachable emergency entry point (spec §3.5, §7). */
export function SosButton({ onPress, size = 'large' }: Props) {
  const theme = useTheme();
  const dimension = size === 'large' ? 64 : 44;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="SOS — get emergency support"
      style={({ pressed }) => [
        styles.button,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: theme.colors.sos,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { fontSize: size === 'large' ? 15 : 12 }]}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  label: { color: 'white', fontWeight: '800', letterSpacing: 0.5 },
});
