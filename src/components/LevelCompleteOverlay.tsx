import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
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
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surfaceRaised }]}>
          <Text style={styles.emoji}>🎉</Text>
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
        </View>
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
