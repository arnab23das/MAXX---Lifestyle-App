import { Level } from '@/types/content';

const categoryIds = ['alcohol'];

export const ALCOHOL_LEVELS: Level[] = [
  {
    id: 'alcohol_l1',
    trackId: 'addictions',
    categoryIds,
    order: 1,
    type: 'lesson',
    title: 'Understanding your relationship with alcohol',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'It works on stress, briefly',
          body: 'Alcohol dampens the brain’s stress response for a short window, which is exactly why it feels so relieving after a hard day — and why that relief is easy to start relying on.',
        },
        {
          id: 'c2',
          heading: 'Tolerance creeps up quietly',
          body: 'The amount that once felt relaxing stops working over time, often leading to drinking more to get the same effect. Noticing that shift early matters.',
        },
        {
          id: 'c3',
          heading: 'Cutting back counts',
          body: 'You don’t have to frame this as all-or-nothing. Drinking less, drinking less often, or quitting entirely are all valid goals — this path adapts to yours.',
        },
      ],
      checkQuestion: {
        prompt: 'What tends to happen with tolerance over time?',
        options: ['The same amount keeps having the same effect', 'You need more to get the same effect', 'Tolerance has no effect on drinking habits'],
        correctIndex: 1,
      },
    },
  },
  {
    id: 'alcohol_l2',
    trackId: 'addictions',
    categoryIds,
    order: 2,
    type: 'exercise',
    title: 'Delay the first drink',
    estimatedMinutes: 6,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'A short reset for the moment you reach for a drink out of habit rather than choice.',
      steps: [
        { kind: 'text', id: 's1', prompt: 'Pause and ask: "Do I actually want this, or is it just the time of day?"', durationSeconds: 15 },
        { kind: 'breathing', id: 's2', prompt: 'Slow your system down before deciding.', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6, cycles: 4 },
        { kind: 'choice', id: 's3', prompt: 'If you decide to wait, what will you drink instead for now?', options: ['Sparkling water with lime', 'A non-alcoholic beer/mocktail', 'Tea', 'Just water'] },
      ],
    },
  },
  {
    id: 'alcohol_l3',
    trackId: 'addictions',
    categoryIds,
    order: 3,
    type: 'lesson',
    title: 'Social situations without the pressure',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Have a line ready',
          body: 'A simple, confident reason ("I’m driving" / "taking a break from it") ends most conversations quickly. You don’t owe anyone a full explanation.',
        },
        {
          id: 'c2',
          heading: 'Hold something',
          body: 'A drink in hand — alcoholic or not — removes a lot of the "why aren’t you drinking?" attention. Order something that looks the part if that helps.',
        },
        {
          id: 'c3',
          heading: 'Choose your rooms',
          body: 'It’s okay to skip events built entirely around heavy drinking, especially early on. Protecting your progress isn’t antisocial — it’s prioritizing what matters right now.',
        },
      ],
    },
  },
  {
    id: 'alcohol_l4',
    trackId: 'addictions',
    categoryIds,
    order: 4,
    type: 'exercise',
    title: 'Prep for your next social event',
    estimatedMinutes: 7,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'Get a plan ready before you need it.',
      steps: [
        { kind: 'choice', id: 's1', prompt: 'Pick your go-to line for declining a drink:', options: ['"I\'m driving tonight"', '"Taking a break from it"', '"Not tonight, thanks"', '"I have an early morning"'] },
        { kind: 'choice', id: 's2', prompt: 'What will you order/hold instead?', options: ['Soda with lime', 'Mocktail', 'Sparkling water', 'Coffee or tea'] },
        { kind: 'text', id: 's3', prompt: 'Name one upcoming event where you’ll try this.', durationSeconds: 20 },
      ],
    },
  },
  {
    id: 'alcohol_l5',
    trackId: 'addictions',
    categoryIds,
    order: 5,
    type: 'documentation',
    title: 'Log today’s drinking patterns',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'documentation',
      intro: 'An honest snapshot, just for you unless you choose to share it.',
      prompts: [
        { id: 'p1', label: 'How are you feeling today?', kind: 'mood_scale' },
        { id: 'p2', label: 'How strong were your urges to drink today?', kind: 'craving_scale' },
        { id: 'p3', label: 'Any wins today?', kind: 'win_tag_multiselect', options: ['Delayed or skipped a drink', 'Used a non-alcoholic swap', 'Navigated a social event', 'Alcohol-free day'] },
        { id: 'p4', label: 'Anything else on your mind?', kind: 'free_text' },
      ],
    },
  },
];
