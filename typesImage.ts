
export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16';

export type VisualStyle = 'Cinematic' | 'Abstract Art' | 'Oil Painting' | 'Minimalist' | 'Fantasy' | 'Dark Noir';

export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    title: string;
    subtitle: string;
    aspectRatio: AspectRatio;
    visualStyle: VisualStyle;
    timestamp: number;
}

export interface GenerationState {
    isGenerating: boolean;
    error: string | null;
    currentImage: GeneratedImage | null;
    history: GeneratedImage[];
}
