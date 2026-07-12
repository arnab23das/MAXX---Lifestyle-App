import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { Level, LessonContent } from '@/types/content';
import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';

interface Props {
  level: Level;
  onFinish: () => void;
}

/** -1 = the lesson fact itself; 0..questions.length-1 = each MCQ in turn. */
export function LessonLevelScreen({ level, onFinish }: Props) {
  const theme = useTheme();
  const content = level.content as LessonContent;
  const [step, setStep] = useState(-1);
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);

  const totalSteps = 1 + content.questions.length;
  const question = step >= 0 ? content.questions[step] : null;
  const answered = answerIndex !== null;
  const isCorrect = question ? answerIndex === question.correctIndex : false;

  function handleNext() {
    if (question && !answered) return;
    if (step >= content.questions.length - 1) {
      onFinish();
      return;
    }
    setAnswerIndex(null);
    setStep((s) => s + 1);
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.eyebrow, { color: theme.colors.lesson, marginBottom: 8 }]}>
        LESSON • {step + 2}/{totalSteps}
      </Text>

      {step === -1 ? (
        <FadeSlideIn>
          <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 12 }]}>{level.title}</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}>{content.lessonText}</Text>
        </FadeSlideIn>
      ) : (
        question && (
          <FadeSlideIn key={step}>
            <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 16 }]}>{question.prompt}</Text>
            <View style={{ gap: 10 }}>
              {question.options.map((option, i) => {
                const selected = answerIndex === i;
                const showResult = answered && selected;
                return (
                  <AnimatedPressable
                    key={option}
                    onPress={() => !answered && setAnswerIndex(i)}
                    style={[
                      styles.option,
                      {
                        borderColor: showResult ? (isCorrect ? theme.colors.success : theme.colors.danger) : theme.colors.border,
                        backgroundColor: selected ? theme.colors.lessonSoft : theme.colors.surface,
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.textPrimary }}>{option}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
            {answered && (
              <FadeSlideIn>
                <Text
                  style={[
                    theme.typography.body,
                    { color: isCorrect ? theme.colors.success : theme.colors.danger, marginTop: 14, lineHeight: 22 },
                  ]}
                >
                  {isCorrect ? question.feedbackCorrect : question.feedbackIncorrect}
                </Text>
              </FadeSlideIn>
            )}
          </FadeSlideIn>
        )
      )}

      <View style={{ marginTop: 32 }}>
        <Button
          label={step === -1 ? 'Continue' : step === content.questions.length - 1 ? 'Finish lesson' : 'Next question'}
          onPress={handleNext}
          disabled={!!question && !answered}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  option: { padding: 14, borderRadius: 14, borderWidth: 1.5 },
});
