import { HabitCategory } from '@/types/content';

// Personalization checklist for the Addictions track (spec §3.3).
export const ADDICTION_CATEGORIES: HabitCategory[] = [
  {
    id: 'doomscrolling',
    trackId: 'addictions',
    label: 'Doomscrolling',
    description: 'Short-form content, brainrot feeds, endless scrolling',
    icon: 'phone',
  },
  {
    id: 'food',
    trackId: 'addictions',
    label: 'Food habits',
    description: 'Binge eating, sugar, emotional eating',
    icon: 'food-apple',
  },
  {
    id: 'vaping',
    trackId: 'addictions',
    label: 'Vaping',
    description: 'E-cigarettes and vape pens',
    icon: 'smoke',
  },
  {
    id: 'smoking',
    trackId: 'addictions',
    label: 'Smoking',
    description: 'Cigarettes and tobacco',
    icon: 'smoking',
  },
  {
    id: 'alcohol',
    trackId: 'addictions',
    label: 'Alcohol',
    description: 'Drinking less, or quitting altogether',
    icon: 'bottle-wine',
  },
  {
    id: 'drugs',
    trackId: 'addictions',
    label: 'Drugs',
    description: 'Recreational or prescription substance use',
    icon: 'pill',
  },
];
