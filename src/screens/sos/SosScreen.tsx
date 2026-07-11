import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme';
import { RootStackParamList } from '@/navigation/types';
import { SOS_AFFIRMATIONS, SOS_EXERCISES, SosExercise } from '@/content/sosContent';
import { getCrisisResourcesForRegion } from '@/content/crisisResources';
import { BreathingTimer } from '@/components/BreathingTimer';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { EmergencyContact } from '@/types/domain';
import { getMyEmergencyContacts, addEmergencyContact, createSosBroadcast } from '@/api/sos';

type Props = NativeStackScreenProps<RootStackParamList, 'Sos'>;

function callNumber(phone: string) {
  if (!phone) return;
  Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
}

export function SosScreen({ navigation }: Props) {
  const theme = useTheme();
  const session = useAuthStore((s) => s.session);
  const profile = useAppStore((s) => s.profile);
  const affirmation = useMemo(() => SOS_AFFIRMATIONS[Math.floor(Math.random() * SOS_AFFIRMATIONS.length)], []);
  const crisisResources = useMemo(() => getCrisisResourcesForRegion(profile?.region ?? null), [profile?.region]);

  const [activeExercise, setActiveExercise] = useState<SosExercise | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    if (session?.user) {
      getMyEmergencyContacts(session.user.id).then(setContacts).catch(() => {});
    }
  }, [session?.user]);

  async function handleAddContact() {
    if (!session?.user || !newName.trim() || !newPhone.trim()) return;
    const created = await addEmergencyContact(session.user.id, newName.trim(), newPhone.trim());
    setContacts((prev) => [...prev, { id: created.id, userId: created.user_id, name: created.name, phone: created.phone, relationship: created.relationship }]);
    setNewName('');
    setNewPhone('');
  }

  async function handleBroadcast() {
    if (!session?.user) return;
    if (!profile?.region) {
      Alert.alert('Set your region first', 'Local broadcast needs a region set in Community settings.');
      return;
    }
    setBroadcasting(true);
    try {
      await createSosBroadcast(session.user.id, profile.region, 'I could use some support right now.');
      setBroadcastSent(true);
    } catch (err: any) {
      Alert.alert('Couldn’t send', err.message ?? 'Please try again.');
    } finally {
      setBroadcasting(false);
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
            <Pressable
              key={resource.label}
              onPress={() => callNumber(resource.phone)}
              disabled={!resource.phone}
              style={[styles.crisisButton, { backgroundColor: theme.colors.sos, opacity: resource.phone ? 1 : 0.5 }]}
            >
              <Text style={styles.crisisButtonText}>{resource.phone ? `Call ${resource.label} (${resource.phone})` : resource.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 1. Immediate affirmation */}
      <View style={[styles.card, { backgroundColor: theme.colors.primarySoft }]}>
        <Text style={[theme.typography.h2, { color: theme.colors.textPrimary }]}>{affirmation}</Text>
      </View>

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
          {SOS_EXERCISES.map((exercise) => (
            <Pressable
              key={exercise.id}
              onPress={() => setActiveExercise(exercise)}
              style={[styles.exerciseRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            >
              <Text style={[theme.typography.bodyStrong, { color: theme.colors.textPrimary }]}>{exercise.label}</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{exercise.description}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* 3. Emergency contacts */}
      <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginTop: 28, marginBottom: 12 }]}>
        Your emergency contacts
      </Text>
      <View style={{ gap: 8 }}>
        {contacts.map((c) => (
          <Pressable key={c.id} onPress={() => callNumber(c.phone)} style={[styles.contactRow, { borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>{c.name}</Text>
            <Text style={{ color: theme.colors.primary }}>Call {c.phone}</Text>
          </Pressable>
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
      <Button
        label={broadcastSent ? 'Support request sent' : 'I need support — notify my local community'}
        onPress={handleBroadcast}
        loading={broadcasting}
        disabled={broadcastSent}
        variant="secondary"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1.5, borderRadius: 18, padding: 16, marginBottom: 20 },
  crisisRow: { gap: 8 },
  crisisButton: { padding: 12, borderRadius: 12, alignItems: 'center' },
  crisisButtonText: { color: 'white', fontWeight: '700' },
  card: { borderRadius: 18, padding: 18 },
  exerciseRow: { borderWidth: 1, borderRadius: 14, padding: 14 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12 },
  addContactRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10 },
});
