import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

const workletPath = new URL("../public/nam-engine/nam-worklet.js", import.meta.url);
const wasmPath = new URL("../public/nam-engine/nam-engine.wasm", import.meta.url);
const modelPath = new URL("../public/audio/example.nam", import.meta.url);
const inputPath = new URL("../public/audio/ui_public_inputs_Mayer%20-%20Guitar.wav", import.meta.url);
const outputPath = new URL("../public/audio/Mayer-Guitar-HBE-Mammoth-FretFlow-reference.wav", import.meta.url);

function readWav16(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (new TextDecoder().decode(bytes.subarray(0, 4)) !== "RIFF") throw Error("input is not RIFF WAV");
  const channels = view.getUint16(22, true), rate = view.getUint32(24, true), bits = view.getUint16(34, true);
  if (bits !== 16 && bits !== 24) throw Error(`only PCM16/24 input is supported (got ${bits})`);
  let p = 12, dataOffset = 0, dataSize = 0;
  while (p + 8 <= bytes.length) {
    const id = new TextDecoder().decode(bytes.subarray(p, p + 4));
    const size = view.getUint32(p + 4, true);
    if (id === "data") { dataOffset = p + 8; dataSize = size; break; }
    p += 8 + size + (size & 1);
  }
  if (!dataOffset) throw Error("WAV data chunk not found");
  const bytesPerSample = bits / 8;
  const frames = Math.floor(dataSize / (channels * bytesPerSample));
  const mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    const at = dataOffset + i * channels * bytesPerSample;
    if (bits === 16) mono[i] = view.getInt16(at, true) / 32768;
    else {
      let x = bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
      if (x & 0x800000) x |= 0xff000000;
      mono[i] = x / 8388608;
    }
  }
  return { rate, mono };
}

function writeWavStereo(left, right, rate) {
  const bytes = left.length * 4, out = new Uint8Array(44 + bytes), view = new DataView(out.buffer);
  const put = (p, s) => [...s].forEach((c, i) => view.setUint8(p + i, c.charCodeAt(0)));
  put(0, "RIFF"); view.setUint32(4, 36 + bytes, true); put(8, "WAVE"); put(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 4, true); view.setUint16(32, 4, true); view.setUint16(34, 16, true);
  put(36, "data"); view.setUint32(40, bytes, true);
  let p = 44; for (let i = 0; i < left.length; i++) for (const sample of [left[i], right[i]]) {
    const x = Math.max(-1, Math.min(1, sample)); view.setInt16(p, x < 0 ? x * 32768 : x * 32767, true); p += 2;
  }
  return out;
}

const [worklet, wasm, model, input] = await Promise.all([
  fs.readFile(workletPath, "utf8"), fs.readFile(wasmPath), fs.readFile(modelPath, "utf8"), fs.readFile(inputPath),
]);
const coreSource = worklet.slice(0, worklet.indexOf("/**\n * Message protocol")) + "\nexport { createNamEngine };\n";
// Keep this as a file URL: the Emscripten glue uses createRequire(import.meta.url)
// when running under Node, which is not supported for data: URLs.
const corePath = `/tmp/fretflow-nam-core-${process.pid}.mjs`;
await fs.writeFile(corePath, coreSource);
const { createNamEngine } = await import(pathToFileURL(corePath).href);
const engine = await createNamEngine({ wasmBinary: wasm, locateFile: () => "nam-engine.wasm" });
const { rate, mono } = readWav16(input);
if (rate !== 48000) throw Error(`expected 48000 Hz input, got ${rate}`);
const block = 128, instance = engine._nam_createInstance(rate, block), bufferPtr = engine._nam_getBuffer(instance);
const modelPtr = engine._malloc(engine.lengthBytesUTF8(model) + 1);
engine.stringToUTF8(model, modelPtr, engine.lengthBytesUTF8(model) + 1);
if (!engine._nam_loadModel(instance, modelPtr, 0.5)) throw Error(engine.UTF8ToString(engine._nam_getLastError()));
engine._free(modelPtr);
const out = new Float32Array(mono.length), heapOffset = bufferPtr >> 2;
for (let start = 0; start < mono.length; start += block) {
  const n = Math.min(block, mono.length - start);
  for (let i = 0; i < block; i++) engine.HEAPF32[heapOffset + i] = i < n ? mono[start + i] * 0.5 : 0;
  engine._nam_process(instance, n);
  for (let i = 0; i < n; i++) out[start + i] = engine.HEAPF32[heapOffset + i] * 0.65;
}
await fs.writeFile(outputPath, writeWavStereo(out, out, rate));
engine._nam_destroyInstance(instance);
console.log(`wrote ${outputPath.pathname} (${(out.length / rate).toFixed(2)}s)`);
