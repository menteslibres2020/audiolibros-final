
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  // Aseguramos que el buffer se lea correctamente incluso si es una vista parcial
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalizamos el audio de 16-bit PCM a flotante (-1.0 a 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function mergeAudioBuffers(buffers: AudioBuffer[], ctx: AudioContext): AudioBuffer {
  if (buffers.length === 0) return ctx.createBuffer(1, 1, 24000);
  if (buffers.length === 1) return buffers[0];

  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const mergedBuffer = ctx.createBuffer(
    buffers[0].numberOfChannels,
    totalLength,
    buffers[0].sampleRate
  );

  for (let channel = 0; channel < mergedBuffer.numberOfChannels; channel++) {
    let offset = 0;
    const channelData = mergedBuffer.getChannelData(channel);
    for (const buffer of buffers) {
      channelData.set(buffer.getChannelData(channel), offset);
      offset += buffer.length;
    }
  }

  return mergedBuffer;
}

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 3; // IEEE Float
  const bitDepth = 32;

  const blockAlign = numChannels * bitDepth / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true); // Format 3 = Float
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const channelData = buffer.getChannelData(0); // Assuming mono for now based on service
  for (let i = 0; i < channelData.length; i++) {
    // Write directly as Float32, no conversion needed, ensuring exact 1:1 fidelity from model output
    view.setFloat32(44 + i * 4, channelData[i], true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export async function resampleBuffer(buffer: AudioBuffer, targetRate: number): Promise<AudioBuffer> {
  if (buffer.sampleRate === targetRate) return buffer;

  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.duration * targetRate,
    targetRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  return offlineCtx.startRendering();
}
