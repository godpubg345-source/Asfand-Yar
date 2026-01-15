export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  data: string; // Base64
  prompt: string;
  styleName: string;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR'
}

export enum DesignStyle {
  MODERN = 'Modern',
  MINIMALIST = 'Minimalist',
  BOHEMIAN = 'Bohemian',
  INDUSTRIAL = 'Industrial',
  SCANDINAVIAN = 'Scandinavian',
  MID_CENTURY = 'Mid-Century Modern',
  ART_DECO = 'Art Deco',
  COASTAL = 'Coastal'
}
