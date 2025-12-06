export type PerformanceLevel = 'low' | 'medium' | 'high';

export async function detectPerformance(): Promise<PerformanceLevel> {
  // ---- Memory sampling ----
  const memory =
    (navigator as any).deviceMemory ||
    (performance as any).memory?.jsHeapSizeLimit / 1024 / 1024 / 1024 ||
    4;

  // ---- Hardware threads ----
  const threads = navigator.hardwareConcurrency || 4;

  // ---- Event loop lag ----
  const lag = await measureEventLoopLag();

  // ---- FPS sampling ----
  const fps = await sampleFPS(900);

  // ---- GPU fill test ----
  const gpuScore = await gpuFillRateTest();

  // ---- Aggregate score ----
  let score = 0;

  // Memory scoring
  if (memory >= 8) score += 2;
  else if (memory >= 4) score += 1;

  // Threads
  if (threads >= 8) score += 2;
  else if (threads >=4) score += 1;

  // Lag scoring
  if (lag < 16) score += 2;
  else if (lag < 40) score += 1;

  // FPS scoring
  if (fps >= 55) score += 2;
  else if (fps >= 35) score += 1;

  // GPU
  if (gpuScore >= 0.7) score += 2;
  else if (gpuScore >= 0.4) score += 1;

  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

async function sampleFPS(durationMs: number): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();

    function tick() {
      frames++;
      if (performance.now() - start >= durationMs) {
        resolve((frames / durationMs) * 1000);
      } else {
        requestAnimationFrame(tick);
      }
    }

    tick();
  });
}

async function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    setTimeout(() => {
      const end = performance.now();
      resolve(end - start - 0);
    }, 0);
  });
}

async function gpuFillRateTest(): Promise<number> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 150;
    const gl = canvas.getContext('webgl');

    if (!gl) return 0.3;

    const t0 = performance.now();
    for (let i = 0; i < 300; i++) {
      gl.clearColor(Math.random(), Math.random(), Math.random(), 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    const t1 = performance.now();

    const time = t1 - t0;
    const normalized = Math.max(0.1, Math.min(1, 300 / time));
    return normalized;
  } catch {
    return 0.4;
  }
}