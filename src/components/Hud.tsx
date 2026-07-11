import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Fire, Coin } from 'phosphor-react-native';
import { useTheme } from '@/theme';
import { computeXpProgress } from '@/utils/gamification';

export function StreakBadge({ streak }: { streak: number }) {
  const theme = useTheme();
  const flick = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: 1050, useNativeDriver: true }),
        Animated.timing(flick, { toValue: 0, duration: 1050, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flick]);

  const scale = flick.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });

  return (
    <View style={styles.statGroup}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Fire size={20} color={theme.colors.primary} weight="fill" />
      </Animated.View>
      <Text style={[styles.statNumber, { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold }]}>{streak}</Text>
    </View>
  );
}

export function CreditBadge({ credits }: { credits: number }) {
  const theme = useTheme();
  return (
    <View style={styles.statGroup}>
      <Coin size={20} color={theme.colors.primary} weight="fill" />
      <Text style={[styles.statNumber, { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold }]}>{credits}</Text>
    </View>
  );
}

export function XpBar({ xp }: { xp: number }) {
  const theme = useTheme();
  const progress = computeXpProgress(xp);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(shimmer, { toValue: 1, duration: 2600, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-80, 260] });

  return (
    <View style={styles.xpWrap}>
      <View style={styles.xpHeader}>
        <Text style={[theme.typography.eyebrow, { color: theme.colors.primary }]}>Level {progress.level}</Text>
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          {progress.xpIntoLevel} / {progress.xpForNextLevel} XP
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.colors.surfaceRaised }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: theme.colors.xp, width: `${Math.min(100, Math.round(progress.fraction * 100))}%` },
          ]}
        >
          <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statNumber: { fontSize: 17 },
  xpWrap: { flex: 1, gap: 6 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, overflow: 'hidden' },
  shimmer: { width: 60, height: '100%', backgroundColor: 'rgba(255,255,255,0.45)' },
});
