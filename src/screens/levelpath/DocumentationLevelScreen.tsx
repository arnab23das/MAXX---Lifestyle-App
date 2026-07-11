import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { Level, DocumentationContent } from '@/types/content';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { ScreenContainer } from '@/components/ScreenContainer';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { createJournalEntry } from '@/api/journal';
import { createPost } from '@/api/community';
import { checkPostText } from '@/utils/contentFilter';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

interface Props {
  level: Level;
  onFinish: () => void;
}

function ScalePicker({ value, onChange, color }: { value: number | null; onChange: (n: number) => void; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.scaleRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <AnimatedPressable
          key={n}
          onPress={() => onChange(n)}
          scaleTo={1.15}
          style={[styles.scaleDot, { borderColor: color, backgroundColor: value === n ? color : 'transparent' }]}
        >
          <Text style={{ color: value === n ? theme.colors.onPrimary : color, fontWeight: '700' }}>{n}</Text>
        </AnimatedPressable>
      ))}
    </View>
  );
}

export function DocumentationLevelScreen({ level, onFinish }: Props) {
  const theme = useTheme();
  const content = level.content as DocumentationContent;
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const isDemo = useAppStore((s) => s.isDemo);

  const [mood, setMood] = useState<number | null>(null);
  const [craving, setCraving] = useState<number | null>(null);
  const [wins, setWins] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState('');
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moodPrompt = content.prompts.find((p) => p.kind === 'mood_scale');
  const cravingPrompt = content.prompts.find((p) => p.kind === 'craving_scale');
  const winsPrompt = content.prompts.find((p) => p.kind === 'win_tag_multiselect');
  const freeTextPrompt = content.prompts.find((p) => p.kind === 'free_text');

  function toggleWin(win: string) {
    setWins((prev) => {
      const next = new Set(prev);
      if (next.has(win)) next.delete(win);
      else next.add(win);
      return next;
    });
  }

  async function handleSave() {
    setError(null);

    if (shareToCommunity) {
      const check = checkPostText(freeText || '(shared a reflection)');
      if (!check.allowed) {
        setError(check.reason ?? 'This entry can’t be shared as written.');
        return;
      }
    }

    if (isDemo) {
      // Nothing to persist without a real account — just advance.
      onFinish();
      return;
    }

    if (!session?.user) return;
    setSaving(true);
    try {
      const entry = await createJournalEntry(session.user.id, {
        levelId: level.id,
        mood,
        craving,
        wins: [...wins],
        freeText,
        isShared: shareToCommunity,
      });

      if (shareToCommunity) {
        await createPost({
          authorId: session.user.id,
          authorDisplayName: profile?.displayName ?? 'A MAXX user',
          region: profile?.region ?? null,
          text: freeText.trim().length > 0 ? freeText.trim() : 'Shared a reflection from today’s check-in.',
          sourceJournalEntryId: entry.id,
        });
      }
      onFinish();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong saving your entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.eyebrow, { color: theme.colors.documentation, marginBottom: 8 }]}>DOCUMENTATION</Text>
      <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, marginBottom: 8 }]}>{level.title}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 24 }]}>{content.intro}</Text>

      {moodPrompt && (
        <View style={styles.block}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary, marginBottom: 8 }]}>{moodPrompt.label}</Text>
          <ScalePicker value={mood} onChange={setMood} color={theme.colors.documentation} />
        </View>
      )}

      {cravingPrompt && (
        <View style={styles.block}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary, marginBottom: 8 }]}>{cravingPrompt.label}</Text>
          <ScalePicker value={craving} onChange={setCraving} color={theme.colors.exercise} />
        </View>
      )}

      {winsPrompt?.options && (
        <View style={styles.block}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary, marginBottom: 8 }]}>{winsPrompt.label}</Text>
          <View style={styles.tagWrap}>
            {winsPrompt.options.map((opt) => {
              const selected = wins.has(opt);
              return (
                <AnimatedPressable
                  key={opt}
                  onPress={() => toggleWin(opt)}
                  style={[
                    styles.tag,
                    { borderColor: theme.colors.border, backgroundColor: selected ? theme.colors.documentationSoft : theme.colors.surface },
                  ]}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 13 }}>{opt}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      )}

      {freeTextPrompt && (
        <View style={styles.block}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary, marginBottom: 8 }]}>{freeTextPrompt.label}</Text>
          <TextInput
            value={freeText}
            onChangeText={setFreeText}
            placeholder="Write as much or as little as you like…"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            style={[
              styles.textArea,
              { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface },
            ]}
          />
        </View>
      )}

      <View style={[styles.block, { marginTop: 8 }]}>
        <Checkbox
          checked={shareToCommunity}
          onToggle={() => setShareToCommunity((v) => !v)}
          label={
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Share this entry to the MAXX community feed. Your entry stays private unless you check this box.
            </Text>
          }
        />
      </View>

      {error && <Text style={{ color: theme.colors.danger, marginTop: 8 }}>{error}</Text>}

      <View style={{ marginTop: 24 }}>
        <Button label="Save entry" onPress={handleSave} loading={saving} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 20 },
  scaleRow: { flexDirection: 'row', gap: 10 },
  scaleDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  textArea: { borderWidth: 1.5, borderRadius: 14, padding: 14, minHeight: 100, textAlignVertical: 'top', fontSize: 15 },
});
