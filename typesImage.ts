
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '4:5';

export type VisualStyle =
    | 'Cinematic'
    | 'Photorealistic'
    | 'Anime'
    | 'Oil Painting'
    | 'Cyberpunk'
    | 'Watercolor'
    | 'Sketch'
    | '3D Render'
    | 'Retro';

export interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    aspectRatio: AspectRatio;
    visualStyle: VisualStyle;
    createdAt: Date;
}

export interface GenerationState {
    isGenerating: boolean;
    error: string | null;
    currentImage: GeneratedImage | null;
    history: GeneratedImage[];
}
