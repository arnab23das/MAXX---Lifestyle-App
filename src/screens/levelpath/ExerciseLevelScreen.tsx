import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { Level, ExerciseContent } from '@/types/content';
import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { BreathingTimer } from '@/components/BreathingTimer';
import { CountdownTimer } from '@/components/CountdownTimer';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';

interface Props {
  level: Level;
  onFinish: () => void;
}

type Phase = 'intro' | 'active' | 'complete';

// Standard box-breathing pattern used to turn a total duration into cycles
// for the "breathing_timer" format, which the schema only gives a total for.
const BREATH_INHALE = 4;
const BREATH_HOLD = 4;
const BREATH_EXHALE = 6;

export function ExerciseLevelScreen({ level, onFinish }: Props) {
  const theme = useTheme();
  const content = level.content as ExerciseContent;
  const [phase, setPhase] = useState<Phase>('intro');
  const [rating, setRating] = useState<number | null>(null);

  const cycles = Math.max(1, Math.round(content.durationSeconds / (BREATH_INHALE + BREATH_HOLD + BREATH_EXHALE)));

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.eyebrow, { color: theme.colors.exercise, marginBottom: 8 }]}>EXERCISE</Text>

      {phase === 'intro' && (
        <FadeSlideIn>
          <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 12 }]}>{level.title}</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}>{content.instruction}</Text>
        </FadeSlideIn>
      )}

      {phase === 'active' && content.format === 'breathing_timer' && (
        <FadeSlideIn>
          <BreathingTimer
            inhaleSeconds={BREATH_INHALE}
            holdSeconds={BREATH_HOLD}
            exhaleSeconds={BREATH_EXHALE}
            cycles={cycles}
            onComplete={() => setPhase('complete')}
          />
        </FadeSlideIn>
      )}

      {phase === 'active' && (content.format === 'timed_reflection' || content.format === 'countdown') && (
        <FadeSlideIn>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 8, textAlign: 'center' }]}>
            {content.instruction}
          </Text>
          <CountdownTimer durationSeconds={content.durationSeconds} onComplete={() => setPhase('complete')} />
        </FadeSlideIn>
      )}

      {phase === 'active' && content.format === 'real_world_task' && (
        <FadeSlideIn>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24, marginBottom: 24 }]}>
            {content.instruction}
          </Text>
          <Button label="I did it" onPress={() => setPhase('complete')} variant="secondary" />
        </FadeSlideIn>
      )}

      {phase === 'complete' && (
        <FadeSlideIn>
          <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginBottom: 16 }]}>{content.completionPrompt}</Text>
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <AnimatedPressable
                key={n}
                onPress={() => setRating(n)}
                scaleTo={1.15}
                style={[
                  styles.scaleDot,
                  { borderColor: theme.colors.exercise, backgroundColor: rating === n ? theme.colors.exercise : 'transparent' },
                ]}
              >
                <Text style={{ color: rating === n ? theme.colors.onPrimary : theme.colors.exercise, fontWeight: '700' }}>{n}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </FadeSlideIn>
      )}

      <View style={{ marginTop: 32 }}>
        <Button
          label={phase === 'intro' ? 'Start' : phase === 'complete' ? 'Finish exercise' : 'In progress…'}
          onPress={phase === 'intro' ? () => setPhase('active') : onFinish}
          disabled={phase === 'active' || (phase === 'complete' && rating === null)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scaleRow: { flexDirection: 'row', gap: 10 },
  scaleDot: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
