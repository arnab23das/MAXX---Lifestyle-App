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
  const scale = useRef(new Animated.Value(1)).current;

  const hasLip = variant === 'primary' || variant === 'danger';
  const fill = variant === 'primary' ? theme.colors.primary : variant === 'danger' ? theme.colors.sos : variant === 'secondary' ? theme.colors.surface : 'transparent';
  const lipColor = variant === 'primary' ? theme.colors.primaryLip : theme.colors.sosDeep;
  const textColor = variant === 'ghost' ? theme.colors.primary : variant === 'secondary' ? theme.colors.textPrimary : theme.colors.onPrimary;
  const borderColor = variant === 'secondary' ? theme.colors.border : 'transparent';
  const radius = variant === 'ghost' ? theme.radii.md : theme.radii.lg;

  function handlePressIn() {
    if (hasLip) Animated.timing(lipOffset, { toValue: 1, duration: 80, useNativeDriver: true }).start();
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  }
  function handlePressOut() {
    if (hasLip) Animated.timing(lipOffset, { toValue: 0, duration: 80, useNativeDriver: true }).start();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  }

  const translateY = lipOffset.interpolate({ inputRange: [0, 1], outputRange: [0, theme.lip.height] });

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        hasLip && { backgroundColor: lipColor, borderRadius: radius, opacity: disabled ? 0.5 : 1 },
        { transform: [{ scale }] },
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
            { backgroundColor: fill, borderColor, borderRadius: radius, transform: [{ translateY }] },
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
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  label: { fontSize: 16 },
});
