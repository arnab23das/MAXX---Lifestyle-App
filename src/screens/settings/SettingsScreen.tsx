import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { useTheme } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { signOut } from '@/api/auth';
import { updateMyProfile } from '@/api/profile';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const theme = useTheme();
  return (
    <AnimatedPressable onPress={onPress} style={[styles.row, { borderColor: theme.colors.border }]} scaleTo={0.98}>
      <Text style={{ color: danger ? theme.colors.danger : theme.colors.textPrimary, fontWeight: '600' }}>{label}</Text>
      <Text style={{ color: theme.colors.textSecondary }}>›</Text>
    </AnimatedPressable>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const isDemo = useAppStore((s) => s.isDemo);
  const exitDemoMode = useAppStore((s) => s.exitDemoMode);

  async function toggleNotifications(value: boolean) {
    if (isDemo) {
      useAppStore.setState((s) => (s.profile ? { profile: { ...s.profile, notificationsEnabled: value } } : s));
      return;
    }
    if (!session?.user) return;
    await updateMyProfile(session.user.id, { notificationsEnabled: value });
    useAppStore.setState((s) => (s.profile ? { profile: { ...s.profile, notificationsEnabled: value } } : s));
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.display, { color: theme.colors.textPrimary, marginBottom: 20 }]}>Settings</Text>

      {isDemo && (
        <View style={[styles.demoBanner, { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary }]}>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>
            You're in demo mode. Nothing here is saved — Community and SOS features that need a real account won't work.
          </Text>
        </View>
      )}

      <View style={[styles.row, { borderColor: theme.colors.border }]}>
        <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>Daily streak reminders</Text>
        <Switch value={profile?.notificationsEnabled ?? true} onValueChange={toggleNotifications} />
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>COMMUNITY</Text>
      <Row label={`Region: ${profile?.region ?? 'Not set'}`} onPress={() => navigation.navigate('RegionPicker')} />
      {!isDemo && <Row label="Blocked users" onPress={() => navigation.navigate('BlockedUsers')} />}

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>ON YOUR HOME SCREEN</Text>
      <Row label="Widgets" onPress={() => navigation.navigate('WidgetInfo')} />

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 20, marginBottom: 8 }]}>LEGAL</Text>
      <Row label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
      <Row label="Terms of Use" onPress={() => navigation.navigate('Terms')} />

      <View style={{ marginTop: 32, gap: 12 }}>
        {isDemo ? (
          <Button label="Exit demo mode" onPress={exitDemoMode} variant="secondary" />
        ) : (
          <>
            <Button label="Sign out" onPress={() => signOut()} variant="secondary" />
            <Row label="Delete account" onPress={() => navigation.navigate('AccountDeletion')} danger />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  demoBanner: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 20 },
});
