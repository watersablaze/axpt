export interface OverlayConfig {
  id: string;
  name: string;
  type: 'lower-third' | 'logo' | 'chat' | 'watermark' | 'frame';
  props: Record<string, any>;
}