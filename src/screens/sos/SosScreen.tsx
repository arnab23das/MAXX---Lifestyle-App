import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { useTheme } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { SOS_AFFIRMATIONS, SOS_EXERCISES, SosExercise } from '@/content/sosContent';
import { getCrisisResourcesForRegion } from '@/content/crisisResources';
import { BreathingTimer } from '@/components/BreathingTimer';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { EmergencyContact, SosBroadcast } from '@/types/domain';
import {
  getMyEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  createSosBroadcast,
  deactivateSosBroadcast,
  getOtherActiveLocalBroadcasts,
  sendBroadcastReply,
} from '@/api/sos';

type Props = NativeStackScreenProps<RootStackParamList, 'Sos'>;

function callNumber(phone: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
}

export function SosScreen({ navigation }: Props) {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const isDemo = useAppStore((s) => s.isDemo);
  const affirmation = useMemo(() => SOS_AFFIRMATIONS[Math.floor(Math.random() * SOS_AFFIRMATIONS.length)], []);
  const crisisResources = useMemo(() => getCrisisResourcesForRegion(profile?.region ?? null), [profile?.region]);
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });

  const [activeExercise, setActiveExercise] = useState<SosExercise | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [myBroadcast, setMyBroadcast] = useState<SosBroadcast | null>(null);
  const [nearby, setNearby] = useState<(SosBroadcast & { authorDisplayName: string })[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendingReplyTo, setSendingReplyTo] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      getMyEmergencyContacts(session.user.id).then(setContacts).catch(() => {});
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user && profile?.region) {
      getOtherActiveLocalBroadcasts(profile.region, session.user.id).then(setNearby).catch(() => {});
    }
  }, [session?.user, profile?.region]);

  async function handleAddContact() {
    if (!newName.trim() || !newPhone.trim()) return;
    if (isDemo) {
      setContacts((prev) => [...prev, { id: `demo-${Date.now()}`, userId: 'demo-user', name: newName.trim(), phone: newPhone.trim(), relationship: null }]);
      setNewName('');
      setNewPhone('');
      return;
    }
    if (!session?.user) return;
    const created = await addEmergencyContact(session.user.id, newName.trim(), newPhone.trim());
    setContacts((prev) => [...prev, { id: created.id, userId: created.user_id, name: created.name, phone: created.phone, relationship: created.relationship }]);
    setNewName('');
    setNewPhone('');
  }

  async function handleRemoveContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (isDemo) return;
    try {
      await removeEmergencyContact(id);
    } catch {
      // reload from server if the delete failed, so state doesn't drift
      if (session?.user) getMyEmergencyContacts(session.user.id).then(setContacts).catch(() => {});
    }
  }

  async function handleBroadcast() {
    if (!profile?.region) {
      Alert.alert('Set your region first', 'Local broadcast needs a region set in Community settings.');
      return;
    }
    if (isDemo) {
      setMyBroadcast({ id: 'demo-broadcast', userId: 'demo-user', region: profile.region, createdAt: new Date().toISOString(), message: null, active: true });
      return;
    }
    if (!session?.user) return;
    setBroadcasting(true);
    try {
      const broadcast = await createSosBroadcast(
        session.user.id,
        profile.displayName,
        profile.region,
        'I could use some support right now.'
      );
      setMyBroadcast(broadcast);
    } catch (err: any) {
      Alert.alert('Couldn’t send', err.message ?? 'Please try again.');
    } finally {
      setBroadcasting(false);
    }
  }

  async function handleCancelBroadcast() {
    if (!myBroadcast) return;
    const id = myBroadcast.id;
    setMyBroadcast(null);
    if (isDemo) return;
    try {
      await deactivateSosBroadcast(id);
    } catch {
      // non-critical if this fails silently; broadcast will age out on its own
    }
  }

  async function handleSendReply(broadcast: SosBroadcast) {
    if (!session?.user) return;
    const message = (replyDrafts[broadcast.id] ?? 'Sending you strength 💛 you’ve got this.').trim();
    if (!message) return;
    setSendingReplyTo(broadcast.id);
    try {
      await sendBroadcastReply(broadcast.id, session.user.id, profile?.displayName ?? 'A MAXX user', message);
      setNearby((prev) => prev.filter((b) => b.id !== broadcast.id));
      setReplyDrafts((prev) => ({ ...prev, [broadcast.id]: '' }));
    } catch (err: any) {
      Alert.alert('Couldn’t send', err.message ?? 'Please try again.');
    } finally {
      setSendingReplyTo(null);
    }
  }

  return (
    <ScreenContainer scroll>
      {/* Crisis safety banner — always visible, one tap away (spec §7 safety design, non-negotiable). */}
      <View style={[styles.banner, { backgroundColor: theme.colors.sosSoft, borderColor: theme.colors.sos }]}>
        <Text style={[theme.typography.bodyStrong, { color: theme.colors.sos, marginBottom: 8 }]}>
          If you’re in danger or having a medical emergency, call your local emergency number now.
        </Text>
        <View style={styles.crisisRow}>
          {crisisResources.slice(0, 2).map((resource) => (
            <AnimatedPressable
              key={resource.label}
              onPress={() => callNumber(resource.phone)}
              disabled={!resource.phone}
              style={[styles.crisisButton, { backgroundColor: theme.colors.sos, opacity: resource.phone ? 1 : 0.5 }]}
            >
              <Text style={styles.crisisButtonText}>{resource.phone ? `Call ${resource.label} (${resource.phone})` : resource.label}</Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      {/* 1. Immediate affirmation */}
      <Animated.View style={[styles.card, { backgroundColor: theme.colors.primarySoft, transform: [{ scale: breatheScale }] }]}>
        <Text style={[theme.typography.h2, { color: theme.colors.textPrimary }]}>{affirmation}</Text>
      </Animated.View>

      {/* 2. Emergency exercises */}
      <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
        Something to do right now
      </Text>
      {activeExercise ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary, marginBottom: 8 }]}>{activeExercise.label}</Text>
          {activeExercise.breathing ? (
            <BreathingTimer {...activeExercise.breathing} onComplete={() => {}} />
          ) : (
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{activeExercise.description}</Text>
          )}
          <Button label="Done" onPress={() => setActiveExercise(null)} variant="ghost" />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {SOS_EXERCISES.map((exercise, i) => (
            <FadeSlideIn key={exercise.id} index={i}>
              <AnimatedPressable
                onPress={() => setActiveExercise(exercise)}
                style={[styles.exerciseRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              >
                <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>{exercise.label}</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{exercise.description}</Text>
              </AnimatedPressable>
            </FadeSlideIn>
          ))}
        </View>
      )}

      {/* 3. Emergency contacts */}
      <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginTop: 28, marginBottom: 12 }]}>
        Your emergency contacts
      </Text>
      <View style={{ gap: 8 }}>
        {contacts.map((c) => (
          <View key={c.id} style={[styles.contactRow, { borderColor: theme.colors.border }]}>
            <Pressable onPress={() => callNumber(c.phone)} style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>{c.name}</Text>
              <Text style={{ color: theme.colors.primary }}>Call {c.phone}</Text>
            </Pressable>
            <Pressable onPress={() => handleRemoveContact(c.id)} hitSlop={10}>
              <Text style={{ color: theme.colors.textSecondary }}>Remove</Text>
            </Pressable>
          </View>
        ))}
        {contacts.length === 0 && (
          <Text style={{ color: theme.colors.textSecondary }}>You haven’t added any emergency contacts yet.</Text>
        )}
        <View style={styles.addContactRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Name"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.smallInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          />
          <TextInput
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="Phone"
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.smallInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
          />
        </View>
        <Button label="Add contact" onPress={handleAddContact} variant="secondary" disabled={!newName.trim() || !newPhone.trim()} />
      </View>

      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12 }]}>
        More crisis resources: {crisisResources.map((r) => (r.phone ? `${r.label} (${r.phone})` : r.label)).join(' · ')}
      </Text>

      {/* 4. Broadcast to local community */}
      <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginTop: 28, marginBottom: 8 }]}>
        Reach your local community
      </Text>
      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
        This is a peer support option, not a replacement for the resources above — a peer may not respond right away.
      </Text>
      {myBroadcast ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.textSecondary }}>Your local community has been notified.</Text>
          <Button label="Cancel request" onPress={handleCancelBroadcast} variant="ghost" />
        </View>
      ) : (
        <Button label="I need support — notify my local community" onPress={handleBroadcast} loading={broadcasting} variant="secondary" />
      )}

      {nearby.length > 0 && (
        <View style={{ marginTop: 28 }}>
          <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginBottom: 4 }]}>Nearby, right now</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
            Others in your community could use a word of support.
          </Text>
          <View style={{ gap: 10 }}>
            {nearby.map((broadcast) => (
              <View key={broadcast.id} style={[styles.exerciseRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>{broadcast.authorDisplayName} needs support</Text>
                <TextInput
                  value={replyDrafts[broadcast.id] ?? ''}
                  onChangeText={(text) => setReplyDrafts((prev) => ({ ...prev, [broadcast.id]: text }))}
                  placeholder="Sending you strength 💛 you've got this."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.smallInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, marginTop: 8 }]}
                />
                <Button
                  label="Send support"
                  onPress={() => handleSendReply(broadcast)}
                  loading={sendingReplyTo === broadcast.id}
                  variant="ghost"
                  style={{ marginTop: 8 }}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1.5, borderRadius: 18, padding: 16, marginBottom: 20 },
  crisisRow: { gap: 8 },
  crisisButton: { padding: 14, borderRadius: 16, alignItems: 'center' },
  crisisButtonText: { color: 'white', fontWeight: '700' },
  card: { borderRadius: 20, padding: 18 },
  exerciseRow: { borderWidth: 1, borderRadius: 16, padding: 14 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 12 },
  addContactRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10 },
});
