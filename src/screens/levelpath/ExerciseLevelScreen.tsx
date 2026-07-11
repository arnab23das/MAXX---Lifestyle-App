import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { Level, ExerciseContent } from '@/types/content';
import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { BreathingTimer } from '@/components/BreathingTimer';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';

interface Props {
  level: Level;
  onFinish: () => void;
}

export function ExerciseLevelScreen({ level, onFinish }: Props) {
  const theme = useTheme();
  const content = level.content as ExerciseContent;
  const [stepIndex, setStepIndex] = useState(-1); // -1 = intro
  const [choice, setChoice] = useState<string | null>(null);
  const [breathingDone, setBreathingDone] = useState(false);

  const step = stepIndex >= 0 ? content.steps[stepIndex] : null;
  const isLastStep = stepIndex === content.steps.length - 1;

  function goNext() {
    setChoice(null);
    setBreathingDone(false);
    if (stepIndex === content.steps.length - 1) {
      onFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.eyebrow, { color: theme.colors.exercise, marginBottom: 8 }]}>EXERCISE</Text>

      {step === null && (
        <FadeSlideIn>
          <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 12 }]}>{level.title}</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}>{content.intro}</Text>
        </FadeSlideIn>
      )}

      {step?.kind === 'text' && (
        <FadeSlideIn key={stepIndex}>
          <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, lineHeight: 28 }]}>{step.prompt}</Text>
        </FadeSlideIn>
      )}

      {step?.kind === 'breathing' && (
        <FadeSlideIn key={stepIndex}>
          <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginBottom: 4 }]}>{step.prompt}</Text>
          <BreathingTimer
            inhaleSeconds={step.inhaleSeconds}
            holdSeconds={step.holdSeconds}
            exhaleSeconds={step.exhaleSeconds}
            cycles={step.cycles}
            onComplete={() => setBreathingDone(true)}
          />
        </FadeSlideIn>
      )}

      {step?.kind === 'choice' && (
        <FadeSlideIn key={stepIndex}>
          <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginBottom: 16 }]}>{step.prompt}</Text>
          <View style={{ gap: 10 }}>
            {step.options.map((option) => (
              <AnimatedPressable
                key={option}
                onPress={() => setChoice(option)}
                style={[
                  styles.option,
                  {
                    borderColor: choice === option ? theme.colors.exercise : theme.colors.border,
                    backgroundColor: choice === option ? theme.colors.exerciseSoft : theme.colors.surface,
                  },
                ]}
              >
                <Text style={{ color: theme.colors.textPrimary }}>{option}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </FadeSlideIn>
      )}

      <View style={{ marginTop: 32 }}>
        <Button
          label={stepIndex === -1 ? 'Start' : isLastStep ? 'Finish exercise' : 'Next'}
          onPress={goNext}
          disabled={(step?.kind === 'choice' && !choice) || (step?.kind === 'breathing' && !breathingDone)}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  option: { padding: 14, borderRadius: 14, borderWidth: 1.5 },
});
