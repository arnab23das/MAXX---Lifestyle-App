import { Level } from '@/types/content';

const categoryIds = ['smoking'];

export const SMOKING_LEVELS: Level[] = [
  {
    id: 'smoking_l1',
    trackId: 'addictions',
    categoryIds,
    order: 1,
    type: 'lesson',
    title: 'The habit behind the habit',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Two addictions in one',
          body: 'Smoking is both a chemical dependence (nicotine) and a behavioral ritual (the break, the hand-to-mouth motion, the exhale). Quitting well means addressing both, not just one.',
        },
        {
          id: 'c2',
          heading: 'Your body starts healing fast',
          body: 'Within 20 minutes of your last cigarette, heart rate starts to drop. Within 12 hours, carbon monoxide levels in your blood normalize. The payoff starts almost immediately.',
        },
        {
          id: 'c3',
          heading: 'Most quits take a few tries',
          body: 'Relapse is common and doesn’t mean failure — it means you’re learning your triggers. Each attempt makes the next one more informed.',
        },
      ],
      checkQuestion: {
        prompt: 'Smoking is best understood as:',
        options: ['Only a chemical dependence', 'Only a behavioral ritual', 'Both a chemical dependence and a ritual'],
        correctIndex: 2,
      },
    },
  },
  {
    id: 'smoking_l2',
    trackId: 'addictions',
    categoryIds,
    order: 2,
    type: 'exercise',
    title: 'Replace the ritual',
    estimatedMinutes: 6,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'A breathing exercise that mimics the "break" ritual without the cigarette.',
      steps: [
        { kind: 'text', id: 's1', prompt: 'Step outside or away from your desk, just like a smoke break — minus the smoke.', durationSeconds: 15 },
        { kind: 'breathing', id: 's2', prompt: 'Slow, deliberate breaths, like a long drag and exhale.', inhaleSeconds: 5, holdSeconds: 2, exhaleSeconds: 6, cycles: 5 },
        { kind: 'choice', id: 's3', prompt: 'What will you hold in your hand instead?', options: ['A pen or fidget toy', 'A cup of tea or coffee', 'A stress ball', 'Nothing — hands in pockets'] },
      ],
    },
  },
  {
    id: 'smoking_l3',
    trackId: 'addictions',
    categoryIds,
    order: 3,
    type: 'lesson',
    title: 'Handling the hardest hours',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Mornings and after meals are peak risk',
          body: 'For most smokers, the first cigarette of the day and the one after eating are the most automatic. Plan a specific alternative for exactly these two moments.',
        },
        {
          id: 'c2',
          heading: 'Alcohol lowers your guard',
          body: 'Drinking is one of the most common relapse triggers for people quitting smoking. If you’re early in quitting, consider cutting back on drinking too, at least for a few weeks.',
        },
        {
          id: 'c3',
          heading: 'Delay, don’t deny',
          body: 'Instead of "never again," try "not for the next 10 minutes." It’s a lower-pressure promise, and it usually outlasts the craving.',
        },
      ],
    },
  },
  {
    id: 'smoking_l4',
    trackId: 'addictions',
    categoryIds,
    order: 4,
    type: 'exercise',
    title: 'Plan your two riskiest moments',
    estimatedMinutes: 7,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'Get ahead of your highest-risk moments today.',
      steps: [
        { kind: 'choice', id: 's1', prompt: 'What’s your highest-risk moment?', options: ['First thing in the morning', 'Right after a meal', 'With coffee', 'When drinking alcohol'] },
        { kind: 'choice', id: 's2', prompt: 'What will you do instead in that moment?', options: ['Brush teeth right away', 'Go for a short walk', 'Chew gum', 'Call or text someone'] },
        { kind: 'text', id: 's3', prompt: 'Say your plan out loud: "When [trigger] happens, I will [replacement]."', durationSeconds: 20 },
      ],
    },
  },
  {
    id: 'smoking_l5',
    trackId: 'addictions',
    categoryIds,
    order: 5,
    type: 'documentation',
    title: 'Log today’s smoke-free progress',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'documentation',
      intro: 'However today went, write it down honestly.',
      prompts: [
        { id: 'p1', label: 'How are you feeling today?', kind: 'mood_scale' },
        { id: 'p2', label: 'How strong were your cravings today?', kind: 'craving_scale' },
        { id: 'p3', label: 'Any wins today?', kind: 'win_tag_multiselect', options: ['Handled a risky moment', 'Used a replacement ritual', 'Went smoke-free today', 'Reached out for support'] },
        { id: 'p4', label: 'Anything else on your mind?', kind: 'free_text' },
      ],
    },
  },
];
