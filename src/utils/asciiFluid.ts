/**
 * Bộ giải fluid 2D rút gọn theo mô hình "Stable Fluids" (Jos Stam).
 *
 * Chạy trên lưới thô (mỗi ô ~16px màn hình) bằng Float32Array thuần nên chi phí
 * thấp hơn nhiều so với bản WebGL vẽ khói: không texture, không shader, không
 * đọc/ghi framebuffer. Kết quả (mật độ + vận tốc) được canvas 2D dịch sang ký tự
 * ASCII để biểu thị độ đậm nhạt.
 */

const PRESSURE_ITERATIONS = 4;

export class FluidSolver {
  readonly cols: number;
  readonly rows: number;

  /** Vận tốc theo trục X/Y, đơn vị: ô lưới / giây. */
  readonly u: Float32Array;
  readonly v: Float32Array;
  /** Mật độ "mực" — giá trị càng cao ký tự vẽ ra càng đậm. */
  readonly density: Float32Array;

  private readonly uPrev: Float32Array;
  private readonly vPrev: Float32Array;
  private readonly densityPrev: Float32Array;
  private readonly pressure: Float32Array;
  private readonly divergence: Float32Array;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;

    const size = cols * rows;

    this.u = new Float32Array(size);
    this.v = new Float32Array(size);
    this.density = new Float32Array(size);
    this.uPrev = new Float32Array(size);
    this.vPrev = new Float32Array(size);
    this.densityPrev = new Float32Array(size);
    this.pressure = new Float32Array(size);
    this.divergence = new Float32Array(size);
  }

  /**
   * Bơm một "vệt" lực + mực vào lưới quanh ô (cx, cy) với suy giảm dạng gaussian.
   * fx/fy tính bằng ô lưới / giây.
   */
  splat(cx: number, cy: number, fx: number, fy: number, amount: number, radius: number) {
    const { cols, rows, u, v, density } = this;

    const minX = Math.max(1, Math.floor(cx - radius));
    const maxX = Math.min(cols - 2, Math.ceil(cx + radius));
    const minY = Math.max(1, Math.floor(cy - radius));
    const maxY = Math.min(rows - 2, Math.ceil(cy + radius));
    const falloff = -1 / (2 * radius * radius * 0.25);

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;

      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const weight = Math.exp((dx * dx + dy * dy) * falloff);

        if (weight < 0.01) continue;

        const i = x + y * cols;

        u[i] += fx * weight;
        v[i] += fy * weight;
        density[i] = Math.min(1.6, density[i] + amount * weight);
      }
    }
  }

  step(dt: number, velocityDecay: number, densityDecay: number) {
    this.project();

    this.uPrev.set(this.u);
    this.vPrev.set(this.v);
    this.advect(this.u, this.uPrev, this.uPrev, this.vPrev, dt);
    this.advect(this.v, this.vPrev, this.uPrev, this.vPrev, dt);

    this.project();

    this.densityPrev.set(this.density);
    this.advect(this.density, this.densityPrev, this.u, this.v, dt);

    this.dissipate(velocityDecay, densityDecay);
  }

  /** Truy ngược nửa Lagrange: mỗi ô lấy giá trị tại vị trí nó "đến từ". */
  private advect(
    dst: Float32Array,
    src: Float32Array,
    velU: Float32Array,
    velV: Float32Array,
    dt: number,
  ) {
    const { cols, rows } = this;
    const maxX = cols - 1.5;
    const maxY = rows - 1.5;

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = x + y * cols;

        let px = x - dt * velU[i];
        let py = y - dt * velV[i];

        if (px < 0.5) px = 0.5;
        else if (px > maxX) px = maxX;
        if (py < 0.5) py = 0.5;
        else if (py > maxY) py = maxY;

        const x0 = px | 0;
        const y0 = py | 0;
        const sx = px - x0;
        const sy = py - y0;
        const i0 = x0 + y0 * cols;

        dst[i] =
          (1 - sx) * ((1 - sy) * src[i0] + sy * src[i0 + cols]) +
          sx * ((1 - sy) * src[i0 + 1] + sy * src[i0 + cols + 1]);
      }
    }
  }

  /** Ép trường vận tốc về dạng không nén (khử divergence) bằng Jacobi. */
  private project() {
    const { cols, rows, u, v, pressure, divergence } = this;

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = x + y * cols;

        divergence[i] = -0.5 * (u[i + 1] - u[i - 1] + v[i + cols] - v[i - cols]);
        pressure[i] = 0;
      }
    }

    for (let k = 0; k < PRESSURE_ITERATIONS; k++) {
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = x + y * cols;

          pressure[i] =
            (divergence[i] +
              pressure[i - 1] +
              pressure[i + 1] +
              pressure[i - cols] +
              pressure[i + cols]) *
            0.25;
        }
      }
    }

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const i = x + y * cols;

        u[i] -= 0.5 * (pressure[i + 1] - pressure[i - 1]);
        v[i] -= 0.5 * (pressure[i + cols] - pressure[i - cols]);
      }
    }
  }

  /** Tiêu tán dần để vệt chuột tự tan, tránh lưới "đọng" mực vĩnh viễn. */
  private dissipate(velocityDecay: number, densityDecay: number) {
    const { u, v, density } = this;

    for (let i = 0; i < density.length; i++) {
      u[i] *= velocityDecay;
      v[i] *= velocityDecay;

      const d = density[i] * densityDecay;

      density[i] = d < 0.004 ? 0 : d;
    }
  }
}
