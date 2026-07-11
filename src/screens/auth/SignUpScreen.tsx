import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { useTheme } from '@/theme';
import { OnboardingStackParamList } from '@/navigation/types';
import {
  signUpWithEmail,
  signInWithApple,
  isAppleSignInAvailable,
  useGoogleSignInRequest,
  signInWithGoogleIdToken,
  isGoogleSignInConfigured,
} from '@/api/auth';
import { useAppStore } from '@/store/appStore';
import { SIGNUP_ACKNOWLEDGMENT, TERMS_VERSION } from '@/content/legal';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SignUp'>;

export function SignUpScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { trackId, categoryIds, customLabels } = route.params;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const selectTrackAndCategories = useAppStore((s) => s.selectTrackAndCategories);
  const acceptTerms = useAppStore((s) => s.acceptTerms);
  const [googleRequest, , promptGoogleSignIn] = useGoogleSignInRequest();

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      isAppleSignInAvailable().then(setAppleAvailable);
    }
  }, []);

  async function finishOnboarding(userId: string) {
    await selectTrackAndCategories(userId, trackId, categoryIds, customLabels);
    await acceptTerms(userId, TERMS_VERSION);
  }

  async function handleEmailSignUp() {
    if (!agreed) {
      Alert.alert('One more thing', 'Please agree to the Terms of Use and Privacy Policy to continue.');
      return;
    }
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('Check your details', 'Enter a valid email and a password with at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await signUpWithEmail(email.trim(), password);
      if (user) await finishOnboarding(user.id);
    } catch (err: any) {
      Alert.alert('Sign-up failed', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignUp() {
    if (!agreed) {
      Alert.alert('One more thing', 'Please agree to the Terms of Use and Privacy Policy to continue.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await signInWithApple();
      if (user) await finishOnboarding(user.id);
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple sign-in failed', err.message ?? 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    if (!agreed) {
      Alert.alert('One more thing', 'Please agree to the Terms of Use and Privacy Policy to continue.');
      return;
    }
    if (!isGoogleSignInConfigured || !googleRequest) {
      Alert.alert(
        'Google sign-in setup needed',
        'Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env from a Google Cloud OAuth client (see README "Auth setup").'
      );
      return;
    }
    setLoading(true);
    try {
      const result = await promptGoogleSignIn();
      if (result.type === 'success' && result.authentication?.idToken) {
        const { user } = await signInWithGoogleIdToken(result.authentication.idToken);
        if (user) await finishOnboarding(user.id);
      }
    } catch (err: any) {
      Alert.alert('Google sign-in failed', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <Text style={[theme.typography.display, { color: theme.colors.textPrimary, marginBottom: 8 }]}>Create your account</Text>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 24 }]}>
        Your path is ready. Sign up to save your progress.
      </Text>

      <View style={{ gap: 12, marginBottom: 20 }}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
        />
        <Button label="Sign up with email" onPress={handleEmailSignUp} loading={loading} />
      </View>

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={theme.dark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={16}
          style={styles.appleButton}
          onPress={handleAppleSignUp}
        />
      )}

      <Button label="Continue with Google" onPress={handleGoogleSignUp} variant="secondary" loading={loading} style={{ marginTop: 12 }} />

      <View style={{ marginTop: 24 }}>
        <Checkbox
          checked={agreed}
          onToggle={() => setAgreed((v) => !v)}
          label={
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {SIGNUP_ACKNOWLEDGMENT.split('Terms of Use')[0]}
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }} onPress={() => navigation.getParent()?.navigate('Terms' as never)}>
                Terms of Use
              </Text>
              {' and '}
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }} onPress={() => navigation.getParent()?.navigate('PrivacyPolicy' as never)}>
                Privacy Policy
              </Text>
              , and understand MAXX is not a substitute for professional treatment.
            </Text>
          }
        />
      </View>

      <Button
        label="Already have an account? Sign in"
        onPress={() => navigation.navigate('SignIn')}
        variant="ghost"
        style={{ marginTop: 16 }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 16 },
  appleButton: { height: 52, marginTop: 12 },
});
