import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Lightning } from 'phosphor-react-native';
import { useTheme } from '@/theme';

export function SplashScreen() {
  const theme = useTheme();
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2100, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.logoTile,
          { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primaryLip, transform: [{ translateY }] },
        ]}
      >
        <Lightning size={58} color={theme.colors.onPrimary} weight="fill" />
      </Animated.View>
      <Text style={[styles.wordmark, { color: theme.colors.textPrimary }]}>MAXX</Text>
      <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>Level up your life.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logoTile: {
    width: 110,
    height: 110,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  wordmark: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
  tagline: { fontSize: 15 },
});
