import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Nền "liquid mesh": một mặt giọt nước phủ kín khung, bẻ cong lớp nền phía sau.
 *
 * Thứ bị bẻ gồm gradient của .fd-ambient và lớp fluid ASCII. Mảng mây CỐ Ý
 * không nằm trong đó: viền của chúng sắc nên khi đi qua trường pháp tuyến sẽ vỡ
 * thành vệt lấm tấm chói mắt, mà làm mềm viền đủ để hết nhiễu thì chúng cũng
 * nhạt tới mức không còn nhìn ra. Bỏ hẳn còn gỡ được cả phần đọc DOM mỗi khung
 * hình để bám theo animation CSS của chúng.
 *
 * Lớp fluid ASCII vốn đã là <canvas> nên lấy thẳng làm texture — đây là nguồn
 * chi tiết duy nhất đủ sắc để nhìn ra là đang bị khúc xạ.
 */

/** Lề lấy dư quanh khung, để tia bị bẻ ra ngoài mép vẫn có dữ liệu để lấy mẫu. */
const SAMPLE_MARGIN = 56;

const VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec2  uViewport;      // kích thước khung nhìn (px)
  uniform vec2  uRegionOrigin;  // góc trái-trên của khung chat trong khung nhìn (px)
  uniform vec2  uRegionSize;    // kích thước khung chat (px)
  uniform float uTime;

  uniform vec3  uGrad0;         // 3 điểm dừng của gradient .fd-ambient
  uniform vec3  uGrad1;
  uniform vec3  uGrad2;

  uniform float uDark;          // 1 khi đang ở theme tối

  uniform sampler2D uFluid;     // lớp ASCII fluid, đã cắt đúng vùng + lề
  uniform vec4  uFluidRect;     // origin.xy + size.zw của vùng đã cắt (px)
  uniform float uFluidAmount;   // 0 khi không có lớp fluid

  uniform float uRefract;       // biên độ bẻ tia (px)
  uniform float uDispersion;    // độ lệch giữa các kênh màu (tỉ lệ so với uRefract)
  uniform float uScale;
  uniform float uBump;          // độ nổi của mặt giọt (nhân vào pháp tuyến)
  uniform float uIridescence;   // biên độ chuyển màu phân cực
  uniform float uGrain;         // biên độ hạt nhiễu tĩnh
  uniform vec3  uTintA;         // hai cực của dải màu phân cực
  uniform vec3  uTintB;
  uniform float uVeil;          // pha thêm bao nhiêu phần màu nền cho dễ đọc chữ
  uniform vec3  uVeilColor;

  varying vec2 vUv;

  // ── Simplex noise 2D (Ashima / Gustavson) ────────────────────────────────
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * snoise(p);
      p   *= 2.02;
      amp *= 0.5;
    }
    return sum;
  }

  /**
   * Trường metaball: vài tâm trôi chậm cộng lại thành một khối liền có eo thắt —
   * đúng cách các giọt nước nhập vào nhau. Đường đồng mức của trường này là các
   * đường cong khép kín trơn, và đó mới là nguồn của "sức căng bề mặt"; nhiễu
   * rải đều thì không bao giờ ra được cảm giác đó.
   */
  float dropletField(vec2 p) {
    // Bóp méo miền ở tần số RẤT thấp và biên độ nhỏ so với bán kính: đủ để đường
    // đồng mức uốn lượn như chất lỏng, chưa đủ để xé chúng thành nhiễu.
    vec2 w = p + 0.11 * vec2(fbm(p * 0.5 + vec2(0.0, uTime)),
                             fbm(p * 0.5 + vec2(4.7, -uTime)));
    float f = 0.0;

    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 c = vec2(sin(uTime * (0.85 + fi * 0.27) + fi * 2.1),
                    cos(uTime * (0.65 + fi * 0.33) + fi * 1.3)) * (0.10 + fi * 0.07);
      float r = 0.22 - fi * 0.05;
      vec2 d = w - c;

      f += r * r / max(dot(d, d), 1e-4);
    }

    return f;
  }

  /** Trường metaball quy về khoảng (0,1): 0 ở lõi khối, 1 ở xa. */
  float surfaceDepth(vec2 p) {
    return 1.0 / (1.0 + dropletField(p));
  }

  /**
   * Độ cao mặt chất lỏng — TRƠN, không gấp nếp.
   *
   * Đã thử hai kiểu tạo gờ trước đó và bỏ cả hai: một đường biên duy nhất thì
   * hiệu ứng co cụm vào giữa khung, còn gấp trường thành nhiều đường đồng mức
   * thì ra những gờ cứng chạy song song, nhìn ra ngay là đồ hoạ chứ không phải
   * chất lỏng. Ở đây độ cao chỉ là bề dày lớp chất lỏng biến thiên đều, nên độ
   * nghiêng đổi từ từ khắp mặt — lượng bẻ tia và sắc phân cực chuyển thành
   * những dải rộng mượt thay vì bám vào một đường nào.
   */
  float dropletHeight(vec2 p) {
    return surfaceDepth(p) + 0.40 * fbm(p * 0.7 + vec2(uTime * 0.6, -uTime * 0.4));
  }

  /** Hạt nhiễu tĩnh, biên độ rất nhỏ — phủ đều mặt cho đỡ bệt, không nhấp nháy. */
  float grain(vec2 vp) {
    return fract(sin(dot(vp, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  }

  /**
   * Màu của lớp nền tại một điểm bất kỳ trong khung nhìn: gradient .fd-ambient
   * cộng lớp fluid ASCII. Không có mảng mây — xem ghi chú ở đầu tệp.
   */
  vec3 ambientAt(vec2 vp) {
    float ty = clamp(vp.y / max(uViewport.y, 1.0), 0.0, 1.0);
    vec3 col = ty < 0.55
      ? mix(uGrad0, uGrad1, ty / 0.55)
      : mix(uGrad1, uGrad2, (ty - 0.55) / 0.45);

    if (uFluidAmount > 0.0) {
      vec2 fuv = (vp - uFluidRect.xy) / max(uFluidRect.zw, vec2(1.0));

      if (fuv.x >= 0.0 && fuv.x <= 1.0 && fuv.y >= 0.0 && fuv.y <= 1.0) {
        vec4 ink = texture2D(uFluid, vec2(fuv.x, 1.0 - fuv.y));
        col = mix(col, ink.rgb, ink.a * uFluidAmount);
      }
    }

    return col;
  }

  void main() {
    vec2 vp = uRegionOrigin + vec2(vUv.x, 1.0 - vUv.y) * uRegionSize;

    float aspect = uRegionSize.x / max(uRegionSize.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * uScale;

    // Pháp tuyến từ sai phân hữu hạn. Bước lấy mẫu để RỘNG (không bám theo từng
    // điểm ảnh) để pháp tuyến trơn — bước hẹp sẽ khuếch đại chi tiết li ti và
    // biến mặt chất lỏng thành mặt nhiễu.
    float e = 0.02;
    float hx = dropletHeight(p + vec2(e, 0.0)) - dropletHeight(p - vec2(e, 0.0));
    float hy = dropletHeight(p + vec2(0.0, e)) - dropletHeight(p - vec2(0.0, e));
    vec3 normal = normalize(vec3(-hx * uBump, -hy * uBump, 1.0));

    // Khúc xạ theo độ nghiêng mặt. Mặt trơn nên độ nghiêng đổi từ từ, lượng bẻ
    // trải đều khắp khung — không có chỗ nào bị dồn thành đường gấp.
    vec2 bend = normal.xy * uRefract * vec2(1.0, -1.0);

    // Tán sắc: ba kênh màu lệch nhau chút ít, như thuỷ tinh bẻ mỗi bước sóng một khác.
    vec3 color = vec3(
      ambientAt(vp + bend * (1.0 - uDispersion)).r,
      ambientAt(vp + bend).g,
      ambientAt(vp + bend * (1.0 + uDispersion)).b
    );

    float fresnel = pow(1.0 - clamp(normal.z, 0.0, 1.0), 1.5);

    // Phân cực (giao thoa màng mỏng). Pha phụ thuộc BỀ DÀY lớp chất lỏng và góc
    // nhìn; bề dày biến thiên nhẹ ở tần số thấp nên lòng giọt không bệt một màu.
    //
    // Màu quét trong DẢI HẸP giữa hai tông brand, cộng chút ánh cầu vồng ở tần số
    // gấp đôi. Quét trọn phổ thì rực như váng dầu, quá ồn cho khung chat; còn nội
    // suy trơn giữa đúng hai màu brand lại ra mấy mảng xanh–nâu trông y hệt mảng
    // mây của trang — đó chính là thứ bị nhầm là "mây trong nước".
    //
    // Bề dày lấy theo trường TRƠN (không theo gờ), nên màu chuyển mượt cắt ngang
    // các gờ thay vì bám dính vào từng gờ một.
    float thickness = surfaceDepth(p) * 2.2 + 0.45 * fbm(p * 0.95 + vec2(uTime * 0.8, -uTime * 0.5));
    float phase = fresnel * 1.1 + thickness * 2.4 + dot(normal.xy, vec2(0.8, 0.6)) * 0.8;

    vec3 iridescent = mix(uTintA, uTintB, 0.5 + 0.5 * cos(6.2831853 * phase))
      + 0.09 * cos(6.2831853 * (phase * 2.0 + vec3(0.0, 0.33, 0.67)));

    // Phủ TOÀN BỘ khung — không còn cổng theo thân giọt, vì giờ chất lỏng trải
    // kín mặt chứ không phải một khối nằm giữa nền trống.
    float coat = uIridescence * (0.80 + 0.20 * fresnel);

    color = mix(color, iridescent, clamp(coat, 0.0, 1.0));

    // Màn phủ chỉ tác động lên ĐỘ SÁNG, không đụng vào sắc độ.
    //
    // Bản trước pha thẳng color → uVeilColor nên vừa nâng sáng vừa xoá luôn màu:
    // kéo đủ để đọc chữ thì mặt giọt cũng bạc trắng hết. Mà tương phản chữ chỉ
    // phụ thuộc độ sáng — nên chỉ cần nén độ sáng về gần nền, còn các dải màu
    // phân cực thì giữ nguyên biên độ.
    const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
    float lum = dot(color, LUMA);
    float targetLum = mix(lum, dot(uVeilColor, LUMA), clamp(uVeil, 0.0, 1.0));

    color = clamp(color + (targetLum - lum), 0.0, 1.0);

    // Viền sáng mảnh bám đúng mép giọt — dấu hiệu thị giác của sức căng bề mặt.
    vec3 rimTarget = mix(vec3(1.0), vec3(0.0), uDark);
    color = mix(color, rimTarget, pow(fresnel, 3.0) * 0.30);

    color += vec3(grain(vp) * uGrain);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Đọc màu CSS thành THREE.Color.
 *
 * Không đưa thẳng chuỗi cho THREE.Color được: token của dự án có cả `oklch()`
 * lẫn `color-mix()`, mà bộ phân giải của three chỉ hiểu hex/rgb/hsl — gặp dạng
 * khác nó chỉ cảnh báo rồi trả màu rác chứ không ném lỗi. Vẽ ra canvas 2D rồi
 * đọc lại điểm ảnh là nhờ chính trình duyệt quy đổi.
 */
function makeColorReader() {
  const canvas = document.createElement("canvas");

  canvas.width = canvas.height = 1;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  return (css: string, fallback: string): [number, number, number, number] => {
    if (!ctx) return [0, 0, 0, 1];

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = fallback;
    ctx.fillStyle = css || fallback; // gán hỏng thì fillStyle giữ giá trị dự phòng
    ctx.fillRect(0, 0, 1, 1);

    // ImageData trả alpha RỜI (không nhân sẵn vào rgb), nên rgb đã là màu gốc.
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

    return [r / 255, g / 255, b / 255, a / 255];
  };
}

/** Tách 3 điểm dừng màu từ `background-image` đã tính của .fd-ambient. */
function readGradientStops(el: Element | null): string[] {
  if (!el) return [];

  const raw = getComputedStyle(el).backgroundImage;
  const matches = raw.match(/(?:oklab|oklch|rgba?|color)\([^)]*\)/g);

  return matches ? matches.slice(0, 3) : [];
}

export interface LiquidMeshBackgroundProps {
  /** Tắt vòng lặp khi khung đang đóng — không vẽ thứ người dùng không nhìn thấy. */
  active?: boolean;
  /** Biên độ bẻ tia, tính bằng px. Càng lớn mây phía sau càng méo. */
  refract?: number;
  /** Độ lệch giữa 3 kênh màu, tính theo tỉ lệ của `refract`. 0 = không tán sắc. */
  dispersion?: number;
  /** Độ nổi của mặt giọt. Càng lớn viền càng cong gắt. */
  bump?: number;
  /** Biên độ dải màu phân cực (xanh ↔ vàng). 0 = tắt. */
  iridescence?: number;
  /** Biên độ hạt nhiễu phủ mặt. */
  grain?: number;
  /** Số ô vân trên chiều cao khung. Nhỏ = khối lớn, lững lờ. */
  scale?: number;
  /** Nhân tốc độ chảy. */
  speed?: number;
  /** Pha bao nhiêu phần màu nền lên trên để chữ còn đọc được (0 → 1). */
  veil?: number;
  className?: string;
}

export default function LiquidMeshBackground({
  active = true,
  refract = 130,
  dispersion = 0.22,
  bump = 2.4,
  iridescence = 0.55,
  grain = 0.016,
  scale = 0.38,
  speed = 1,
  veil = 0.55,
  className = "",
}: LiquidMeshBackgroundProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Đọc qua ref để đổi thông số không phải dựng lại cả scene WebGL.
  const knobs = useRef({
    active,
    refract,
    dispersion,
    bump,
    iridescence,
    grain,
    scale,
    speed,
    veil,
  });

  // Đồng bộ trong effect chứ không phải giữa lúc render: ghi vào ref khi đang
  // render là tác dụng phụ, React có thể dựng lại rồi bỏ kết quả đi.
  useEffect(() => {
    knobs.current = {
      active,
      refract,
      dispersion,
      bump,
      iridescence,
      grain,
      scale,
      speed,
      veil,
    };
  });

  useEffect(() => {
    const host = hostRef.current;

    if (!host) return;
    // Tôn trọng yêu cầu giảm chuyển động: bỏ hẳn WebGL, để lộ nền tĩnh phía dưới.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      return; // Máy không dựng được WebGL → giữ nguyên nền tĩnh.
    }

    // Vân chất lỏng vốn mượt — dựng ở nửa độ phân giải rồi để CSS phóng lên là
    // không nhìn ra, mà tiết kiệm 3/4 số điểm ảnh.
    const RESOLUTION_SCALE = 0.5;

    const readColor = makeColorReader();

    /** Ảnh cắt của lớp fluid ASCII: chỉ vùng sau khung + lề, ở nửa độ phân giải. */
    const fluidCrop = document.createElement("canvas");
    const fluidCtx = fluidCrop.getContext("2d");
    const fluidTexture = new THREE.CanvasTexture(fluidCrop);

    fluidTexture.minFilter = THREE.LinearFilter;
    fluidTexture.magFilter = THREE.LinearFilter;
    fluidTexture.generateMipmaps = false;

    const uniforms = {
      uViewport: { value: new THREE.Vector2(1, 1) },
      uRegionOrigin: { value: new THREE.Vector2(0, 0) },
      uRegionSize: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uGrad0: { value: new THREE.Color(0.96, 0.96, 0.94) },
      uGrad1: { value: new THREE.Color(0.96, 0.95, 0.93) },
      uGrad2: { value: new THREE.Color(0.96, 0.96, 0.94) },
      uDark: { value: 0 },
      uFluid: { value: fluidTexture },
      uFluidRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uFluidAmount: { value: 0 },
      uBump: { value: bump },
      uIridescence: { value: iridescence },
      uGrain: { value: grain },
      uTintA: { value: new THREE.Color(0.49, 0.56, 0.41) },
      uTintB: { value: new THREE.Color(0.65, 0.54, 0.39) },
      uRefract: { value: refract },
      uDispersion: { value: dispersion },
      uScale: { value: scale },
      uVeil: { value: veil },
      uVeilColor: { value: new THREE.Color(0.98, 0.98, 0.98) },
    };

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);

    mesh.frustumCulled = false;
    scene.add(mesh);

    renderer.domElement.className = "h-full w-full block";
    host.appendChild(renderer.domElement);

    /** Màu nền / gradient / chế độ hoà trộn — chỉ đổi khi đổi theme. */
    const syncPalette = () => {
      const ambient = document.querySelector(".fd-ambient");
      const stops = readGradientStops(ambient);
      const grads = [uniforms.uGrad0, uniforms.uGrad1, uniforms.uGrad2];

      grads.forEach((slot, i) => {
        const [r, g, b] = readColor(stops[i] ?? "", "#f5f4f0");

        slot.value.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
      });

      const isDark = document.documentElement.getAttribute("data-theme") === "dark";

      uniforms.uDark.value = isDark ? 1 : 0;

      const surfaceRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-gray-50")
        .trim();
      const [vr, vg, vb] = readColor(surfaceRaw, isDark ? "#22261f" : "#f9fafb");

      uniforms.uVeilColor.value.setRGB(vr, vg, vb, THREE.LinearSRGBColorSpace);

      // Hai cực của dải phân cực: sage ↔ nâu ấm của brand — trùng đúng cặp
      // xanh/vàng ở bản mẫu monopo.
      const cssVars = getComputedStyle(document.documentElement);
      const [ar, ag, ab] = readColor(cssVars.getPropertyValue("--color-primary").trim(), "#7d8f69");
      const [br, bg2, bb] = readColor(
        cssVars.getPropertyValue("--color-secondary").trim(),
        "#a68a64",
      );

      uniforms.uTintA.value.setRGB(ar, ag, ab, THREE.LinearSRGBColorSpace);
      uniforms.uTintB.value.setRGB(br, bg2, bb, THREE.LinearSRGBColorSpace);
    };

    /** Cắt phần lớp fluid ASCII nằm sau khung (kèm lề) vào texture. */
    const updateFluid = () => {
      const source = document.querySelector<HTMLCanvasElement>(".fd-ambient canvas");
      const rect = host.getBoundingClientRect();

      if (!source || !fluidCtx || source.width === 0) {
        uniforms.uFluidAmount.value = 0;

        return;
      }

      const x = rect.left - SAMPLE_MARGIN;
      const y = rect.top - SAMPLE_MARGIN;
      const w = rect.width + SAMPLE_MARGIN * 2;
      const h = rect.height + SAMPLE_MARGIN * 2;

      uniforms.uFluidRect.value.set(x, y, w, h);

      const cw = Math.max(1, Math.round(w * RESOLUTION_SCALE));
      const ch = Math.max(1, Math.round(h * RESOLUTION_SCALE));

      if (fluidCrop.width !== cw || fluidCrop.height !== ch) {
        fluidCrop.width = cw;
        fluidCrop.height = ch;
      }

      // Canvas nguồn được vẽ ở tỉ lệ DPR riêng của nó → quy đổi px CSS sang px ảnh.
      const srcScale = source.width / (source.clientWidth || 1);

      fluidCtx.clearRect(0, 0, cw, ch);
      fluidCtx.drawImage(
        source,
        x * srcScale,
        y * srcScale,
        w * srcScale,
        h * srcScale,
        0,
        0,
        cw,
        ch,
      );

      fluidTexture.needsUpdate = true;
      uniforms.uFluidAmount.value = 1;
    };

    const resize = () => {
      const { clientWidth, clientHeight } = host;

      if (clientWidth === 0 || clientHeight === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2) * RESOLUTION_SCALE;

      renderer.setPixelRatio(dpr);
      renderer.setSize(clientWidth, clientHeight, false);
      uniforms.uViewport.value.set(window.innerWidth, window.innerHeight);
    };

    const syncRegion = () => {
      const rect = host.getBoundingClientRect();

      uniforms.uRegionOrigin.value.set(rect.left, rect.top);
      uniforms.uRegionSize.value.set(rect.width, rect.height);
    };

    syncPalette();
    resize();

    const themeObserver = new MutationObserver(() => {
      syncPalette();
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const resizeObserver = new ResizeObserver(() => {
      resize();
      syncRegion();
    });

    resizeObserver.observe(host);

    let raf = 0;
    let last = performance.now();
    let clock = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);

      const dt = Math.min((now - last) / 1000, 1 / 30);

      last = now;

      if (document.hidden || !knobs.current.active) return;

      // Chậm có chủ ý: nền chuyển động nhanh sẽ kéo mắt khỏi nội dung chat.
      clock += dt * 0.035 * knobs.current.speed;

      uniforms.uTime.value = clock;
      uniforms.uRefract.value = knobs.current.refract;
      uniforms.uDispersion.value = knobs.current.dispersion;
      uniforms.uBump.value = knobs.current.bump;
      uniforms.uIridescence.value = knobs.current.iridescence;
      uniforms.uGrain.value = knobs.current.grain;
      uniforms.uScale.value = knobs.current.scale;
      uniforms.uVeil.value = knobs.current.veil;

      syncRegion();
      updateFluid();

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      fluidTexture.dispose();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- thông số đọc qua knobs ref

  return <div ref={hostRef} aria-hidden className={`pointer-events-none ${className}`} />;
}
