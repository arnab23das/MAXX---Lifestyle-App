import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function isAppleSignInAvailable() {
  return AppleAuthentication.isAvailableAsync();
}

/** Sign in with Apple, exchanging the native identity token for a Supabase session. */
export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign-in did not return an identity token.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  return data;
}

/**
 * Hook wrapping expo-auth-session's Google provider. Requires
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to be
 * set from a Google Cloud OAuth client (see README "Auth setup").
 *
 * `Google.useAuthRequest` throws synchronously (in a `useMemo`, so it's an
 * uncaught render-phase error — blanks the whole app) if the client id for
 * the current platform is missing. Falling back to a placeholder string
 * satisfies that check without configuration; `isGoogleSignInConfigured`
 * reports whether real credentials are set, which SignUpScreen checks
 * before ever calling `promptAsync`.
 */
export const isGoogleSignInConfigured =
  !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export function useGoogleSignInRequest() {
  return Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'unconfigured',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'unconfigured',
  });
}

export async function signInWithGoogleIdToken(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
