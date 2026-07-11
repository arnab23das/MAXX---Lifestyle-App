import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckSquare } from 'phosphor-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { CategoryIcon } from '@/components/CategoryIcon';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { useTheme } from '@/theme';
import { getCategoriesForTrack } from '@/content';
import { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PersonalizationChecklist'>;

export function PersonalizationChecklistScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { trackId } = route.params;
  const categories = useMemo(() => getCategoriesForTrack(trackId), [trackId]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customText, setCustomText] = useState('');

  const otherSelected = categories.some((c) => c.isCustom && selected.has(c.id));
  const nonCustomSelectedCount = [...selected].filter((id) => !categories.find((c) => c.id === id)?.isCustom).length;
  const canContinue = nonCustomSelectedCount > 0 || (otherSelected && customText.trim().length > 0);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleContinue() {
    const categoryIds = [...selected].filter((id) => !categories.find((c) => c.id === id)?.isCustom);
    const customLabels = otherSelected
      ? customText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    navigation.navigate('SignUp', { trackId, categoryIds, customLabels });
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.eyebrow, { color: theme.colors.primary, marginBottom: 8 }]}>PERSONALIZE</Text>
      <Text style={[theme.typography.display, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
        What are you working on?
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 24 }]}>
        Pick as many as apply. We’ll build your path around them.
      </Text>

      <View style={{ gap: 10 }}>
        {categories.map((category, i) => {
          const isSelected = selected.has(category.id);
          return (
            <FadeSlideIn key={category.id} index={i}>
              <AnimatedPressable
                onPress={() => toggle(category.id)}
                style={[
                  styles.row,
                  {
                    backgroundColor: isSelected ? theme.colors.primarySoft : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : 'transparent',
                  },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={[styles.iconTile, { backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceRaised }]}>
                  <CategoryIcon
                    name={category.icon}
                    size={22}
                    color={isSelected ? theme.colors.onPrimary : theme.colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>{category.label}</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{category.description}</Text>
                </View>
                {isSelected ? (
                  <CheckSquare size={22} color={theme.colors.primary} weight="fill" />
                ) : (
                  <View style={[styles.checkbox, { borderColor: theme.colors.border }]} />
                )}
              </AnimatedPressable>
              {category.isCustom && isSelected && (
                <TextInput
                  value={customText}
                  onChangeText={setCustomText}
                  placeholder="Tell us what you're working on (comma-separate multiple)"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[
                    styles.input,
                    { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface },
                  ]}
                />
              )}
            </FadeSlideIn>
          );
        })}
      </View>

      <View style={{ marginTop: 32 }}>
        <Button label="Continue" onPress={handleContinue} disabled={!canContinue} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 2, padding: 14 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2 },
  input: { marginTop: 8, borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 15 },
});
