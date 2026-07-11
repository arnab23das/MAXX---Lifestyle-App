import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  cycles: number;
  onComplete: () => void;
}

type Phase = 'inhale' | 'hold' | 'exhale' | 'done';

export function BreathingTimer({ inhaleSeconds, holdSeconds, exhaleSeconds, cycles, onComplete }: Props) {
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>('inhale');
  const [cycle, setCycle] = useState(1);
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function runPhase(currentCycle: number, currentPhase: Exclude<Phase, 'done'>) {
      if (cancelled) return;
      setPhase(currentPhase);
      const duration =
        currentPhase === 'inhale' ? inhaleSeconds : currentPhase === 'hold' ? holdSeconds : exhaleSeconds;

      Animated.timing(scale, {
        toValue: currentPhase === 'inhale' ? 1 : currentPhase === 'exhale' ? 0.6 : (scale as any)._value,
        duration: duration * 1000,
        useNativeDriver: true,
      }).start();

      timer = setTimeout(() => {
        if (cancelled) return;
        if (currentPhase === 'inhale') {
          runPhase(currentCycle, 'hold');
        } else if (currentPhase === 'hold') {
          runPhase(currentCycle, 'exhale');
        } else {
          if (currentCycle >= cycles) {
            setPhase('done');
            onComplete();
          } else {
            setCycle(currentCycle + 1);
            runPhase(currentCycle + 1, 'inhale');
          }
        }
      }, duration * 1000);
    }

    runPhase(1, 'inhale');
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const label = phase === 'inhale' ? 'Breathe in' : phase === 'hold' ? 'Hold' : phase === 'exhale' ? 'Breathe out' : 'Done';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: theme.colors.lessonSoft, borderColor: theme.colors.primary, transform: [{ scale }] },
        ]}
      />
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginTop: 24 }]}>{label}</Text>
      {phase !== 'done' && (
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>
          Cycle {cycle} of {cycles}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  circle: { width: 160, height: 160, borderRadius: 80, borderWidth: 3 },
});
