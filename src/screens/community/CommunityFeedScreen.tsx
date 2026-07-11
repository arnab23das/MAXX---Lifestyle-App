import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { useTheme } from '@/theme';
import { CommunityPost } from '@/types/domain';
import { getGlobalFeed, getLocalFeed, createPost, sendAffirmation, deletePost, reportContent, blockUser } from '@/api/community';
import { checkPostText } from '@/utils/contentFilter';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Scope = 'global' | 'local';

export function CommunityFeedScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const [scope, setScope] = useState<Scope>('global');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (scope === 'local') {
        if (!profile?.region) {
          setPosts([]);
          return;
        }
        setPosts(await getLocalFeed(profile.region));
      } else {
        setPosts(await getGlobalFeed());
      }
    } catch (err: any) {
      Alert.alert('Couldn’t load feed', err.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [scope, profile?.region]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePost() {
    if (!session?.user) return;
    const check = checkPostText(composerText);
    if (!check.allowed) {
      Alert.alert('Can’t post that', check.reason);
      return;
    }
    setPosting(true);
    try {
      await createPost({
        authorId: session.user.id,
        authorDisplayName: profile?.displayName ?? 'A MAXX user',
        region: profile?.region ?? null,
        text: composerText.trim(),
      });
      setComposerText('');
      load();
    } catch (err: any) {
      Alert.alert('Couldn’t post', err.message ?? 'Please try again.');
    } finally {
      setPosting(false);
    }
  }

  async function handleAffirm(post: CommunityPost) {
    if (!session?.user) return;
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, affirmationCount: p.affirmationCount + 1 } : p)));
    try {
      await sendAffirmation(post.id, session.user.id);
    } catch {
      // best-effort; a background refresh will reconcile counts
    }
  }

  function handleMore(post: CommunityPost) {
    const isMine = post.authorId === session?.user?.id;
    const options: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [];
    if (isMine) {
      options.push({
        text: 'Delete post',
        style: 'destructive',
        onPress: async () => {
          await deletePost(post.id);
          load();
        },
      });
    } else {
      options.push({
        text: 'Report post',
        style: 'destructive',
        onPress: async () => {
          await reportContent({ reporterId: session!.user.id, targetType: 'post', targetId: post.id, reason: 'user_reported' });
          Alert.alert('Reported', 'Thanks — our team will review this within 24 hours.');
        },
      });
      options.push({
        text: `Block ${post.authorDisplayName}`,
        style: 'destructive',
        onPress: async () => {
          await blockUser(session!.user.id, post.authorId, post.authorDisplayName);
          load();
        },
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Post options', undefined, options);
  }

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <View style={[styles.scopeToggle, { backgroundColor: theme.colors.surface }]}>
          {(['global', 'local'] as Scope[]).map((s) => (
            <AnimatedPressable
              key={s}
              onPress={() => setScope(s)}
              style={[styles.scopeButton, scope === s && { backgroundColor: theme.colors.primary }]}
            >
              <Text style={{ color: scope === s ? theme.colors.onPrimary : theme.colors.textPrimary, fontWeight: '700' }}>
                {s === 'global' ? 'Global' : 'Local'}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
        {scope === 'local' && !profile?.region && (
          <Pressable onPress={() => navigation.navigate('RegionPicker')}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Set your region</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.composer, { borderColor: theme.colors.border }]}>
        <TextInput
          value={composerText}
          onChangeText={setComposerText}
          placeholder="Share an update or a word of encouragement…"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          style={[styles.composerInput, { color: theme.colors.textPrimary }]}
        />
        <Button label="Post" onPress={handlePost} loading={posting} disabled={composerText.trim().length === 0} fullWidth={false} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 40 }}>
              {scope === 'local' && !profile?.region ? 'Set a region to see local posts.' : 'No posts yet. Be the first to share.'}
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <FadeSlideIn index={Math.min(index, 8)}>
            <View style={[styles.postCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.postHeader}>
                <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>{item.authorDisplayName}</Text>
                <Pressable onPress={() => handleMore(item)} hitSlop={10}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 18 }}>⋯</Text>
                </Pressable>
              </View>
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary, marginTop: 6 }]}>{item.text}</Text>
              <AnimatedPressable onPress={() => handleAffirm(item)} style={styles.affirmRow} scaleTo={1.15}>
                <Text style={{ fontSize: 16 }}>💛</Text>
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>
                  {item.affirmationCount > 0 ? item.affirmationCount : ''} Affirm
                </Text>
              </AnimatedPressable>
            </View>
          </FadeSlideIn>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  scopeToggle: { flexDirection: 'row', borderRadius: 999, padding: 4 },
  scopeButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  composer: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 18, padding: 12, gap: 10 },
  composerInput: { minHeight: 44, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  postCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  affirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
});
