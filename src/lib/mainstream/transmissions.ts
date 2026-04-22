export type TransmissionStatus =
  | "draft"
  | "live"
  | "archived";

export interface Transmission {
  id: string;
  registry: string;
  title: string;
  channel: string;
  location: string;
  date: string;
  status: TransmissionStatus;
  abstract: string;
  image: string;
  video?: string;
  pinned?: boolean;
}

export const transmissions: Transmission[] = [
  {
    id: "ms-0000",
    registry: "MS-0000",
    title: "Nommo Media — Field Transmission",
    channel: "Nommo Media",
    location: "Langa",
    date: "Jan 26",
    status: "archived",
    abstract:
      "An early evening field transmission capturing community presence, landscape memory, and spontaneous cultural congregation.",
    image: "/mainstream/langa_Jan_26.jpg",
    video: "/videos/bushman_ceremony_start.mp4",
    pinned: true,
  },
  {
    id: "ms-0001",
    registry: "MS-0001",
    title: "Bushman Ceremony — Opening",
    channel: "Field Record",
    location: "Western Cape",
    date: "Feb 2",
    status: "live",
    abstract:
      "Opening ritual sequence capturing invocation and field alignment.",
    image: "/mainstream/langa_Jan_26.jpg",
    video: "/videos/bushman_ceremony_start.mp4",
  },
  {
    id: "ms-0002",
    registry: "MS-0002",
    title: "Symposium Broadcast — Threshold Session",
    channel: "Symposium",
    location: "Cape Town",
    date: "Apr 18",
    status: "draft",
    abstract:
      "Scheduled discussion sequence mapping strategic themes, witness accounts, and ceremonial framing before publication.",
    image: "/mainstream/langa_Jan_26.jpg",
  },
];

export interface MainstreamChannel {
  slug: string;
  name: string;
  description: string;
}

export const mainstreamChannels: MainstreamChannel[] = [
  {
    slug: "nommo-media",
    name: "Nommo Media",
    description: "Flagship transmission program and long-form cultural signal.",
  },
  {
    slug: "field-record",
    name: "Field Record",
    description: "On-location documentation from community, ritual, and landscape.",
  },
  {
    slug: "symposium",
    name: "Symposium",
    description: "Strategic and cultural gathering broadcasts prepared for release.",
  },
  {
    slug: "archive",
    name: "Archive",
    description: "Published records retained as institutional memory.",
  },
];
