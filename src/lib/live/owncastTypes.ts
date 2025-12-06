// src/lib/live/owncastTypes.ts

// Raw health from your Owncast instance (loosely typed on purpose)
export interface OwncastHealthRaw {
  online?: boolean;
  version?: string;
  serverVersion?: string;
  viewerCount?: number;
  [key: string]: unknown;
}

// Normalized health object we use in the app
export interface OwncastHealth {
  online: boolean;
  version?: string;
  viewerCount?: number;
  updatedAt: string;
  raw?: OwncastHealthRaw;
  error?: string;
}

// A single analytics datapoint for the viewers graph
export interface ViewerAnalyticsPoint {
  timestamp: string;    // ISO date string
  viewers: number;      // # of concurrent viewers at that time
}

// Props for the ViewersGraph component
export interface ViewersGraphProps {
  data: ViewerAnalyticsPoint[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}