import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme';
import { Block } from '@/types/domain';
import { getMyBlocks, unblockUser } from '@/api/community';
import { useAuthStore } from '@/store/authStore';

export function BlockedUsersScreen() {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session?.user) return;
    setLoading(true);
    setBlocks(await getMyBlocks(session.user.id));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnblock(blockedId: string) {
    if (!session?.user) return;
    await unblockUser(session.user.id, blockedId);
    load();
  }

  return (
    <ScreenContainer padded={false}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={blocks}
        keyExtractor={(b) => b.id}
        ListEmptyComponent={
          !loading ? <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No blocked users.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.textPrimary, flex: 1 }}>{item.blockedDisplayName}</Text>
            <Pressable onPress={() => handleUnblock(item.blockedId)}>
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Unblock</Text>
            </Pressable>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1 },
});
