// Lightweight client-side pre-filter for objectionable content (spec §6:
// Apple requires UGC apps to filter objectionable content, not just report
// it after the fact). This is a first line of defense, not a full trust &
// safety system — combine with reports + auto-hide-at-threshold (see
// migration 0001_init.sql) and human moderation of the `reports` table.

const BLOCKED_TERMS: string[] = [
  // Slurs and explicit hate terms are intentionally not enumerated in this
  // source file; wire this list up to a hosted moderation list or a
  // moderation API (e.g. OpenAI/Perspective/AWS Comprehend) before launch.
];

export interface FilterResult {
  allowed: boolean;
  reason?: string;
}

export function checkPostText(text: string): FilterResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { allowed: false, reason: 'Post can’t be empty.' };
  }
  if (trimmed.length > 1000) {
    return { allowed: false, reason: 'Post is too long (max 1000 characters).' };
  }
  const lower = trimmed.toLowerCase();
  for (const term of BLOCKED_TERMS) {
    if (lower.includes(term)) {
      return { allowed: false, reason: 'This post contains language that isn’t allowed in the MAXX community.' };
    }
  }
  // Basic personal-contact-info guard: discourage sharing phone numbers in
  // public posts (private support belongs in SOS emergency contacts, not
  // the public feed).
  const phonePattern = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  if (phonePattern.test(trimmed)) {
    return { allowed: false, reason: 'For your safety, please don’t post phone numbers publicly.' };
  }
  return { allowed: true };
}
