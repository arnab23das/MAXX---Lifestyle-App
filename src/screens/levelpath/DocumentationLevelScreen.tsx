import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/theme';
import { Level, DocumentationContent, DocumentationField } from '@/types/content';
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

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: DocumentationField;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  const theme = useTheme();

  if (field.input === 'scale_1_5') {
    return <ScalePicker value={typeof value === 'number' ? value : null} onChange={onChange} color={theme.colors.documentation} />;
  }

  if (field.input === 'single_select') {
    return (
      <View style={styles.tagWrap}>
        {(field.options ?? []).map((opt) => {
          const selected = value === opt;
          return (
            <AnimatedPressable
              key={opt}
              onPress={() => onChange(opt)}
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
    );
  }

  return (
    <TextInput
      value={value !== undefined ? String(value) : ''}
      onChangeText={(text) => onChange(field.input === 'number' ? Number(text.replace(/[^0-9]/g, '')) : text)}
      placeholder={field.input === 'number' ? '0' : 'Type here…'}
      placeholderTextColor={theme.colors.textSecondary}
      keyboardType={field.input === 'number' ? 'number-pad' : 'default'}
      multiline={field.input === 'long_text'}
      style={[
        field.input === 'long_text' ? styles.textArea : styles.textInput,
        { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface },
      ]}
    />
  );
}

export function DocumentationLevelScreen({ level, onFinish }: Props) {
  const theme = useTheme();
  const content = level.content as DocumentationContent;
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const isDemo = useAppStore((s) => s.isDemo);

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  const shareText = () => {
    const textField = content.fields.find((f) => f.input === 'long_text' || f.input === 'short_text');
    const value = textField ? answers[textField.key] : undefined;
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'Shared a reflection from today’s check-in.';
  };

  async function handleSave() {
    setError(null);

    if (shareToCommunity) {
      const check = checkPostText(shareText());
      if (!check.allowed) {
        setError(check.reason ?? 'This entry can’t be shared as written.');
        return;
      }
    }

    if (isDemo) {
      onFinish();
      return;
    }

    if (!session?.user) return;
    setSaving(true);
    try {
      const entry = await createJournalEntry(session.user.id, {
        levelId: level.id,
        answers,
        isShared: shareToCommunity,
      });

      if (shareToCommunity) {
        await createPost({
          authorId: session.user.id,
          authorDisplayName: profile?.displayName ?? 'A MAXX user',
          region: profile?.region ?? null,
          text: shareText(),
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
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 24 }]}>{content.checkInPrompt}</Text>

      {content.fields.map((field, i) => (
        <FadeSlideIn key={field.key} index={i} style={styles.block}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary, marginBottom: 8 }]}>{field.label}</Text>
          <FieldInput field={field} value={answers[field.key]} onChange={(v) => setField(field.key, v)} />
        </FadeSlideIn>
      ))}

      {content.shareableToCommunity && (
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
      )}

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
  textInput: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 15 },
  textArea: { borderWidth: 1.5, borderRadius: 14, padding: 14, minHeight: 100, textAlignVertical: 'top', fontSize: 15 },
});
