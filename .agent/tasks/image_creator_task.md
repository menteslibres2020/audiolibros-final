# Task: Implement Dedicated AI Image Creator Tab

The user wants a dedicated section (tab) in the application to create AI images using custom prompts. This tool must support 4 distinct aspect ratios and allow users to generate images freely via text prompts.

## User Requirements
- **New Interface Tab**: A separate section for "Image Creator".
- **Prompt Input**: Text area to describe the image.
- **4 Aspect Ratios**: Specific requirement for 4 formats (Likely 1:1, 16:9, 9:16, and 4:5).
- **Generation**: Button to trigger generation using the existing `gemini-2.5-flash-image` model.
- **Preview & Save**: View the generated image and save/download it.

## Technical Components
1.  **`ImageCreator.tsx`**: New component handling the UI for prompt input, ratio selection, and result display.
2.  **`App.tsx`**: Update state to include `'image-creator'` mode and add navigation button.
3.  **`geminiService.ts`**: Update `generateImage` to support the 4th aspect ratio (4:5) and ensure the "Sandwich" prompt strategy covers it.

## Constraints
- Must use the currently working `gemini-2.5-flash-image` model.
- Must use `generateContent` endpoint (as `predict` failed previously).
- Must use String-based Prompt Engineering to enforce aspect ratios.
