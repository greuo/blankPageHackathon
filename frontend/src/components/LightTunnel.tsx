import { useEffect, useRef, useState } from 'react';
import './LightTunnel.css';

// Adapted from the React Bits LightTunnel source supplied with the design brief.
// The opening uses a restrained, non-interactive subset of its shader controls.
const INTRO_SECONDS = 0.45;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uScale;
uniform float uRatio;
uniform float uTime;
uniform float uDrift;
uniform vec2 uSteer;
uniform float uBend;
uniform float uCount;
uniform float uSwing;
uniform float uWave;
uniform float uWidth;
uniform float uPulseWidth;
uniform float uHead;
uniform float uTail;
uniform float uChance;
uniform float uSpacing;
uniform float uPulseSpeed;
uniform float uFlow;
uniform float uHalo;
uniform float uGlow;
uniform float uBrightness;
uniform float uVariance;
uniform float uBody;
uniform float uFadeNear;
uniform float uFadeFar;
uniform vec3 uCable;
uniform vec3 uPulse;
uniform vec3 uTunnel;
uniform vec3 uSurge;
uniform float uReveal;
uniform float uGrain;
uniform float uSeed;
uniform float uLight;
uniform float uOpacity;
out vec4 outColor;

const float TAU = 6.2831853;

vec3 inkOf(vec3 color, float depthOfInk) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float peak = max(color.r, max(color.g, color.b));
  float chroma = (peak - min(color.r, min(color.g, color.b))) / max(peak, 0.001);
  return color * min(1.0, mix(depthOfInk, depthOfInk * 1.7, chroma) / max(luma, 0.001));
}

float hash(float n) {
  return fract(sin(n * 127.1 + uSeed * 311.7) * 43758.5453);
}

