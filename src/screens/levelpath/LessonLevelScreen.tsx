import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { Level, LessonContent } from '@/types/content';
import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';

interface Props {
  level: Level;
  onFinish: () => void;
}

export function LessonLevelScreen({ level, onFinish }: Props) {
  const theme = useTheme();
  const content = level.content as LessonContent;
  const [cardIndex, setCardIndex] = useState(0);
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);

  const isLastCard = cardIndex >= content.cards.length - 1;
  const showQuestion = isLastCard && !!content.checkQuestion;
  const card = content.cards[cardIndex];

  function handleNext() {
    if (!isLastCard) {
      setCardIndex((i) => i + 1);
      return;
    }
    if (content.checkQuestion && answerIndex === null) return;
    onFinish();
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.eyebrow, { color: theme.colors.lesson, marginBottom: 8 }]}>
        LESSON • {cardIndex + 1}/{content.cards.length + (content.checkQuestion ? 1 : 0)}
      </Text>

      {!showQuestion ? (
        <View>
          <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 12 }]}>{card.heading}</Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24 }]}>{card.body}</Text>
        </View>
      ) : (
        content.checkQuestion && (
          <View>
            <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 16 }]}>
              {content.checkQuestion.prompt}
            </Text>
            <View style={{ gap: 10 }}>
              {content.checkQuestion.options.map((option, i) => {
                const selected = answerIndex === i;
                const isCorrect = i === content.checkQuestion!.correctIndex;
                const showResult = answerIndex !== null;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setAnswerIndex(i)}
                    style={[
                      styles.option,
                      {
                        borderColor:
                          showResult && selected ? (isCorrect ? theme.colors.success : theme.colors.danger) : theme.colors.border,
                        backgroundColor: selected ? theme.colors.lessonSoft : theme.colors.surface,
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.textPrimary }}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )
      )}

      <View style={{ marginTop: 32 }}>
        <Button
          label={showQuestion ? 'Finish lesson' : 'Continue'}
          onPress={handleNext}
          disabled={showQuestion && answerIndex === null}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  option: { padding: 14, borderRadius: 14, borderWidth: 1.5 },
});
