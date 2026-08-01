import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Nền "liquid mesh" KHÚC XẠ: một mặt chất lỏng đặc phủ kín khung, bẻ cong lớp
 * ambient (mảng mây + fluid ASCII) đang nằm phía sau.
 *
 * Khác bản tự phát sáng ở chỗ shader không tự bịa ra màu: nó dựng lại đúng lớp
 * ambient rồi lấy mẫu tại toạ độ đã bị pháp tuyến của mặt nước đẩy lệch — nên
 * cái ta thấy méo đi là các mảng mây và vệt fluid thật.
 *
 * Vì sao phải DỰNG LẠI thay vì chụp thẳng: mây là phần tử DOM có `mix-blend-mode`
 * và animation CSS, không có cách nào lấy ra thành texture theo từng khung hình
 * (html2canvas quá chậm cho 60fps). Bù lại, hình học của chúng thì đọc được:
 * mỗi khung hình lấy ma trận transform đang chạy của từng mảng rồi truyền vào
 * shader, nên chuyển động luôn khớp với lớp CSS thật, không phải chép lại
 * keyframe. Hình dạng thì xấp xỉ bằng ellipse xoay — mây gốc là superellipse có
 * `border-radius` 8 giá trị, nhưng qua khúc xạ thì sai khác đó không đọc ra được.
 *
 * Riêng lớp fluid ASCII vốn đã là <canvas> nên lấy thẳng làm texture.
 */

