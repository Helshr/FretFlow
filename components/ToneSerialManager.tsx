"use client";
import { useEffect, useRef, useState } from "react";
import { useNamPreview } from "./useNamPreview";
type Tone = {
  id: number;
  title?: string;
  models_count?: number;
  a2_models_count?: number;
};
type Model = { id: number; name?: string };
type Port = {
  open: (o: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  writable: WritableStream<Uint8Array> | null;
  readable: ReadableStream<Uint8Array> | null;
};

async function waitForDeviceReply(port: Port, timeoutMs = 10000) {
  if (!port.readable) throw Error("Pico 串口没有可读流");
  const reader = port.readable.getReader();
  const decoder = new TextDecoder();
  let timer: number | undefined;
  let received = "";
  try {
    return await Promise.race([
      (async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) throw Error("Pico 在确认导入前断开连接");
          received += decoder.decode(value, { stream: true });
          if (received.includes("OK:MODEL")) return "OK:MODEL";
          const error = received.match(/ERR:[A-Z]+/);
          if (error) return error[0];
        }
      })(),
      new Promise<string>((_, reject) => {
        timer = window.setTimeout(
          () => reject(Error("板子在 10 秒内没有确认模型，请重新连接后重试")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

async function writeWithTimeout(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  value: Uint8Array,
) {
  let timer: number | undefined;
  try {
    await Promise.race([
      writer.write(value),
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(
          () => reject(Error("串口写入超过 5 秒，已取消本次导入")),
          5000,
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}

export default function ToneSerialManager() {
  const [tones, setTones] = useState<Tone[]>([]),
    [models, setModels] = useState<Model[]>([]),
    [selected, setSelected] = useState<Tone | null>(null),
    [loadingToneId, setLoadingToneId] = useState<number | null>(null),
    [port, setPort] = useState<Port | null>(null),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [query, setQuery] = useState(""),
    [searching, setSearching] = useState(true);
  const busyRef = useRef(false);
  const modelsRequestRef = useRef(0);
  const searchRequestRef = useRef(0);
  const preview = useNamPreview();
  const serial = () =>
    (
      navigator as Navigator & {
        serial?: {
          requestPort: (o: {
            filters: { usbVendorId: number }[];
          }) => Promise<Port>;
        };
      }
    ).serial;
  async function connect() {
    const s = serial();
    if (!s) return setStatus("当前浏览器不支持 Web Serial，请使用 Chrome");
    try {
      const p = await s.requestPort({ filters: [{ usbVendorId: 0xcafe }] });
      await p.open({ baudRate: 115200 });
      if (!p.writable || !p.readable)
        throw Error("Pico 串口缺少读写数据流");
      setPort(p);
      setStatus("Pico NAM 已连接（Web Serial）");
    } catch (e) {
      if ((e as Error).name !== "NotFoundError")
        setStatus("连接 Pico NAM 失败");
    }
  }
  async function search() {
    const requestId = ++searchRequestRef.current;
    preview.stop();
    setSearching(true);
    try {
      const r = await fetch(
          `/api/tone3000/search?query=${encodeURIComponent(query)}`,
        ),
        d = await r.json();
      if (!r.ok) throw Error(d.error || "搜索失败");
      if (requestId !== searchRequestRef.current) return;
      setTones(d.data || []);
      modelsRequestRef.current += 1;
      setSelected(null);
      setModels([]);
    } finally {
      if (requestId === searchRequestRef.current) setSearching(false);
    }
  }
  async function choose(t: Tone) {
    if (selected?.id === t.id) {
      preview.stop();
      modelsRequestRef.current += 1;
      setSelected(null);
      setModels([]);
      return;
    }
    preview.stop();
    setSelected(t);
    setModels([]);
    setLoadingToneId(t.id);
    const requestId = ++modelsRequestRef.current;
    try {
      const r = await fetch(`/api/tone3000/models?tone_id=${t.id}`),
        d = await r.json();
      if (!r.ok) throw Error(d.error || "获取模型失败");
      if (requestId === modelsRequestRef.current) setModels(d.data || []);
    } finally {
      if (requestId === modelsRequestRef.current) setLoadingToneId(null);
    }
  }
  async function send(root: unknown, label: string) {
    if (!port?.writable || !port.readable) throw Error("请先连接 Pico");
    if (busyRef.current) throw Error("已有一个 NAM 正在导入，请等待完成");
    const x = root as {
      architecture?: string;
      config?: { submodels?: { model?: unknown }[] };
      weights?: number[];
    };
    const cs =
      x.architecture === "SlimmableContainer"
        ? (x.config?.submodels || []).map((s) => s.model).filter(Boolean)
        : [x];
    const m = (cs.find(
      (v) =>
        (v as { config?: { layers?: { channels?: number }[] } }).config
          ?.layers?.[0]?.channels === 3,
    ) || cs[0]) as { weights?: number[] };
    if (!m?.weights) throw Error("没有可用的 A2 权重");
    const p = new Float32Array(m.weights),
      raw = new Uint8Array(p.buffer),
      all = new Uint8Array(16 + raw.length),
      v = new DataView(all.buffer);
    all.set([78, 65, 77, 87]);
    v.setUint32(4, 1, true);
    v.setUint32(8, p.length, true);
    v.setUint32(12, raw.length, true);
    all.set(raw, 16);
    const currentPort = port;
    let writer: WritableStreamDefaultWriter<Uint8Array> | null =
      currentPort.writable!.getWriter();
    let sentAll = false;
    busyRef.current = true;
    setBusy(true);
    try {
      for (let o = 0; o < all.length; o += 256) {
        const end = Math.min(o + 256, all.length);
        await writeWithTimeout(writer, all.slice(o, end));
        setStatus(
          `正在导入 ${label}：${Math.min(99, Math.floor((end / all.length) * 100))}%`,
        );
      }
      sentAll = true;
      writer.releaseLock();
      writer = null;
      setStatus(`数据已发送，正在等待 Pico 验证 ${label}…`);
      const reply = await waitForDeviceReply(currentPort);
      if (reply !== "OK:MODEL") throw Error(`板子拒绝模型：${reply}`);
      setStatus(`已导入：${label}（100%）；可以开启音频测试`);
    } finally {
      if (writer) {
        if (!sentAll) await writer.abort().catch(() => undefined);
        writer.releaseLock();
      }
      await currentPort.close().catch(() => undefined);
      setPort(null);
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function direct(m: Model) {
    try {
      setStatus("正在下载并导入…");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);
      const r = await fetch(`/api/tone3000/model/${m.id}`, {
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      if (!r.ok) throw Error(`模型下载失败（HTTP ${r.status}）`);
      const bytes = await r.arrayBuffer();
      setStatus("下载完成，正在解析并发送到 Pico…");
      await send(
        JSON.parse(new TextDecoder().decode(bytes)),
        m.name || `NAM ${m.id}`,
      );
    } catch (e) {
      setStatus(
        e instanceof DOMException && e.name === "AbortError"
          ? "模型下载超过 30 秒，已取消，请重试"
          : e instanceof Error
            ? e.message
            : "导入失败",
      );
    }
  }
  useEffect(() => {
    let cancelled = false;
    const requestId = ++searchRequestRef.current;
    fetch("/api/tone3000/search?query=")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "搜索失败");
        return data;
      })
      .then((data) => {
        if (!cancelled && requestId === searchRequestRef.current) {
          setTones(data.data || []);
          setSearching(false);
        }
      })
      .catch((error) => {
        if (!cancelled && requestId === searchRequestRef.current) {
          setStatus(error.message);
          setSearching(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const totalModels = tones.reduce(
    (sum, tone) => sum + (tone.a2_models_count ?? tone.models_count ?? 0),
    0,
  );
  const statusStyle = /失败|错误|拒绝|无法|超过|取消/.test(status)
    ? "alert-error"
    : /已连接|已导入|100%/.test(status)
      ? "alert-success"
      : "alert-info";

  return (
    <main
      data-theme="fretflow"
      className="min-h-screen bg-base-300 text-base-content"
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top_left,rgba(232,168,80,0.10),transparent_42%),radial-gradient(circle_at_top_right,rgba(232,168,80,0.06),transparent_38%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="badge badge-primary badge-outline mb-4 gap-2">
              <span className="status status-primary" />
              FretFlow Tone Lab
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-base-content sm:text-5xl">
              找到音色，试听，然后写入你的 Pico
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-base-content/60 sm:text-base">
              浏览 TONE3000 的 NAM / A2 模型，用统一音频即时比较，再通过 Web
              Serial 动态导入设备。
            </p>
          </div>

          <div className="stats stats-horizontal border border-base-content/10 bg-base-100 shadow-xl">
            <div className="stat px-5 py-4">
              <div className="stat-title text-xs">搜索结果</div>
              <div className="stat-value text-2xl text-primary">
                {tones.length}
              </div>
              <div className="stat-desc">个音色包</div>
            </div>
            <div className="stat px-5 py-4">
              <div className="stat-title text-xs">可选模型</div>
              <div className="stat-value text-2xl text-primary">
                {totalModels}
              </div>
              <div className="stat-desc">NAM / A2</div>
            </div>
          </div>
        </header>

        <section
          className={`alert mt-10 border shadow-lg ${
            port
              ? "alert-success border-success/20"
              : "border-base-content/10 bg-base-100"
          }`}
        >
          <span
            className={`status ${port ? "status-success animate-pulse" : "status-neutral"}`}
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">
              {port ? "Pico NAM 已连接" : "等待连接 Pico NAM"}
            </h2>
            <p className="truncate text-xs opacity-70">
              {port
                ? "设备已准备好，可以选择模型并直接导入"
                : "试听不需要连接设备；写入模型前再连接即可"}
            </p>
          </div>
          <button type="button" onClick={connect} className="btn btn-primary">
            {port ? "重新连接" : "连接设备"}
          </button>
        </section>

        <section className="card mt-6 border border-base-content/10 bg-base-100 shadow-xl">
          <div className="card-body gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="card-title">搜索音色</h2>
                <p className="mt-1 text-sm text-base-content/50">
                  支持品牌、音箱、作者或音色名称
                </p>
              </div>
              <div className="badge badge-ghost">仅显示 A2</div>
            </div>
            <form
              className="join w-full"
              onSubmit={(event) => {
                event.preventDefault();
                search().catch((e) => setStatus(e.message));
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  search().catch((e) => setStatus(e.message));
                }}
                placeholder="例如：BE100、AC30、John Mayer…"
                aria-label="搜索音色名称、品牌…"
                className="input input-bordered input-lg join-item w-full focus:input-primary"
              />
              <button
                type="submit"
                disabled={searching}
                className="btn btn-primary btn-lg join-item min-w-28"
              >
                {searching ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    检索中
                  </>
                ) : (
                  "搜索"
                )}
              </button>
            </form>
            {searching && (
              <div
                className="flex items-center gap-3"
                role="status"
                aria-live="polite"
              >
                <progress className="progress progress-primary w-full" />
                <span className="shrink-0 text-xs text-base-content/50">
                  正在连接 TONE3000…
                </span>
              </div>
            )}
          </div>
        </section>

        {status && (
          <div role="alert" className={`alert mt-6 ${statusStyle}`}>
            <span className="text-lg" aria-hidden="true">
              {statusStyle === "alert-error"
                ? "!"
                : statusStyle === "alert-success"
                  ? "✓"
                  : "i"}
            </span>
            <span className="text-sm">{status}</span>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">音色库</h2>
            <p className="mt-1 text-sm text-base-content/45">
              点击音色包展开模型；一次只展开一个
            </p>
          </div>
          {!searching && (
            <div className="badge badge-primary badge-lg">
              {tones.length} 个结果
            </div>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {searching ? (
            <div className="card border border-base-content/10 bg-base-100 shadow-lg">
              <div className="card-body flex-row items-center justify-center gap-3 py-12">
                <span className="loading loading-ring loading-lg text-primary" />
                <span className="text-sm text-base-content/60">
                  正在获取 NAM / A2 音色…
                </span>
              </div>
            </div>
          ) : tones.length ? (
            tones.map((t) => {
              const expanded = selected?.id === t.id;
              const modelCount =
                t.a2_models_count ?? t.models_count ?? undefined;
              return (
                <section
                  key={t.id}
                  className={`collapse collapse-arrow border bg-base-100 shadow-lg transition-colors ${
                    expanded
                      ? "collapse-open border-primary/50"
                      : "collapse-close border-base-content/10 hover:border-primary/30"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      choose(t).catch((e) => setStatus(e.message))
                    }
                    className="collapse-title pr-14 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">
                        NAM
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-bold text-base-content">
                          {t.title || `Tone ${t.id}`}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/45">
                          <span className="badge badge-ghost badge-sm">A2</span>
                          <span>
                            {modelCount
                              ? `${modelCount} 个可用模型`
                              : "点击查看可用模型"}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>

                  {expanded && (
                    <div className="collapse-content border-t border-base-content/10 bg-base-200/50 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                      {loadingToneId === t.id ? (
                        <div className="flex items-center justify-center gap-3 py-8 text-sm text-base-content/50">
                          <span className="loading loading-dots loading-md text-primary" />
                          正在加载模型
                        </div>
                      ) : models.length ? (
                        <div className="grid gap-3">
                          {models.map((m, index) => {
                            const isActive = preview.activeModelId === m.id;
                            const isPlaying =
                              isActive && preview.state === "playing";
                            return (
                              <article
                                key={m.id}
                                className={`card border shadow-sm transition-colors ${
                                  isActive
                                    ? "border-primary/60 bg-primary/5"
                                    : "border-base-content/10 bg-base-100"
                                }`}
                              >
                                <div className="card-body gap-4 p-4 sm:flex-row sm:items-center">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="badge badge-neutral badge-sm tabular-nums">
                                        {String(index + 1).padStart(2, "0")}
                                      </span>
                                      <h3 className="truncate text-sm font-semibold text-base-content sm:text-base">
                                        {m.name || `NAM ${m.id}`}
                                      </h3>
                                    </div>
                                    {isActive && (
                                      <div className="mt-3">
                                        <progress
                                          className="progress progress-primary h-1.5 w-full"
                                          value={Math.round(
                                            preview.progress * 100,
                                          )}
                                          max="100"
                                        />
                                        <p className="mt-1.5 text-xs text-base-content/50">
                                          {preview.message}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="card-actions shrink-0 flex-nowrap">
                                    <button
                                      type="button"
                                      disabled={
                                        preview.state === "loading" && !isActive
                                      }
                                      onClick={() =>
                                        preview
                                          .toggle(m)
                                          .catch(() => undefined)
                                      }
                                      className={`btn btn-sm sm:btn-md ${
                                        isPlaying
                                          ? "btn-primary"
                                          : "btn-outline btn-primary"
                                      }`}
                                    >
                                      {isActive && preview.state === "loading"
                                        ? "加载中…"
                                        : isPlaying
                                          ? "❚❚ 暂停"
                                          : isActive &&
                                              preview.state === "paused"
                                            ? "▶ 继续"
                                            : "▶ 试听"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!port || busy}
                                      onClick={() => direct(m)}
                                      className="btn btn-primary btn-sm sm:btn-md"
                                    >
                                      {busy ? (
                                        <span className="loading loading-spinner loading-xs" />
                                      ) : null}
                                      导入 Pico
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="alert bg-base-100">
                          <span aria-hidden="true">i</span>
                          <span className="text-sm">
                            这个音色包暂时没有可用的 NAM / A2 模型
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div className="card border border-dashed border-base-content/20 bg-base-100">
              <div className="card-body items-center py-14 text-center">
                <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-base-200 text-xl">
                  ⌕
                </div>
                <h3 className="card-title">没有找到匹配的音色</h3>
                <p className="text-sm text-base-content/50">
                  换一个品牌、型号或更短的关键词试试
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="alert mt-6 border border-base-content/10 bg-base-100 text-base-content/60">
          <span className="badge badge-primary badge-sm">试听</span>
          <span className="text-xs leading-5">
            使用 test.mp3 的前 15 秒，通过浏览器 NAM/WASM
            实时处理；试听不会写入 Pico。
          </span>
        </div>
      </div>
    </main>
  );
}
