import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useAppStore, selectNextLevelIndex } from '@/store/appStore';
import { StreakBadge, CreditBadge, XpBar } from '@/components/Hud';
import { SosButton } from '@/components/SosButton';
import { LevelNode, LevelNodeStatus } from '@/components/LevelNode';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Snake offsets echoing the reference's zig-zag path (§4 of the spec:
// "vertical/winding map") — Duolingo-style, climbing bottom to top.
const ZIGZAG_OFFSETS = [0, -72, -96, -40, 40, 88];

export function MainLevelPathScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const path = useAppStore((s) => s.path);
  const progress = useAppStore((s) => s.progress);
  const levelsById = useAppStore((s) => s.levelsById);
  const gamification = useAppStore((s) => s.gamification);
  const nextIndex = useAppStore(selectNextLevelIndex);
  const scrollRef = useRef<ScrollView>(null);

  const levels = useMemo(() => (path ? path.levelIds.map((id) => levelsById.get(id)).filter(Boolean) : []), [path, levelsById]);
  const completedCount = levels.filter((l) => l && progress[l.id]?.status === 'completed').length;

  function statusFor(index: number): LevelNodeStatus {
    const level = levels[index];
    if (!level) return 'locked';
    const p = progress[level.id];
    if (p?.status === 'completed') return 'completed';
    if (index <= nextIndex) return 'unlocked';
    return 'locked';
  }

  // The path climbs bottom-to-top like Duolingo: level 1 renders last (at
  // the bottom of the scroll content), so start scrolled all the way down.
  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
      return () => clearTimeout(timer);
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <StreakBadge streak={gamification?.currentStreak ?? 0} />
          <View style={{ flex: 1 }} />
          <CreditBadge credits={gamification?.credits ?? 0} />
        </View>
        <View style={styles.hudRow}>
          <XpBar xp={gamification?.xp ?? 0} />
        </View>
      </View>

      {levels.length > 0 && (
        <View style={[styles.unitBanner, { backgroundColor: theme.colors.primaryLip }]}>
          <View>
            <Text style={[theme.typography.eyebrow, { color: 'rgba(255,255,255,0.7)' }]}>YOUR PATH</Text>
            <Text style={[theme.typography.h2, { color: 'white', marginTop: 2 }]}>
              {completedCount} of {levels.length} levels done
            </Text>
          </View>
        </View>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.path}>
        {levels.length === 0 && (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
            Your path is being built…
          </Text>
        )}
        {/* Rendered top-to-bottom in reverse so level 1 lands at the bottom of the scroll — climb up as you progress. */}
        {[...levels].reverse().map((level, reversedIndex) => {
          if (!level) return null;
          const index = levels.length - 1 - reversedIndex;
          const offset = ZIGZAG_OFFSETS[index % ZIGZAG_OFFSETS.length];
          return (
            <FadeSlideIn key={level.id} index={Math.min(index, 10)} style={{ transform: [{ translateX: offset }] }}>
              <LevelNode
                type={level.type}
                title={level.title}
                status={statusFor(index)}
                isCurrent={index === nextIndex}
                onPress={() => navigation.navigate('LevelDetail', { levelId: level.id })}
              />
            </FadeSlideIn>
          );
        })}
      </ScrollView>

      <View style={styles.sosFloating}>
        <SosButton onPress={() => navigation.navigate('Sos')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hud: { padding: 16, gap: 10 },
  hudRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  unitBanner: { marginHorizontal: 20, marginBottom: 8, borderRadius: 20, padding: 16 },
  path: { paddingVertical: 32, alignItems: 'center', gap: 28 },
  sosFloating: { position: 'absolute', right: 20, bottom: 24 },
});
