export type TransmissionStatus =
  | "draft"
  | "live"
  | "archived";

export interface Transmission {
  id: string;
  registry: string;
  title: string;
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
    location: "Western Cape",
    date: "Feb 2",
    status: "live",
    abstract:
      "Opening ritual sequence capturing invocation and field alignment.",
    image: "/mainstream/langa_Jan_26.jpg",
  },
];