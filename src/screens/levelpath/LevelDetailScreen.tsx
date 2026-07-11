import React, { useState } from 'react';
import { Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { LessonLevelScreen } from './LessonLevelScreen';
import { ExerciseLevelScreen } from './ExerciseLevelScreen';
import { DocumentationLevelScreen } from './DocumentationLevelScreen';
import { LevelCompleteOverlay } from '@/components/LevelCompleteOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'LevelDetail'>;

export function LevelDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { levelId } = route.params;
  const level = useAppStore((s) => s.levelsById.get(levelId));
  const completeLevel = useAppStore((s) => s.completeLevel);
  const session = useAuthStore((s) => s.session);

  const [result, setResult] = useState<{ xpGained: number; creditsGained: number; usedFreeze: boolean } | null>(null);

  if (!level) {
    return (
      <ScreenContainer>
        <Text style={{ color: theme.colors.textPrimary }}>Level not found.</Text>
      </ScreenContainer>
    );
  }

  async function handleFinish() {
    if (!session?.user) return;
    const outcome = await completeLevel(session.user.id, level!.id);
    setResult(outcome);
  }

  return (
    <>
      {level.type === 'lesson' && <LessonLevelScreen level={level} onFinish={handleFinish} />}
      {level.type === 'exercise' && <ExerciseLevelScreen level={level} onFinish={handleFinish} />}
      {level.type === 'documentation' && <DocumentationLevelScreen level={level} onFinish={handleFinish} />}

      <LevelCompleteOverlay
        visible={!!result}
        xpGained={result?.xpGained ?? 0}
        creditsGained={result?.creditsGained ?? 0}
        usedFreeze={result?.usedFreeze ?? false}
        onDone={() => navigation.goBack()}
      />
    </>
  );
}
