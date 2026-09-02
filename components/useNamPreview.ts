"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NamNode } from "neural-amp-modeler-wasm/engine";

const PREVIEW_AUDIO_URL = "/audio/test-preview.mp3?v=2";

type PreviewModel = { id: number; name?: string };
type PreviewState = "idle" | "loading" | "playing" | "paused" | "error";
type PreviewGraph = {
  context: AudioContext;
  inputGain: GainNode;
  node: NamNode;
  outputGain: GainNode;
  previewBuffer: AudioBuffer;
};

export function useNamPreview() {
  const [activeModelId, setActiveModelId] = useState<number | null>(null);
  const [state, setState] = useState<PreviewState>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const graphPromiseRef = useRef<Promise<PreviewGraph> | null>(null);
  const graphRef = useRef<PreviewGraph | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const offsetRef = useRef(0);
  const startedAtRef = useRef(0);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const ensureGraph = useCallback(() => {
    if (graphPromiseRef.current) return graphPromiseRef.current;

    const context = new AudioContext({ sampleRate: 48000 });
    // This runs directly inside the button click, preserving browser audio permission
    // while the WASM engine and model continue loading asynchronously.
    void context.resume();

    graphPromiseRef.current = (async () => {
      const [{ NamEngine }, previewResponse] = await Promise.all([
        import("neural-amp-modeler-wasm/engine"),
        fetch(PREVIEW_AUDIO_URL),
      ]);
      if (!previewResponse.ok) throw Error("无法加载 test.mp3 试听片段");

      const engine = await NamEngine.attach(context, {
        assetBaseUrl: "/nam-engine/",
      });
      const [node, previewBuffer] = await Promise.all([
        engine.createNode(),
        previewResponse
          .arrayBuffer()
          .then((buffer) => context.decodeAudioData(buffer)),
      ]);
      const inputGain = context.createGain();
      const outputGain = context.createGain();

      // test.mp3 is a mastered stereo file, so leave headroom before and after NAM.
      inputGain.gain.value = 0.35;
      outputGain.gain.value = 0.55;
      inputGain.connect(node);
      node.connect(outputGain).connect(context.destination);

      const graph = { context, inputGain, node, outputGain, previewBuffer };
      graphRef.current = graph;
      return graph;
    })().catch((error) => {
      graphPromiseRef.current = null;
      void context.close();
      throw error;
    });

    return graphPromiseRef.current;
  }, []);

  const stopSource = useCallback((reset: boolean) => {
    const source = sourceRef.current;
    const graph = graphRef.current;
    if (source && graph && !reset) {
      offsetRef.current =
        (graph.context.currentTime - startedAtRef.current) %
        graph.previewBuffer.duration;
    }
    if (source) {
      source.onended = null;
      source.stop();
      source.disconnect();
      sourceRef.current = null;
    }
    if (reset) {
      offsetRef.current = 0;
      setProgress(0);
    }
  }, []);

  const startSource = useCallback((graph: PreviewGraph) => {
    const source = graph.context.createBufferSource();
    const offset = offsetRef.current % graph.previewBuffer.duration;
    source.buffer = graph.previewBuffer;
    source.loop = true;
    source.connect(graph.inputGain);
    source.start(0, offset);
    sourceRef.current = source;
    startedAtRef.current = graph.context.currentTime - offset;
    setState("playing");
    setMessage("正在用 test.mp3 试听；声音由浏览器 NAM 实时生成");
  }, []);

  const stop = useCallback(() => {
    requestRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    stopSource(true);
    setActiveModelId(null);
    setState("idle");
    setMessage("");
  }, [stopSource]);

  const toggle = useCallback(
    async (model: PreviewModel) => {
      if (activeModelId === model.id && state === "playing") {
        stopSource(false);
        setState("paused");
        setMessage("试听已暂停");
        return;
      }

      if (activeModelId === model.id && state === "paused") {
        const graph = await ensureGraph();
        await graph.context.resume();
        startSource(graph);
        return;
      }

      if (state === "loading") return;

      stopSource(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestRef.current;
      setActiveModelId(model.id);
      setState("loading");
      setMessage(`正在加载 ${model.name || `NAM ${model.id}`} 的试听…`);

      try {
        const graphPromise = ensureGraph();
        const modelResponse = await fetch(`/api/tone3000/model/${model.id}`, {
          signal: controller.signal,
        });
        if (!modelResponse.ok)
          throw Error(`试听模型下载失败（HTTP ${modelResponse.status}）`);
        const [graph, modelJson] = await Promise.all([
          graphPromise,
          modelResponse.text(),
        ]);
        if (requestId !== requestRef.current) return;

        await graph.node.loadModel(modelJson, { slimSize: 0.5 });
        if (requestId !== requestRef.current) return;
        await graph.context.resume();
        startSource(graph);
      } catch (error) {
        if (requestId !== requestRef.current) return;
        setState("error");
        setMessage(
          error instanceof DOMException && error.name === "AbortError"
            ? "试听已取消"
            : error instanceof Error
              ? error.message
              : "试听加载失败",
        );
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [activeModelId, ensureGraph, startSource, state, stopSource],
  );

  useEffect(() => {
    if (state !== "playing") return;
    const timer = window.setInterval(() => {
      const graph = graphRef.current;
      if (!graph) return;
      const elapsed =
        (graph.context.currentTime - startedAtRef.current) %
        graph.previewBuffer.duration;
      setProgress(elapsed / graph.previewBuffer.duration);
    }, 100);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(
    () => () => {
      requestRef.current += 1;
      abortRef.current?.abort();
      const graph = graphRef.current;
      const source = sourceRef.current;
      if (source) {
        source.onended = null;
        source.stop();
        source.disconnect();
      }
      if (graph) {
        graph.inputGain.disconnect();
        graph.outputGain.disconnect();
        void graph.node.dispose();
        void graph.context.close();
      }
    },
    [],
  );

  return { activeModelId, message, progress, state, stop, toggle };
}
