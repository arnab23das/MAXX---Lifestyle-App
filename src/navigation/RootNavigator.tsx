import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { SplashScreen } from '@/screens/onboarding/SplashScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabs } from './MainTabs';
import { LevelDetailScreen } from '@/screens/levelpath/LevelDetailScreen';
import { SosScreen } from '@/screens/sos/SosScreen';
import { PrivacyPolicyScreen } from '@/screens/legal/PrivacyPolicyScreen';
import { TermsScreen } from '@/screens/legal/TermsScreen';
import { AccountDeletionScreen } from '@/screens/settings/AccountDeletionScreen';
import { BlockedUsersScreen } from '@/screens/community/BlockedUsersScreen';
import { RegionPickerScreen } from '@/screens/community/RegionPickerScreen';
import { WidgetInfoScreen } from '@/screens/widgets/WidgetInfoScreen';
import { syncDailyReminder } from '@/utils/notifications';
import { useTheme } from '@/theme';
import { themedHeaderOptions } from './screenOptions';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const init = useAuthStore((s) => s.init);
  const session = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);
  const loadForUser = useAppStore((s) => s.loadForUser);
  const reset = useAppStore((s) => s.reset);
  const profile = useAppStore((s) => s.profile);
  const appLoading = useAppStore((s) => s.loading);
  const isDemo = useAppStore((s) => s.isDemo);
  const loadedUserId = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  useEffect(() => {
    if (isDemo) return;
    if (session?.user) {
      if (loadedUserId.current !== session.user.id) {
        loadedUserId.current = session.user.id;
        loadForUser(session.user.id);
      }
    } else {
      loadedUserId.current = null;
      reset();
    }
  }, [session?.user, loadForUser, reset, isDemo]);

  useEffect(() => {
    if (profile && !isDemo) syncDailyReminder(profile.notificationsEnabled);
  }, [profile?.notificationsEnabled, isDemo]);

  const onboarded = isDemo || (!!profile?.selectedTrackId && profile.selectedCategoryIds.length > 0 && !!profile.acceptedTermsAt);
  const showSplash = !isDemo && (initializing || (!!session && appLoading && !profile));
  const showOnboarding = !isDemo && (!session || !onboarded);

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, ...themedHeaderOptions(theme) }}>
        {showSplash ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="LevelDetail" component={LevelDetailScreen} options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="Sos" component={SosScreen} options={{ headerShown: true, title: 'SOS', presentation: 'modal' }} />
            <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ headerShown: true, title: 'Blocked users' }} />
            <Stack.Screen name="RegionPicker" component={RegionPickerScreen} options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="WidgetInfo" component={WidgetInfoScreen} options={{ headerShown: true, title: '' }} />
          </>
        )}
        {/* Always reachable, even pre-auth, since the sign-up screen links here (spec §3.4). */}
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: '' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
