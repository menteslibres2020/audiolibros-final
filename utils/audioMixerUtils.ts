
export function mixAudioWithDucking(
    voiceBuffer: AudioBuffer,
    musicBuffer: AudioBuffer,
    ctx: AudioContext,
    options: {
        duckingThreshold: number; // Volume threshold to trigger ducking (0-1) e.g. 0.05
        duckingRatio: number;     // How much to reduce music volume (0-1) e.g. 0.2 means reduce to 20%
        attackTime: number;       // Fade out time in seconds
        releaseTime: number;      // Fade in time in seconds
        musicVolume: number;      // Base music volume (0-1)
    }
): AudioBuffer {
    // 1. Create Output Buffer (Stereo usually better for music, even if voice is Mono)
    const outputChannels = 2; // Force stereo for professional feel
    const length = Math.max(voiceBuffer.length, musicBuffer.length); // Use longest
    const outputBuffer = ctx.createBuffer(outputChannels, length, ctx.sampleRate);

    // 2. Prepare Data Arrays
    const voiceData = voiceBuffer.getChannelData(0); // Assume mono voice
    const musicDataL = musicBuffer.getChannelData(0);
    const musicDataR = musicBuffer.numberOfChannels > 1 ? musicBuffer.getChannelData(1) : musicDataL;

    // Output Arrays
    const outL = outputBuffer.getChannelData(0);
    const outR = outputBuffer.getChannelData(1);

    // 3. Mixing Loop
    let currentDuckGain = 1.0;
    const attackRate = 1 / (options.attackTime * ctx.sampleRate);
    const releaseRate = 1 / (options.releaseTime * ctx.sampleRate);

    // RMS Window for smoothing voice detection
    const rmsWindowSize = Math.floor(0.05 * ctx.sampleRate); // 50ms window
    let rmsSum = 0;

    for (let i = 0; i < length; i++) {
        // A. Handle Voice Sample
        const voiceSample = i < voiceBuffer.length ? voiceData[i] : 0;

        // B. Calculate RMS (Local Energy) efficiently
        // Simple absolute envelope follower is faster and often sufficient for ducking
        const voiceAbs = Math.abs(voiceSample);

        // C. Determine Target Ducking Gain
        let targetDuckGain = 1.0;
        if (voiceAbs > options.duckingThreshold) {
            targetDuckGain = options.duckingRatio;
        }

        // D. Smooth Transition (Attack/Release)
        if (currentDuckGain > targetDuckGain) {
            currentDuckGain -= attackRate;
            if (currentDuckGain < targetDuckGain) currentDuckGain = targetDuckGain;
        } else if (currentDuckGain < targetDuckGain) {
            currentDuckGain += releaseRate;
            if (currentDuckGain > targetDuckGain) currentDuckGain = targetDuckGain;
        }

        // E. Handle Music Sample (Looping if needed is handled by % length if strictly looping, but usually we just play once or loop logic externally. Here we assume musicBuffer is long enough or we just silence/loop. Let's Loop for safety)
        const musicIdx = i % musicBuffer.length;
        const musicSampleL = musicDataL[musicIdx] * options.musicVolume * currentDuckGain;
        const musicSampleR = musicDataR[musicIdx] * options.musicVolume * currentDuckGain;

        // F. Combine
        outL[i] = (i < voiceBuffer.length ? voiceSample : 0) + musicSampleL;
        outR[i] = (i < voiceBuffer.length ? voiceSample : 0) + musicSampleR;

        // Hard limit to avoid clipping? Not strictly here, we rely on float 32 headroom until export.
    }

    return outputBuffer;
}

export function generateAmbientPad(ctx: AudioContext, duration: number, type: 'tense' | 'hopeful' | 'neutral'): AudioBuffer {
    const buffer = ctx.createBuffer(2, duration * ctx.sampleRate, ctx.sampleRate);
    const L = buffer.getChannelData(0);
    const R = buffer.getChannelData(1);
    const totalSamples = buffer.length;

    // Simple additive synthesis parameters
    let freqs: number[] = [];

    if (type === 'tense') freqs = [55, 58.7, 82.4, 110]; // A1, Bb1 (dissonant), E2, A2 (Dark/Tension)
    if (type === 'hopeful') freqs = [130.8, 164.8, 196, 261.6]; // C3, E3, G3, C4 (C Major)
    if (type === 'neutral') freqs = [110, 164.8, 220, 329.6]; // A2, E3, A3, E4 (Open fifths/octaves, simpler)

    for (let i = 0; i < totalSamples; i++) {
        let sample = 0;
        const t = i / ctx.sampleRate;

        // Create a wash of sounds
        freqs.forEach((f, idx) => {
            // FM Synthesis touch for movement
            const mod = Math.sin(t * 0.1 * (idx + 1)) * 2;
            // Main Osc
            sample += Math.sin(2 * Math.PI * (f + mod) * t) * (0.1 / freqs.length);
        });

        // Add some noise for "air"
        const noise = (Math.random() * 2 - 1) * 0.005;

        // Apply strict envelope (Fade In / Fade Out)
        let envelope = 1;
        if (i < 48000) envelope = i / 48000; // 2 sec fade in
        if (i > totalSamples - 48000) envelope = (totalSamples - i) / 48000; // 2 sec fade out

        L[i] = (sample + noise) * envelope;
        R[i] = (sample + noise) * envelope * 0.9; // Slight stereo width difference
    }

    return buffer;
}
