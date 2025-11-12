// lib/data/nommoFeatures.ts

export type NommoFeature = {
  slug: string;              // URL-safe identifier
  title: string;             // Display title
  tagline?: string;          // Optional short hook or logline
  description: string;       // Main description text
  status: 'Released' | 'In Production' | 'Coming Soon';
  releaseDate?: string;      // Optional ISO or human-readable date
  trailerUrl?: string;       // YouTube or Vimeo embed URL
  thumbnail?: string;        // Path to poster or thumbnail image
  locationTags?: string[];   // Regions/lands connected to the story
  themeTags?: string[];      // Keywords like “resistance”, “ancestry”, etc.
};

export const nommoFeatures: NommoFeature[] = [
  {
    slug: 'warriors-in-the-garden',
    title: 'Warriors in the Garden',
    tagline: 'Spirit. Resistance. Remembrance.',
    description:
      'A story of spirit, resistance, and remembrance — filmed across the sacred geographies of Turtle Island and Alkebulan. This feature explores the convergence of ancestral memory and present-day activism through art, ritual, and collective healing.',
    status: 'Coming Soon',
    releaseDate: '2025-12-06',
    trailerUrl: 'https://www.youtube.com/embed/YOUR_TRAILER_ID',
    thumbnail: '/images/nommo/warriors-thumb.jpg',
    locationTags: ['Turtle Island', 'Alkebulan'],
    themeTags: ['restorative journalism', 'ancestry', 'resistance', 'spirituality'],
  },
  {
    slug: 'voices-of-the-river',
    title: 'Voices of the River',
    tagline: 'Where water remembers its name.',
    description:
      'An unfolding documentary series centered on the rivers and waters that carry ancestral memory — featuring interviews with healers, elders, and communities restoring sacred relationships with water across continents.',
    status: 'In Production',
    locationTags: ['Zimbabwe', 'Florida', 'South Africa'],
    themeTags: ['water', 'memory', 'ecology', 'ancestral wisdom'],
  },
  {
    slug: 'nommo-dialogues',
    title: 'Nommo Dialogues',
    tagline: 'Conversations of creation and return.',
    description:
      'A filmed dialogue series capturing conversations with artists, thinkers, and elders across the diaspora — exploring technology, ritual, and the living language of creation.',
    status: 'Coming Soon',
    themeTags: ['dialogue', 'diaspora', 'philosophy', 'technology'],
  },
];