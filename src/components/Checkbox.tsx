import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  label?: React.ReactNode;
}

export function Checkbox({ checked, onToggle, label }: Props) {
  const theme = useTheme();
  return (
    <Pressable onPress={onToggle} style={styles.row} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.colors.primary : theme.colors.border,
            backgroundColor: checked ? theme.colors.primary : 'transparent',
          },
        ]}
      >
        {checked && <Text style={[styles.check, { color: theme.colors.onPrimary }]}>✓</Text>}
      </View>
      {label ? <View style={styles.label}>{label}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  check: { fontSize: 14, fontWeight: '800' },
  label: { flex: 1 },
});
