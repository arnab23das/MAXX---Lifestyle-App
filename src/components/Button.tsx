import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

/** Primary buttons use the reference's "3D lip" elevation: a solid offset shadow, not a blur. */
export function Button({ label, onPress, variant = 'primary', disabled, loading, style, fullWidth = true }: Props) {
  const theme = useTheme();
  const lipOffset = useRef(new Animated.Value(0)).current;

  const hasLip = variant === 'primary' || variant === 'danger';
  const fill = variant === 'primary' ? theme.colors.primary : variant === 'danger' ? theme.colors.sos : variant === 'secondary' ? theme.colors.surface : 'transparent';
  const lipColor = variant === 'primary' ? theme.colors.primaryLip : theme.colors.sosDeep;
  const textColor = variant === 'ghost' ? theme.colors.primary : variant === 'secondary' ? theme.colors.textPrimary : theme.colors.onPrimary;
  const borderColor = variant === 'secondary' ? theme.colors.border : 'transparent';

  function handlePressIn() {
    if (hasLip) Animated.timing(lipOffset, { toValue: 1, duration: 80, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    if (hasLip) Animated.timing(lipOffset, { toValue: 0, duration: 80, useNativeDriver: true }).start();
  }

  const translateY = lipOffset.interpolate({ inputRange: [0, 1], outputRange: [0, theme.lip.height] });

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        hasLip && { backgroundColor: lipColor, borderRadius: theme.radii.md, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={styles.pressableWrap}
      >
        <Animated.View
          style={[
            styles.base,
            { backgroundColor: fill, borderColor, borderRadius: theme.radii.md, transform: [{ translateY }] },
            !hasLip && { opacity: disabled ? 0.5 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <Text style={[styles.label, { color: textColor, fontFamily: theme.fontFamily.bold }]}>{label}</Text>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressableWrap: { alignSelf: 'stretch' },
  base: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  label: { fontSize: 16 },
});
