import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Theme } from '@/theme';

/**
 * React Navigation's native-stack header defaults to a white background
 * regardless of app theme — on this dark, mono-blurple design that renders
 * as a jarring white bar (and can read as "the app is broken"/blank) on
 * every screen with headerShown: true. Apply this everywhere headers show.
 */
export function themedHeaderOptions(theme: Theme): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.textPrimary,
    headerTitleStyle: { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: theme.colors.background },
  };
}
