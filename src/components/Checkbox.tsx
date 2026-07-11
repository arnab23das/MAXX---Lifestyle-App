import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  label?: React.ReactNode;
}

export function Checkbox({ checked, onToggle, label }: Props) {
  const theme = useTheme();
  const pop = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: checked ? 1 : 0, useNativeDriver: true, speed: 40, bounciness: checked ? 12 : 0 }).start();
  }, [checked, pop]);

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
        <Animated.Text style={[styles.check, { color: theme.colors.onPrimary, transform: [{ scale: pop }] }]}>✓</Animated.Text>
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
