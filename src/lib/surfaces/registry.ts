import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { LayerName } from "@/types/layers";

const OriginSurface = dynamic(() => import("@/components/surfaces/OriginSurface"));
const FoundationSurface = dynamic(() => import("@/components/surfaces/FoundationSurface"));
const FrameworkSurface = dynamic(() => import("@/components/surfaces/FrameworkSurface"));
const InterfacesSurface = dynamic(() => import("@/components/surfaces/InterfacesSurface"));
const EthosSurface = dynamic(() => import("@/components/surfaces/EthosSurface"));
const PresenceSurface = dynamic(() => import("@/components/surfaces/PresenceSurface"));

export type SurfaceDefinition = {
  id: string;
  layer: LayerName;
  title: string;
  description?: string;
  ariaLabel?: string;
  order: number;
  component: ComponentType<any>;
};

const SURFACE_REGISTRY = [
  {
    id: "origin",
    layer: "ENTRY",
    title: "Origin",
    description: "Genesis of the AXPT architecture",
    ariaLabel: "Entry Layer",
    order: 1,
    component: OriginSurface,
  },
  {
    id: "foundation",
    layer: "FOUNDATION",
    title: "Foundation",
    description: "Institutional continuity layer",
    ariaLabel: "Foundation Layer",
    order: 2,
    component: FoundationSurface,
  },
  {
    id: "framework",
    layer: "FRAMEWORK",
    title: "Framework",
    description: "Operational architecture",
    ariaLabel: "Framework Layer",
    order: 3,
    component: FrameworkSurface,
  },
  {
    id: "interfaces",
    layer: "INTERFACES",
    title: "Interfaces",
    description: "Public interaction layer",
    ariaLabel: "Interfaces Layer",
    order: 4,
    component: InterfacesSurface,
  },
  {
    id: "ethos",
    layer: "ETHOS",
    title: "Ethos",
    description: "Cultural and ethical architecture",
    ariaLabel: "Institutional Ethos",
    order: 5,
    component: EthosSurface,
  },
  {
    id: "presence",
    layer: "PRESENCE",
    title: "Presence",
    description: "Living system presence",
    ariaLabel: "Presence Layer",
    order: 6,
    component: PresenceSurface,
  },
] satisfies SurfaceDefinition[];

export const SURFACES: SurfaceDefinition[] = [...SURFACE_REGISTRY].sort(
  (a, b) => a.order - b.order
);

export type SurfaceId = SurfaceDefinition["id"];
export const SURFACE_IDS = SURFACES.map((s) => s.id);