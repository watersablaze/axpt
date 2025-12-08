// src/lib/live/events.ts

export type LiveEvent = {
  slug: string;
  title: string;
  series?: string;
  tagline?: string;
  startsAt?: string;
  offlineImage?: string;
  locations?: string[];
  hosts?: string[];
  description?: string;
};

// Temporary manual registry until CMS
export const LIVE_EVENTS: LiveEvent[] = [
  {
    slug: 'matriarch-monday-warriors-in-the-garden',
    title: 'Matriarch Monday: Warriors in the Garden',
    series: 'Matriarch Monday',
    tagline: 'Intergenerational strategy between Florida and Cape Town.',
    startsAt: '2025-12-08T19:00:00+02:00',
    offlineImage: '/live/matriarch-monday.png',
    locations: ['North Florida', 'Cape Town Townships'],
    hosts: ['Ma’yá', 'Revolutionary Elder', 'Youth Collective', 'Co-host'],
    description:
      'A transatlantic conversation on care, resistance, and everyday strategy.',
  },
];

export function getCurrentEvent(): LiveEvent | null {
  return LIVE_EVENTS[0]; // later: find by date or slug
}