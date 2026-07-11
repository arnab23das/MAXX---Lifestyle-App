import { Level } from '@/types/content';

const categoryIds = ['vaping'];

export const VAPING_LEVELS: Level[] = [
  {
    id: 'vaping_l1',
    trackId: 'addictions',
    categoryIds,
    order: 1,
    type: 'lesson',
    title: 'What nicotine is actually doing',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Fast in, fast out',
          body: 'Vaped nicotine hits your brain in seconds, which is part of why it feels so needed in stressful moments — and why withdrawal (irritability, restlessness) can show up quickly too.',
        },
        {
          id: 'c2',
          heading: 'It’s a loop, not a flaw',
          body: 'Nicotine creates real physical dependence. Craving it isn’t a sign of weak willpower — it’s your body reacting to a substance built to be habit-forming.',
        },
        {
          id: 'c3',
          heading: 'Cravings are short',
          body: 'Most nicotine cravings peak and fade within 3-5 minutes. Having something to do for those few minutes is often the whole game.',
        },
      ],
      checkQuestion: {
        prompt: 'About how long does a typical nicotine craving peak last?',
        options: ['3-5 minutes', '2-3 hours', 'All day'],
        correctIndex: 0,
      },
    },
  },
  {
    id: 'vaping_l2',
    trackId: 'addictions',
    categoryIds,
    order: 2,
    type: 'exercise',
    title: 'The 4-minute reset',
    estimatedMinutes: 5,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'A breathing routine sized to outlast a typical craving spike.',
      steps: [
        { kind: 'text', id: 's1', prompt: 'Notice the urge. Say to yourself: "This will pass in a few minutes, with or without the vape."', durationSeconds: 10 },
        { kind: 'breathing', id: 's2', prompt: 'Box breathing to occupy your hands and mind.', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 4, cycles: 6 },
        { kind: 'choice', id: 's3', prompt: 'Give your hands/mouth something else to do:', options: ['Chew gum or a mint', 'Hold a cold water bottle', 'Squeeze a stress ball', 'Chew on a straw'] },
      ],
    },
  },
  {
    id: 'vaping_l3',
    trackId: 'addictions',
    categoryIds,
    order: 3,
    type: 'lesson',
    title: 'Know your triggers',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Triggers are predictable',
          body: 'Most vaping happens around a handful of repeat cues: after meals, during stress, driving, drinking, or boredom. Naming yours in advance makes them far easier to catch.',
        },
        {
          id: 'c2',
          heading: 'Change the environment',
          body: 'Remove vapes from your car, desk, and pockets. If it takes more than a few seconds to get one, you buy yourself a decision point.',
        },
        {
          id: 'c3',
          heading: 'Tell one person',
          body: 'People who tell at least one other person they’re quitting are more likely to succeed — accountability plus support beats willpower alone.',
        },
      ],
    },
  },
  {
    id: 'vaping_l4',
    trackId: 'addictions',
    categoryIds,
    order: 4,
    type: 'exercise',
    title: 'Map your top 3 triggers',
    estimatedMinutes: 7,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'Get specific about when you reach for it most.',
      steps: [
        { kind: 'choice', id: 's1', prompt: 'When do you usually vape?', options: ['After meals', 'When stressed', 'Driving', 'Drinking alcohol', 'Bored / idle hands'] },
        { kind: 'choice', id: 's2', prompt: 'Pick one environment change to make today:', options: ['Remove it from my car', 'Remove it from my desk', 'Give it to someone to hold', 'Leave it in another room at home'] },
        { kind: 'text', id: 's3', prompt: 'Name one person you could tell you’re cutting back.', durationSeconds: 20 },
      ],
    },
  },
  {
    id: 'vaping_l5',
    trackId: 'addictions',
    categoryIds,
    order: 5,
    type: 'documentation',
    title: 'Log today’s cravings',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'documentation',
      intro: 'Track how today went — patterns become obvious over a week or two.',
      prompts: [
        { id: 'p1', label: 'How are you feeling overall?', kind: 'mood_scale' },
        { id: 'p2', label: 'How strong were your cravings today?', kind: 'craving_scale' },
        { id: 'p3', label: 'Any wins today?', kind: 'win_tag_multiselect', options: ['Used the 4-minute reset', 'Avoided a trigger', 'Told someone', 'Went vape-free today'] },
        { id: 'p4', label: 'Anything else on your mind?', kind: 'free_text' },
      ],
    },
  },
];
