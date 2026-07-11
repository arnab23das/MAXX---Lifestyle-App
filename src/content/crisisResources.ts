import { CrisisResource } from '@/types/domain';

// Region-appropriate professional crisis resources, always shown first and
// one tap away on the SOS screen (spec §7 safety design — non-negotiable).
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    region: 'US',
    label: 'Suicide & Crisis Lifeline',
    phone: '988',
    sms: '988',
    description: 'Free, confidential support 24/7 for anyone in the US in emotional distress or crisis.',
  },
  {
    region: 'US',
    label: 'Emergency services',
    phone: '911',
    description: 'Call for any medical emergency or immediate danger.',
  },
  {
    region: 'US',
    label: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    description: 'Free, confidential treatment referral and information service for substance use and mental health, 24/7.',
  },
  {
    region: 'UK',
    label: 'Samaritans',
    phone: '116 123',
    description: 'Free, 24/7 confidential emotional support in the UK and Ireland.',
  },
  {
    region: 'UK',
    label: 'Emergency services',
    phone: '999',
    description: 'Call for any medical emergency or immediate danger.',
  },
  {
    region: 'CA',
    label: 'Talk Suicide Canada',
    phone: '988',
    description: 'Free, 24/7 crisis support across Canada.',
  },
  {
    region: 'CA',
    label: 'Emergency services',
    phone: '911',
    description: 'Call for any medical emergency or immediate danger.',
  },
  {
    region: 'AU',
    label: 'Lifeline Australia',
    phone: '13 11 14',
    description: 'Free, 24/7 crisis support and suicide prevention in Australia.',
  },
  {
    region: 'AU',
    label: 'Emergency services',
    phone: '000',
    description: 'Call for any medical emergency or immediate danger.',
  },
  {
    region: 'INTL',
    label: 'Find a helpline (international)',
    phone: '',
    description: 'If your region isn’t listed, findahelpline.com lists crisis lines for over 130 countries.',
  },
];

export function getCrisisResourcesForRegion(region: string | null): CrisisResource[] {
  const code = (region ?? '').toUpperCase();
  const regional = CRISIS_RESOURCES.filter((r) => r.region === code);
  const intl = CRISIS_RESOURCES.filter((r) => r.region === 'INTL');
  return regional.length > 0 ? [...regional, ...intl] : [...CRISIS_RESOURCES.filter((r) => r.region === 'US'), ...intl];
}
