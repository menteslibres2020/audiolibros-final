# Implementation Plan - Dedicated AI Image Creator Tab

This plan outlines the steps to build a dedicated tab for creating AI images using custom prompts and supporting 4 distinct aspect ratios.

## User Story
As a user, I want a separate tab to generate images freely using text prompts, where I can select from 4 aspect ratios (Square, Landscape, Portrait, and Instagram Portrait), so I can create custom visuals without being tied to specific text segments.

## Proposed Changes

### 1. Update `geminiService.ts`
- **Goal**: Extend `generateImage` to support a 4th aspect ratio (e.g., `'4:5'`) and implement the robust "Sandwich" prompt engineering for it.
- **Aspect Ratios**:
    - `1:1` (Square)
    - `16:9` (Landscape/YouTube)
    - `9:16` (Portrait/TikTok)
    - `4:5` (Classic Portrait/Instagram) - **New**
- **Changes**:
    - Update type signature of `aspectRatio` parameter.
    - Add `if/else` block for `'4:5'` to inject `Tall 4:5 aspect ratio image of` prefix and ` --ar 4:5` suffix.

### 2. Create `src/components/ImageCreator.tsx`
- **Goal**: Build the UI for the new tool.
- **Features**:
    - **Prompt Input**: Large text area with placeholder.
    - **Aspect Ratio Selector**: 4 prominent buttons with icons representing the shapes.
    - **Generate Button**: Main action button.
    - **Result Area**:
        - Loading state with skeletons/spinners.
        - Display generated image.
        - Options to Download, Copy, or Regenerate.
        - Error handling display.

### 3. Update `src/App.tsx`
- **Goal**: Integrate the new component into the main application flow.
- **Changes**:
    - Update `mode` state type to include `'image-creator'`.
    - Add navigation button in the header (e.g., "Creador de Imágenes").
    - Render `<ImageCreator />` when `mode === 'image-creator'`.

## Verification Plan
1.  Verify the new tab appears in the UI.
2.  Test generation for each aspect ratio (1:1, 16:9, 9:16, 4:5).
3.  Confirm images are generated and displayed correctly.
4.  Verify error handling (e.g., empty prompt).
