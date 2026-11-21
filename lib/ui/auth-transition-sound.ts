export function playAuthSlash() {
  let context: AudioContext | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearTimeout(timer);
    if (context && context.state !== "closed")
      void context.close().catch(() => {});
  };
  try {
    if (!window.AudioContext) return stop;
    context = new AudioContext();
    const buffer = context.createBuffer(
      1,
      Math.ceil(context.sampleRate * 0.65),
      context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++)
      samples[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    const volume = context.createGain();
    const start = context.currentTime;
    filter.frequency.setValueAtTime(600, start);
    filter.frequency.exponentialRampToValueAtTime(4800, start + 0.12);
    filter.frequency.exponentialRampToValueAtTime(180, start + 0.62);
    volume.gain.setValueAtTime(0.001, start);
    volume.gain.exponentialRampToValueAtTime(0.12, start + 0.06);
    volume.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
    source.connect(filter).connect(volume).connect(context.destination);
    void context.resume().catch(stop);
    source.start();
    source.stop(start + 0.65);
    timer = setTimeout(stop, 1000);
  } catch {
    stop();
  }
  return stop;
}
