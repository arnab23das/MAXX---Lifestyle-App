import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { Button } from '@/components/Button';

interface Props {
  visible: boolean;
  xpGained: number;
  creditsGained: number;
  usedFreeze: boolean;
  onDone: () => void;
}

export function LevelCompleteOverlay({ visible, xpGained, creditsGained, usedFreeze, onDone }: Props) {
  const theme = useTheme();
  const pop = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(wobble, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible, pop, wobble]);

  const cardScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const emojiRotate = wobble.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { backgroundColor: theme.colors.surfaceRaised, transform: [{ scale: cardScale }] }]}>
          <Animated.Text style={[styles.emoji, { transform: [{ rotate: emojiRotate }] }]}>🎉</Animated.Text>
          <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, textAlign: 'center' }]}>Level complete!</Text>
          <View style={styles.rewards}>
            <Text style={[theme.typography.bodyStrong, { color: theme.colors.xp }]}>+{xpGained} XP</Text>
            <Text style={[theme.typography.bodyStrong, { color: theme.colors.credit }]}>+{creditsGained} 🪙</Text>
          </View>
          {usedFreeze && (
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              We used one of your streak freezes to cover a missed day — your streak lives on.
            </Text>
          )}
          <Button label="Continue" onPress={onDone} style={{ marginTop: 20 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 24, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 8 },
  rewards: { flexDirection: 'row', gap: 20, marginTop: 16 },
});
