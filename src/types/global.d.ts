// Declare the shape of the lamejs object expected to be available globally.

declare global {
  // Define the Mp3Encoder interface based on its usage in the hook
  interface Mp3Encoder {
    /**
     * Encodes a buffer of 16-bit PCM data.
     * @param pcmData The Int16Array containing the PCM data.
     * @returns An Int8Array containing the MP3 data chunk.
     */
    encodeBuffer(pcmData: Int16Array): Int8Array;

    /**
     * Flushes any remaining data in the encoder.
     * @returns An Int8Array containing the final MP3 data chunk.
     */
    flush(): Int8Array;
  }

  // Declare the global lamejs variable and its Mp3Encoder constructor
  var lamejs: {
    /**
     * MP3 Encoder constructor.
     * @param channels Number of channels (1 for mono, 2 for stereo).
     * @param sampleRate Input sample rate in Hz.
     * @param bitRate Output bit rate in kbps.
     */
    Mp3Encoder: new (channels: number, sampleRate: number, bitRate: number) => Mp3Encoder;
  };
}

// Adding this export statement turns the file into a module,
// which is necessary for augmenting the global scope in some setups.
export {};
