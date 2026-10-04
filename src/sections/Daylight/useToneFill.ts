"use client";

import { useEffect, useRef } from "react";
import { PAPER_NOISE } from "./paperNoise";

const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/* The light rises from the bottom; fbm noise breaks its edge into a crisp, torn front. */
const FRAGMENT = `
// Pixel-space paper noise exceeds the 16-bit mediump range on mobile GPUs.
precision highp float;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec3 uColor;
varying vec2 vUv;
${PAPER_NOISE}
void main() {
  vec2 centred = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float torn = fbm(centred * 15.0) * 0.12;
  float edge = vUv.y + torn + 0.02 - uProgress * 1.14;
  float pixel = 1.0 / uResolution.y;
  vec2 paper = vUv * uResolution;
  float grain = hash(paper) - 0.5;
  float fibres = noise(paper * vec2(0.035, 0.6)) - 0.5;
  float pulp = fbm(centred * 3.0) - 0.44;
  vec3 color = uColor + grain * 0.026 + fibres * 0.014 + pulp * 0.022;
  float alpha = 1.0 - smoothstep(-pixel, pixel, edge);
  if (alpha <= 0.0) discard;
  // Safari composites the canvas as a premultiplied surface. Empty pixels must
  // contain no paper colour, otherwise the dark scene acquires a pale veil.
  gl_FragColor = vec4(color * alpha, alpha);
}`;

/** Any CSS colour (a token's resolved value) as 0–1 RGB. */
function toRgb(color: string): [number, number, number] {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return [0.92, 0.9, 0.86];
  context.fillStyle = color;
  const hex = context.fillStyle;
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  return match
    ? [parseInt(match[1]!, 16) / 255, parseInt(match[2]!, 16) / 255, parseInt(match[3]!, 16) / 255]
    : [0.92, 0.9, 0.86];
}

type Fill = { paint: (progress: number) => void; dispose: () => void };

/** Phones get the static torn sheet: no WebGL context and no per-frame redraw of the viewport. */
const PHONE = "(width < 48rem)";

/**
 * A full-viewport fill in the colour of the CSS custom property `colorVar`, rising with
 * `draw(progress)`. Wide screens paint a WebGL paper front; phones move a torn paper sheet with
 * a transform only. Attach the returned `canvas` ref; nothing paints until `draw` is called.
 */
export function useToneFill(colorVar: string) {
  const canvas = useRef<HTMLDivElement>(null);
  const draw = useRef<(progress: number) => void>(() => {});

  useEffect(() => {
    const host = canvas.current;
    if (!host) return;
    const phone = matchMedia(PHONE);
    let latest = 0;
    let fill: Fill = phone.matches ? tornSheet(host) : shaderFill(host, colorVar);
    draw.current = (progress) => {
      latest = progress;
      fill.paint(progress);
    };
    // A rotation across the breakpoint swaps the fill and keeps the paper where it was.
    const swap = () => {
      fill.dispose();
      fill = phone.matches ? tornSheet(host) : shaderFill(host, colorVar);
      fill.paint(latest);
    };
    phone.addEventListener("change", swap);
    return () => {
      phone.removeEventListener("change", swap);
      draw.current = () => {};
      fill.dispose();
      delete host.dataset.active;
    };
  }, [colorVar]);

  return { canvas, draw };
}

/**
 * A sheet with a torn top edge (the mask in daylight.css), moved with `translate` only, so the
 * compositor scrolls it without repainting. Its edge follows the shader front's mapping, so the
 * header turns light at the same moment on every screen.
 */
function tornSheet(host: HTMLDivElement): Fill {
  const sheet = document.createElement("div");
  sheet.className = "daylight__sheet";
  host.append(sheet);
  let last = -1;
  return {
    paint(progress) {
      if (progress === last) return;
      last = progress;
      host.dataset.active = String(progress > 0);
      // The shader's front stands at progress × 1.14 − 0.02 of the viewport, from the bottom.
      const top = Math.min(1, Math.max(0, 1.02 - progress * 1.14));
      sheet.style.translate = `0 ${(top * 100).toFixed(2)}%`;
    },
    dispose() {
      sheet.remove();
    },
  };
}

function shaderFill(host: HTMLDivElement, colorVar: string): Fill {
  // Own a fresh canvas per setup: Strict Mode may clean up and set up the same host.
  const element = document.createElement("canvas");
  element.style.width = "100%";
  element.style.height = "100%";
  element.style.display = "block";
  host.append(element);
  const gl = element.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  // A failed context/program still has a rising paper wipe and readable chapters.
  const fallback = (): Fill => {
    element.style.backgroundColor = `var(${colorVar})`;
    return {
      paint(progress) {
        host.dataset.active = String(progress > 0);
        element.style.clipPath = `inset(${(1 - progress) * 100}% 0 0)`;
      },
      dispose() {
        element.remove();
      },
    };
  };
  if (!gl) return fallback();
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram()!;
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return fallback();
  }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const progressLocation = uniform("uProgress");
  const resolutionLocation = uniform("uResolution");
  gl.uniform3fv(uniform("uColor"), toRgb(getComputedStyle(element).getPropertyValue(colorVar)));

  let last = -1;
  const paint = (progress: number) => {
    if (progress === last) return;
    last = progress;
    // Hidden while empty, so the canvas costs nothing before the fill begins.
    host.dataset.active = String(progress > 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (progress <= 0) return;
    gl.uniform1f(progressLocation, progress);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    element.width = Math.round(element.clientWidth * ratio);
    element.height = Math.round(element.clientHeight * ratio);
    gl.viewport(0, 0, element.width, element.height);
    gl.uniform2f(resolutionLocation, element.width, element.height);
    const progress = Math.max(0, last);
    last = -1;
    paint(progress);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(element);
  resize();
  return {
    paint,
    dispose() {
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      element.remove();
    },
  };
}
