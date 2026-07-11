import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'phosphor-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { CategoryIcon } from '@/components/CategoryIcon';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { useTheme } from '@/theme';
import { TRACKS } from '@/content';
import { OnboardingStackParamList } from '@/navigation/types';
import { useAppStore } from '@/store/appStore';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'GoalSelection'>;

/** First interactive screen, shown before sign-up (spec §3.2). */
export function GoalSelectionScreen({ navigation }: Props) {
  const theme = useTheme();
  const enterDemoMode = useAppStore((s) => s.enterDemoMode);

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.display, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
        What do you want to change?
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 28 }]}>
        Pick a goal to get a path built just for you. You can always add more later.
      </Text>

      <View style={{ gap: 14 }}>
        {TRACKS.map((track, i) => (
          <FadeSlideIn key={track.id} index={i}>
            <AnimatedPressable
              disabled={!track.available}
              onPress={() => navigation.navigate('PersonalizationChecklist', { trackId: track.id })}
              style={[
                styles.card,
                {
                  backgroundColor: track.available ? theme.colors.primarySoft : theme.colors.surface,
                  borderColor: track.available ? theme.colors.primary : 'transparent',
                  opacity: track.available ? 1 : 0.5,
                },
              ]}
            >
              <View style={[styles.iconTile, { backgroundColor: track.available ? theme.colors.primary : theme.colors.surfaceRaised }]}>
                <CategoryIcon name={track.icon} size={28} color={track.available ? theme.colors.onPrimary : theme.colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[theme.typography.h2, { color: theme.colors.textPrimary }]}>{track.title}</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                  {track.available ? track.subtitle : 'Coming soon'}
                </Text>
              </View>
              {track.available ? (
                <CheckCircle size={24} color={theme.colors.primary} weight="fill" />
              ) : (
                <View style={[styles.radioRing, { borderColor: theme.colors.border }]} />
              )}
            </AnimatedPressable>
          </FadeSlideIn>
        ))}
      </View>

      <Pressable onPress={enterDemoMode} style={styles.demoLink}>
        <Text style={{ color: theme.colors.textSecondary, textDecorationLine: 'underline' }}>
          Just want to look around? View demo
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, borderWidth: 2, padding: 18 },
  iconTile: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  radioRing: { width: 24, height: 24, borderRadius: 12, borderWidth: 2 },
  demoLink: { marginTop: 24, alignItems: 'center' },
});
