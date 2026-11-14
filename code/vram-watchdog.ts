// Excerpt from src/bench/gpu.ts, comments translated to English. See 01 and 02 (GPU window protocol).
import { spawn } from 'node:child_process';

/**
 * VRAM margin watchdog. Once the model is loaded its memory (weights, KV, buffers) is already allocated,
 * so a drop in free VRAM comes from the shared desktop sessions. Below the threshold for `consecutive`
 * samples it calls `onBreach` once: the benchmark stops (exit code 3) and the window script unloads the model.
 */
export function vramWatchdog(minFreeMiB: number, onBreach: (freeMiB: number) => void, consecutive = 2) {
  let below = 0, fired = false;
  return (used: number, total: number) => {
    below = total - used < minFreeMiB ? below + 1 : 0;
    if (!fired && below >= consecutive) { fired = true; onBreach(total - used); }
  };
}

export interface GpuSummary { available: boolean; reason?: string; samples: number; first_mib: number | null; min_mib: number | null; peak_mib: number | null; total_mib: number | null; interval_ms: number }

/**
 * Samples GPU memory with nvidia-smi during the benchmark. On the vGPU, per-process memory is not exposed
 * (N/A): we measure total use, which includes desktop sessions, so the baseline is recorded before loading.
 */
export function sampleGpu(intervalMs = 500, command = 'nvidia-smi', onSample?: (usedMiB: number, totalMiB: number) => void): { stop: () => Promise<GpuSummary> } {
  const used: number[] = [];
  let total: number | null = null, failure: string | null = null, buffer = '';
  const child = spawn(command, ['--query-gpu=memory.used,memory.total', '--format=csv,noheader,nounits', '-lms', String(intervalMs)],
    { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
  child.on('error', (error) => { failure = error.message; });
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const [u, t] = line.split(',').map((s) => Number(s.trim()));
      if (Number.isFinite(u) && Number.isFinite(t)) { used.push(u!); total = t!; onSample?.(u!, t!); }
    }
  });
  return {
    stop: () => new Promise((resolve) => {
      const done = () => resolve(used.length
        ? { available: true, samples: used.length, first_mib: used[0]!, min_mib: Math.min(...used), peak_mib: Math.max(...used), total_mib: total, interval_ms: intervalMs }
        : { available: false, reason: failure ?? 'no samples', samples: 0, first_mib: null, min_mib: null, peak_mib: null, total_mib: null, interval_ms: intervalMs });
      if (child.exitCode !== null || failure) return done();
      child.once('close', done);
      child.once('error', done);
      child.kill();
    }),
  };
}

/*
 * Window script checks around the benchmark (PowerShell, summarised):
 *   - before loading:   free VRAM >= MinFreeMiB (default 1024) or abort
 *   - after loading:    /api/ps size_vram must equal size (no silent CPU offload), free VRAM >= MinFreeMiB
 *   - during the run:   this watchdog (500 ms samples, 2 consecutive breaches) + host commit guard (~5 s, stop < ~4.5 GiB)
 *   - always (finally): stop Ollama and its llama-server runners, wait for VRAM release, write the window report
 *   - environment:      LLAMA_ARG_CACHE_RAM=0 to disable the runner's 8 GiB host prompt cache (see 06, the commit trap)
 */
