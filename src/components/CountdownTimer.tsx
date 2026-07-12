import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  durationSeconds: number;
  onComplete: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CountdownTimer({ durationSeconds, onComplete }: Props) {
  const theme = useTheme();
  const [remaining, setRemaining] = useState(durationSeconds);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const fraction = 1 - remaining / durationSeconds;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, { borderColor: theme.colors.primary, transform: [{ scale: pulse }] }]}>
        <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>{formatTime(remaining)}</Text>
      </Animated.View>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceRaised }]}>
        <View style={[styles.fill, { backgroundColor: theme.colors.primary, width: `${Math.min(100, fraction * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 32, gap: 20 },
  ring: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  track: { width: '100%', height: 8, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
});