const MAX_CLOUDS = 6;

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

  #define MAX_CLOUDS ${MAX_CLOUDS}

  uniform vec2  uViewport;      // kích thước khung nhìn (px)
  uniform vec2  uRegionOrigin;  // góc trái-trên của khung chat trong khung nhìn (px)
  uniform vec2  uRegionSize;    // kích thước khung chat (px)
  uniform float uTime;

  uniform vec3  uGrad0;         // 3 điểm dừng của gradient .fd-ambient
  uniform vec3  uGrad1;
  uniform vec3  uGrad2;

  uniform vec4  uCloudGeom[MAX_CLOUDS];   // tâm.xy (px) + bán trục.zw (px)
  uniform vec2  uCloudRot[MAX_CLOUDS];    // cos, sin của góc xoay
  uniform vec4  uCloudColor[MAX_CLOUDS];  // rgb + độ đục
  uniform int   uCloudCount;
  uniform float uBlendScreen;   // 0 = multiply (theme sáng), 1 = screen (theme tối)
  uniform float uCloudBoost;    // nhân độ đục của mảng mây khi dựng lại

  uniform sampler2D uFluid;     // lớp ASCII fluid, đã cắt đúng vùng + lề
  uniform vec4  uFluidRect;     // origin.xy + size.zw của vùng đã cắt (px)
  uniform float uFluidAmount;   // 0 khi không có lớp fluid

  uniform float uRefract;       // biên độ bẻ tia (px)
  uniform float uDispersion;    // độ lệch giữa các kênh màu (tỉ lệ so với uRefract)
  uniform float uScale;
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

  /** Trường độ cao của mặt chất lỏng: fbm lồng hai tầng (domain warp). */
  float height(vec2 p) {
    float t = uTime;
    vec2 q = vec2(fbm(p + vec2(0.0, 0.9 * t)),
                  fbm(p + vec2(5.2, 1.3) + 0.7 * t));
    vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2) - 0.5 * t),
                  fbm(p + 3.0 * q + vec2(8.3, 2.8) + 0.4 * t));
    return fbm(p + 3.0 * r);
  }

  /** Dựng lại màu của lớp ambient tại một điểm bất kỳ trong khung nhìn. */
  vec3 ambientAt(vec2 vp) {
    float ty = clamp(vp.y / max(uViewport.y, 1.0), 0.0, 1.0);
    vec3 col = ty < 0.55
      ? mix(uGrad0, uGrad1, ty / 0.55)
      : mix(uGrad1, uGrad2, (ty - 0.55) / 0.45);

    for (int i = 0; i < MAX_CLOUDS; i++) {
      if (i >= uCloudCount) break;

      vec4  geom = uCloudGeom[i];
      vec2  rot  = uCloudRot[i];
      vec4  cc   = uCloudColor[i];

      vec2 d = vp - geom.xy;
      // Về hệ trục riêng của mảng mây (quay ngược lại góc của nó).
      vec2 local = vec2(d.x * rot.x + d.y * rot.y, -d.x * rot.y + d.y * rot.x);
      float e = length(local / max(geom.zw, vec2(1.0)));

      // Mây gốc là khối màu ĐẶC viền sắc — chỉ khử răng cưa một dải rất hẹp.
      // uCloudBoost: mây thật chỉ đục 16–26% trên một nền gần như phẳng, bẻ cong
      // chừng đó thì mắt không thấy gì. Khuếch đại lên trong phạm vi khung chat
      // là cách ĐỔI LẤY hiệu ứng nhìn thấy được — cố ý lệch khỏi nền thật.
      float a = (1.0 - smoothstep(0.985, 1.0, e)) * clamp(cc.a * uCloudBoost, 0.0, 1.0);

      vec3 multiplied = col * cc.rgb;
      vec3 screened   = 1.0 - (1.0 - col) * (1.0 - cc.rgb);

      col = mix(col, mix(multiplied, screened, uBlendScreen), a);
    }

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

    // Pháp tuyến mặt nước, suy từ sai phân hữu hạn của trường độ cao.
    float e = 0.004 * uScale;
    float hx = height(p + vec2(e, 0.0)) - height(p - vec2(e, 0.0));
    float hy = height(p + vec2(0.0, e)) - height(p - vec2(0.0, e));
    vec3 normal = normalize(vec3(-hx, -hy, 0.5));

    // Khúc xạ: đẩy điểm lấy mẫu theo phương nghiêng của mặt nước. Đây là chỗ
    // duy nhất tạo ra hiệu ứng — mọi thứ khác chỉ là dựng lại nền cho đúng.
    vec2 bend = normal.xy * uRefract * vec2(1.0, -1.0);

    // Tán sắc: ba kênh màu lệch nhau một chút, đúng như thuỷ tinh thật bẻ mỗi
    // bước sóng một khác. Nền ambient vốn rất mượt nên nếu cả ba kênh lệch như
    // nhau thì mắt gần như không thấy gì; viền màu mảnh ở chỗ dốc mới là thứ
    // khiến người xem đọc ra "đang nhìn qua một lớp chất lỏng".
    vec3 color = vec3(
      ambientAt(vp + bend * (1.0 - uDispersion)).r,
      ambientAt(vp + bend).g,
      ambientAt(vp + bend * (1.0 + uDispersion)).b
    );

    // Vệt sáng trên mặt chất lỏng — thứ khiến mắt đọc ra "đây là mặt nước"
    // chứ không phải một bức ảnh bị méo.
    vec3 lightDir = normalize(vec3(-0.45, 0.75, 0.62));
    float specular = pow(clamp(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 28.0);
    float fresnel  = pow(1.0 - clamp(normal.z, 0.0, 1.0), 2.0);

    // Màn phủ kéo ảnh về phía màu nền của khung — vừa để chữ đọc được, vừa để
    // lớp mây méo phía sau đọc ra là "nhìn qua mặt nước" chứ không phải hình nền.
    color = mix(color, uVeilColor, clamp(uVeil, 0.0, 1.0));
    color = mix(color, uVeilColor, fresnel * 0.12);

    // Vệt sáng: kéo về phía trắng ở theme sáng, về phía tối ở theme tối — cả hai
    // trường hợp đều là "tách khỏi nền", không phải luôn luôn làm sáng lên.
    vec3 glintTarget = mix(vec3(1.0), vec3(0.0), uBlendScreen);
    color = mix(color, glintTarget, specular * 0.22);

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
  /** Nhân độ đục mảng mây khi dựng lại. 1 = đúng như nền thật (gần như không thấy khúc xạ). */
  cloudBoost?: number;
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
  refract = 42,
  dispersion = 0.35,
  cloudBoost = 2.2,
  scale = 2.2,
  speed = 1,
  veil = 0.3,
  className = "",
}: LiquidMeshBackgroundProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Đọc qua ref để đổi thông số không phải dựng lại cả scene WebGL.
  const knobs = useRef({ active, refract, dispersion, cloudBoost, scale, speed, veil });

  knobs.current = { active, refract, dispersion, cloudBoost, scale, speed, veil };

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
      uCloudGeom: { value: Array.from({ length: MAX_CLOUDS }, () => new THREE.Vector4()) },
      uCloudRot: { value: Array.from({ length: MAX_CLOUDS }, () => new THREE.Vector2(1, 0)) },
      uCloudColor: { value: Array.from({ length: MAX_CLOUDS }, () => new THREE.Vector4()) },
      uCloudCount: { value: 0 },
      uBlendScreen: { value: 0 },
      uCloudBoost: { value: cloudBoost },
      uFluid: { value: fluidTexture },
      uFluidRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uFluidAmount: { value: 0 },
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

      uniforms.uBlendScreen.value = isDark ? 1 : 0;

      const surfaceRaw = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-gray-50")
        .trim();
      const [vr, vg, vb] = readColor(surfaceRaw, isDark ? "#22261f" : "#f9fafb");

      uniforms.uVeilColor.value.setRGB(vr, vg, vb, THREE.LinearSRGBColorSpace);
    };

    /**
     * Hình học của từng mảng mây, đọc lại theo từng khung hình.
     *
     * `offsetLeft/Top/Width/Height` cho hộp bố cục CHƯA biến đổi (mây nằm trong
     * .fd-ambient vốn là fixed inset-0 nên trùng hệ toạ độ khung nhìn), còn ma
     * trận transform cho phần tịnh tiến + góc xoay đang chạy. Gốc xoay mặc định
     * là tâm phần tử, nên tâm sau biến đổi = tâm bố cục + phần tịnh tiến.
     */
    const cloudAlpha: number[] = [];
    const cloudRgb: Array<[number, number, number]> = [];
    let cloudEls: HTMLElement[] = [];

    const collectClouds = () => {
      cloudEls = Array.from(document.querySelectorAll<HTMLElement>(".fd-cloud")).slice(
        0,
        MAX_CLOUDS,
      );
      cloudRgb.length = 0;
      cloudAlpha.length = 0;

      cloudEls.forEach((el) => {
        const cs = getComputedStyle(el);
        const [r, g, b, a] = readColor(cs.backgroundColor, "#00000000");

        cloudRgb.push([r, g, b]);
        // .fd-cloud ở theme tối còn bị hạ opacity — nhân vào luôn.
        cloudAlpha.push(a * Number(cs.opacity || 1));
      });

      uniforms.uCloudCount.value = cloudEls.length;
    };

    const updateClouds = () => {
      cloudEls.forEach((el, i) => {
        // `transform: none` (mảng chưa vào animation) làm DOMMatrix ném lỗi cú pháp.
        const raw = getComputedStyle(el).transform;
        const matrix = raw && raw !== "none" ? new DOMMatrixReadOnly(raw) : new DOMMatrixReadOnly();
        const w = el.offsetWidth;
        const h = el.offsetHeight;

        uniforms.uCloudGeom.value[i].set(
          el.offsetLeft + w / 2 + matrix.e,
          el.offsetTop + h / 2 + matrix.f,
          w / 2,
          h / 2,
        );

        const norm = Math.hypot(matrix.a, matrix.b) || 1;

        uniforms.uCloudRot.value[i].set(matrix.a / norm, matrix.b / norm);

        const [r, g, b] = cloudRgb[i];

        uniforms.uCloudColor.value[i].set(r, g, b, cloudAlpha[i]);
      });
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

    collectClouds();
    syncPalette();
    resize();

    const themeObserver = new MutationObserver(() => {
      syncPalette();
      collectClouds();
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Bật/tắt mảng mây trong Cài đặt giao diện làm thay đổi số phần tử .fd-cloud.
    const ambientRoot = document.querySelector(".fd-ambient");
    const ambientObserver = new MutationObserver(collectClouds);

    if (ambientRoot) ambientObserver.observe(ambientRoot, { childList: true });

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
      uniforms.uCloudBoost.value = knobs.current.cloudBoost;
      uniforms.uScale.value = knobs.current.scale;
      uniforms.uVeil.value = knobs.current.veil;

      syncRegion();
      updateClouds();
      updateFluid();

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      ambientObserver.disconnect();
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
