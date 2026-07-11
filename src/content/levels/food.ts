import { Level } from '@/types/content';

const categoryIds = ['food'];

export const FOOD_LEVELS: Level[] = [
  {
    id: 'food_l1',
    trackId: 'addictions',
    categoryIds,
    order: 1,
    type: 'lesson',
    title: 'Why cravings feel so urgent',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Sugar and stress are linked',
          body: 'Sugary, highly processed food spikes dopamine fast, and many people reach for it most when stressed, tired, or upset — not just when hungry. Recognizing this is the first step to responding differently.',
        },
        {
          id: 'c2',
          heading: 'Restriction backfires',
          body: 'Strict "never again" rules tend to increase the intensity of a craving when it hits. The goal isn’t perfection — it’s noticing patterns and building better defaults.',
        },
        {
          id: 'c3',
          heading: 'A craving is not an emergency',
          body: 'Cravings peak and pass, usually within 10-20 minutes, whether or not you act on them. Riding one out is a skill you can practice.',
        },
      ],
      checkQuestion: {
        prompt: 'What tends to make a craving more intense?',
        options: ['Riding it out for a few minutes', 'Strict all-or-nothing restriction', 'Naming the craving out loud'],
        correctIndex: 1,
      },
    },
  },
  {
    id: 'food_l2',
    trackId: 'addictions',
    categoryIds,
    order: 2,
    type: 'exercise',
    title: 'Ride the wave',
    estimatedMinutes: 6,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'A short exercise for the next time a binge urge hits.',
      steps: [
        { kind: 'text', id: 's1', prompt: 'Rate the urge 1-10 in your head. Cravings are waves — they rise, peak, and fall.', durationSeconds: 15 },
        { kind: 'breathing', id: 's2', prompt: 'Breathe slowly while the wave passes.', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 6, cycles: 4 },
        { kind: 'choice', id: 's3', prompt: 'If you’re still hungry after, choose a grounded next step:', options: ['Drink a glass of water first', 'Have a planned snack, no guilt', 'Wait 10 more minutes, then decide', 'Text someone for support'] },
      ],
    },
  },
  {
    id: 'food_l3',
    trackId: 'addictions',
    categoryIds,
    order: 3,
    type: 'lesson',
    title: 'Swaps that actually stick',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'lesson',
      cards: [
        {
          id: 'c1',
          heading: 'Match the craving, not the calories',
          body: 'A crunchy craving isn’t solved by a soft "healthy" swap. Match texture and intensity — sparkling water for a soda urge, frozen fruit for something cold and sweet.',
        },
        {
          id: 'c2',
          heading: 'Stock the counter, not just the fridge',
          body: 'What’s visible and reachable gets eaten first. Keep one go-to better option in plain sight so it’s the easy choice, not the disciplined one.',
        },
        {
          id: 'c3',
          heading: 'Eat on a rhythm',
          body: 'Skipping meals sets up intense evening cravings. Regular meals with protein keep blood sugar — and willpower — steadier through the day.',
        },
      ],
    },
  },
  {
    id: 'food_l4',
    trackId: 'addictions',
    categoryIds,
    order: 4,
    type: 'exercise',
    title: 'Pick your go-to swap',
    estimatedMinutes: 6,
    xpReward: 25,
    creditReward: 1,
    content: {
      type: 'exercise',
      intro: 'Choose one concrete swap you can keep stocked this week.',
      steps: [
        { kind: 'choice', id: 's1', prompt: 'What do you usually crave most?', options: ['Something sweet', 'Something salty/crunchy', 'Something soft and creamy', 'Something fizzy'] },
        { kind: 'choice', id: 's2', prompt: 'Pick a swap to have ready:', options: ['Frozen fruit or yogurt bites', 'Roasted chickpeas or nuts', 'Greek yogurt with honey', 'Sparkling water with fruit'] },
        { kind: 'text', id: 's3', prompt: 'Write a one-line reminder to buy it this week.', durationSeconds: 20 },
      ],
    },
  },
  {
    id: 'food_l5',
    trackId: 'addictions',
    categoryIds,
    order: 5,
    type: 'documentation',
    title: 'Log today’s eating patterns',
    estimatedMinutes: 5,
    xpReward: 20,
    creditReward: 1,
    content: {
      type: 'documentation',
      intro: 'No judgment here — just an honest snapshot.',
      prompts: [
        { id: 'p1', label: 'How do you feel about your eating today?', kind: 'mood_scale' },
        { id: 'p2', label: 'How strong were your cravings today?', kind: 'craving_scale' },
        { id: 'p3', label: 'Any wins today?', kind: 'win_tag_multiselect', options: ['Rode out a craving', 'Used a swap', 'Ate on a rhythm', 'Asked for support'] },
        { id: 'p4', label: 'Anything else on your mind?', kind: 'free_text' },
      ],
    },
  },
];
