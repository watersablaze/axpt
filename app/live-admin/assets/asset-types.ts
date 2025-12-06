export interface AssetMeta {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'overlay' | 'font' | 'other';
  createdAt: string;
  size?: number;
}