vec2 bendAt(float depth) {
  float reach = 1.0 - exp(-max(depth, 0.0) * 0.55);
  vec2 wobble = vec2(sin(uDrift * 0.37 + depth * 0.31), cos(uDrift * 0.29 + depth * 0.23)) * uBend;
  return (wobble + uSteer) * reach;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution - uCenter) / uScale;
  float depth = -log(max(length(p), 1e-5));
  vec2 q = p;
  for (int i = 0; i < 4; i++) {
    q = p - bendAt(depth);
    depth = -log(max(length(q), 1e-5));
  }
  float r = length(q);
  float px = r * uScale;
  float turn = atan(q.y, q.x) / TAU;
  float s = turn - uSwing - uWave * sin(depth * 1.2 + uDrift * 0.5);
  float cell = floor(s * uCount);
  float spacing = TAU * px / uCount;
  float near = smoothstep(0.55, 1.25, r);
  float width = uWidth * (1.0 + near * 1.2);
  float soft = uRatio * (0.55 + near * 0.9);
  float tight = uRatio * uHalo * (1.0 + near);
  float wide = tight * 4.5;

  float lines = 0.0;
  float body = 0.0;
  vec3 glow = vec3(0.0);
  float strokes = 0.0;
  for (int k = -3; k <= 3; k++) {
    float i = cell + float(k);
    float id = mod(i, uCount);
    float h1 = hash(id);
    float h2 = hash(id + 17.0);
    float h3 = hash(id + 41.0);
    float h4 = hash(id + 73.0);
    float center = (i + 0.5 + (h1 - 0.5) * 0.55) / uCount;
    center += 0.12 * sin(depth * (0.8 + h2 * 0.9) + uDrift * (0.4 + h3 * 0.5) + h4 * TAU) / uCount;
    float d = abs(s - center) * TAU * px;
    float shade = 1.0 + uVariance * (h3 - 0.5) * 0.9;
    float reach = smoothstep(spacing * 2.4, spacing * 1.4, d);

    lines += smoothstep(width + soft, width - soft, d) * shade;
    body += exp(-d / max(spacing * 0.22, 0.001)) * shade * reach;

    float x = depth * uSpacing + uTime * uPulseSpeed * (0.55 + h2 * 0.6) * uFlow + h4 * 7.0;
    float lead = (fract(x) - 0.5) / uSpacing * uFlow;
    float lit = step(hash(id * 3.7 + floor(x) * 13.1), uChance);
    float limit = 0.5 / uSpacing;
    float head = exp(-pow(max(-lead, 0.0) / uHead, 2.0)) * smoothstep(-limit, -limit * 0.8, lead);
    float tail = exp(-max(lead, 0.0) / uTail) * smoothstep(limit, limit * 0.55, lead);
    float pulse = (lead < 0.0 ? head : tail) * lit;
    float ring = uSurge.y * exp(-pow((depth - uSurge.x) / uSurge.z, 2.0));
    pulse = max(pulse, ring);
    float hot = pulse * (lead < 0.0 ? 1.0 : exp(-max(lead, 0.0) / (uTail * 0.35)));

    float core = uPulseWidth * width + 0.35 * uRatio;
    float stroke = smoothstep(core + soft, core - soft, d);
    float bloom = (exp(-d / tight) * 0.7 + exp(-d / wide) * 0.18) * uGlow * reach;
    vec3 tint = mix(uPulse, vec3(1.0), hot * 0.55 * (1.0 - uLight));
    glow += tint * pulse * (stroke * 1.5 + bloom) * shade;
    strokes += pulse * stroke * shade;
  }

  float lod = smoothstep(4.0, 1.2, spacing);
  float average = min(2.0 * uWidth / max(spacing, 0.001), 1.0);
  lines = mix(lines, average, lod);
  glow = mix(glow, uPulse * average * 0.6 * uChance, lod);
  strokes = mix(strokes, average * 0.6 * uChance, lod);
  body = mix(body, 1.0, lod) * uBody;

  float rr = r * 0.25;
  float fade = smoothstep(0.0, uFadeNear, rr) * smoothstep(uFadeFar, uFadeFar * 0.55, rr);
  fade *= smoothstep(uReveal - 0.6, uReveal, depth);

  float grain = 1.0;
  if (uGrain > 0.0) {
    grain += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime * 7.0) * 43758.5453) - 0.5) * uGrain * 4.0;
  }

  if (uLight > 0.5) {
    float hairline = clamp(lines * 0.45 + body * 0.2, 0.0, 1.0);
    float stroke = clamp(strokes * 1.6, 0.0, 1.0);
    float haze = clamp(length(glow) * 0.12, 0.0, 0.25);
    float ink = clamp(hairline + stroke + haze, 0.0, 1.0) * fade * uOpacity * grain;
    vec3 tone = mix(inkOf(uCable, 0.3), inkOf(uPulse, 0.16), clamp(stroke + haze * 2.0, 0.0, 1.0));
    tone = mix(tone, inkOf(uTunnel, 0.3), clamp(body * uBody, 0.0, 1.0) * 0.5);
    outColor = vec4(tone * ink, ink);
    return;
  }

  vec3 light = (uCable * lines * 0.12 + uTunnel * body * 0.35 + glow) * uBrightness * fade * grain;
  vec3 mapped = (1.0 - exp(-light * 1.4)) * uOpacity;
  outColor = vec4(mapped, max(mapped.r, max(mapped.g, mapped.b)));
}`;

type RGB = [number, number, number];
type TunnelProps = {
  cableColor?: string;
  pulseColor?: string;
  cableCount?: number;
  opacity?: number;
  dpr?: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

export default function LightTunnel({
  cableColor = 'var(--green)',
  pulseColor = 'var(--action)',
  cableCount = 24,
  opacity = 0.42,
  dpr = 1.25,
  className = '',
}: TunnelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<'fallback' | 'webgl'>('fallback');

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!container || !canvas || media.matches) return;
    if (typeof window.WebGL2RenderingContext === 'undefined') return;

    let gl: WebGL2RenderingContext | null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      });
    } catch {
      // Decorative enhancement only. The static line composition remains visible.
      return;
    }
    if (!gl) return;
    const context = gl;
    const shader = link(context);
    if (!shader) return;
    const buffer = context.createBuffer();
    const vao = context.createVertexArray();
    if (!buffer || !vao) {
      context.deleteProgram(shader.program);
      if (buffer) context.deleteBuffer(buffer);
      if (vao) context.deleteVertexArray(vao);
      return;
    }

    const u = shader.uniforms;
    context.bindVertexArray(vao);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      context.STATIC_DRAW,
    );
    context.enableVertexAttribArray(0);
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const parseColor = (value: string, fallback: RGB): RGB => {
      const token = value.match(/^var\((--[\w-]+)\)$/)?.[1];
      const color = token ? getComputedStyle(container).getPropertyValue(token).trim() : value;
      if (!probe || !color || !CSS.supports('color', color)) return fallback;
      probe.clearRect(0, 0, 1, 1);
      probe.fillStyle = color;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255];
    };
    const cable = parseColor(cableColor, [0.2, 0.44, 0.3]);
    const pulse = parseColor(pulseColor, [0.16, 0.4, 0.26]);
    let elapsed = 0;
    let raf = 0;
    let previous = 0;
    let contextLost = false;
    let disposed = false;
    const allowed = () => !disposed && !contextLost && !document.hidden && !media.matches;

    function render() {
      if (!allowed()) return;
      const width = canvas!.width;
      const height = canvas!.height;
      const ratio = width / Math.max(1, container!.clientWidth);
      const reveal = Math.min(1, elapsed / INTRO_SECONDS);
      const eased = reveal * reveal * (3 - 2 * reveal);
      context.viewport(0, 0, width, height);
      context.useProgram(shader!.program);
      context.bindVertexArray(vao);
      context.uniform2f(u.uResolution, width, height);
      context.uniform2f(u.uCenter, 0, 0);
      context.uniform1f(u.uScale, Math.min(width, height) * 0.48);
      context.uniform1f(u.uRatio, ratio);
      context.uniform1f(u.uTime, elapsed * 0.065);
      context.uniform1f(u.uDrift, elapsed * 0.2);
      context.uniform2f(u.uSteer, 0, 0);
      context.uniform1f(u.uBend, 0.035);
      context.uniform1f(u.uCount, Math.round(clamp(cableCount, 12, 36)));
      context.uniform1f(u.uSwing, 0);
      context.uniform1f(u.uWave, 0.014);
      context.uniform1f(u.uWidth, 0.8 * ratio);
      context.uniform1f(u.uPulseWidth, 0.9);
      context.uniform1f(u.uHead, 0.07);
      context.uniform1f(u.uTail, 0.3);
      context.uniform1f(u.uChance, 0.2);
      context.uniform1f(u.uSpacing, 0.4);
      context.uniform1f(u.uPulseSpeed, 2.8);
      context.uniform1f(u.uFlow, -1);
      context.uniform1f(u.uHalo, 1.6);
      context.uniform1f(u.uGlow, 0.2);
      context.uniform1f(u.uBrightness, 0.7);
      context.uniform1f(u.uVariance, 0);
      context.uniform1f(u.uBody, 0);
      context.uniform1f(u.uFadeNear, 0.12);
      context.uniform1f(u.uFadeFar, 1.45);
      context.uniform3fv(u.uCable, cable);
      context.uniform3fv(u.uPulse, pulse);
      context.uniform3fv(u.uTunnel, cable);
      context.uniform3f(u.uSurge, 0, 0, 0.22);
      context.uniform1f(u.uReveal, 1.7 - eased * 3.6);
      context.uniform1f(u.uGrain, 0);
      context.uniform1f(u.uSeed, 3);
      context.uniform1f(u.uLight, 1);
      context.uniform1f(u.uOpacity, clamp(opacity, 0, 0.45));
      context.drawArrays(context.TRIANGLES, 0, 3);
    }

    function frame(now: number) {
      raf = 0;
      if (!allowed()) return;
      elapsed += previous ? clamp((now - previous) / 1000, 0, 0.05) : 1 / 60;
      previous = now;
      render();
      raf = requestAnimationFrame(frame);
    }
    function wake() {
      if (!raf && allowed()) raf = requestAnimationFrame(frame);
    }
    function resize() {
      if (disposed || contextLost) return;
      const ratio = clamp(Math.min(dpr, window.devicePixelRatio || 1), 1, 1.5);
      canvas!.width = Math.max(1, Math.round(container!.clientWidth * ratio));
      canvas!.height = Math.max(1, Math.round(container!.clientHeight * ratio));
      render();
      wake();
    }
    function visibilityChanged() {
      cancelAnimationFrame(raf);
      raf = 0;
      previous = 0;
      if (media.matches) setRenderer('fallback');
      else if (!contextLost) setRenderer('webgl');
      wake();
    }
    function loseContext() {
      contextLost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      setRenderer('fallback');
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    document.addEventListener('visibilitychange', visibilityChanged);
    media.addEventListener?.('change', visibilityChanged);
    canvas.addEventListener('webglcontextlost', loseContext);
    resize();
    setRenderer('webgl');

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      media.removeEventListener?.('change', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', loseContext);
      context.deleteProgram(shader.program);
      context.deleteBuffer(buffer);
      context.deleteVertexArray(vao);
      // Let the browser reclaim the context; forcing context loss here breaks
      // React StrictMode's immediate setup/cleanup/setup lifecycle on this canvas.
    };
  }, [cableColor, pulseColor, cableCount, opacity, dpr]);

  return (
    <div
      ref={containerRef}
      className={`care-light-tunnel ${className}`.trim()}
      data-renderer={renderer}
      aria-hidden="true"
    >
      <svg
        className="care-light-tunnel-fallback"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M-80 80C260 130 240 650-80 730M15-30C370 140 340 680 15 840" />
        <path d="M1280 80C940 130 960 650 1280 730M1185-30C830 140 860 680 1185 840" />
      </svg>
      <canvas ref={canvasRef} />
    </div>
  );
}
