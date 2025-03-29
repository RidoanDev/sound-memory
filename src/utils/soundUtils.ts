
// Create audio context when needed, to comply with autoplay policies
let audioContext: AudioContext | null = null;

// Cache for loaded audio files
const audioBuffers: Record<string, AudioBuffer> = {};

// Initialize audio context (must be called after user interaction)
export const initAudio = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Load an audio file and cache it
export const loadSound = async (url: string): Promise<AudioBuffer> => {
  const context = initAudio();
  
  if (audioBuffers[url]) {
    return audioBuffers[url];
  }
  
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await context.decodeAudioData(arrayBuffer);
  
  audioBuffers[url] = audioBuffer;
  return audioBuffer;
};

// Play a sound from its URL
export const playSound = async (url: string): Promise<void> => {
  try {
    const context = initAudio();
    const buffer = await loadSound(url);
    
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};

// Create base64 encoded sounds
export const generateToneSound = (frequency: number, duration: number = 0.5): string => {
  const context = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = context.sampleRate;
  const samples = duration * sampleRate;
  const buffer = context.createBuffer(1, samples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < samples; i++) {
    data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.5;
  }

  // Convert to WAV
  const wav = encodeWAV(buffer);
  const base64 = btoa(
    Array.from(new Uint8Array(wav))
      .map(val => String.fromCharCode(val))
      .join('')
  );

  return `data:audio/wav;base64,${base64}`;
};

// Helper function to encode AudioBuffer to WAV
function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const buffer = audioBuffer;
  const numSamples = buffer.length;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write the PCM samples
  const channelData = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      let value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += 2;
    }
  }
  
  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
