
export enum ImageModel {
  STANDARD = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview',
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type ImageSize = '1K' | '2K' | '4K';

export interface InputImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

export interface ImageSettings {
  prompt: string;
  model: ImageModel;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  useSearch: boolean;
  inputImage?: InputImage | null;
}

export interface HistoryItem {
  id: string;
  src: string;
  prompt: string;
}
