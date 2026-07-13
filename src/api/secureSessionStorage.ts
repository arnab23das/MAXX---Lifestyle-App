import * as SecureStore from 'expo-secure-store';

// Supabase's session (access + refresh token, expiry, user metadata) is
// sensitive and was previously stored in plain AsyncStorage, which on native
// is unencrypted (a plist on iOS, an unencrypted SharedPreferences-backed
// store on Android) — anyone with filesystem access to the device (a stolen/
// unlocked phone, a malicious app with storage access on rooted/jailbroken
// devices) could read it directly. This adapter swaps that for the platform
// keychain/keystore via expo-secure-store instead.
//
// SecureStore has a per-value size limit on Android (backed by
// EncryptedSharedPreferences), and Supabase's serialized session can exceed
// it — so values are transparently split across multiple keys rather than
// trusting a single SecureStore.setItemAsync call to hold the whole session.
const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = '__chunks';

async function setChunked(key: string, value: string): Promise<void> {
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(chunks.length));
  await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}__${i}`, chunk)));
}

async function getChunked(key: string): Promise<string | null> {
  const countStr = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  if (countStr === null) return null;
  const count = parseInt(countStr, 10);
  const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}__${i}`)));
  if (parts.some((p) => p === null)) return null;
  return parts.join('');
}

async function removeChunked(key: string): Promise<void> {
  const countStr = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  if (countStr === null) return;
  const count = parseInt(countStr, 10);
  await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}__${i}`)));
  await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
}

/** Matches Supabase JS's `SupportedStorage` interface (same shape as AsyncStorage). */
export const secureSessionStorage = {
  getItem: getChunked,
  setItem: setChunked,
  removeItem: removeChunked,
};
