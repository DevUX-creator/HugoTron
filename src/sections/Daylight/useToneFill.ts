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
precision mediump float;
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
  gl_FragColor = vec4(color, 1.0 - smoothstep(-pixel, pixel, edge));
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

/**
 * A full-viewport WebGL fill in the colour of the CSS custom property `colorVar`. Attach the
 * returned `canvas` ref; `draw(progress)` paints only when called, so an idle page costs nothing.
 */
export function useToneFill(colorVar: string) {
  const canvas = useRef<HTMLDivElement>(null);
  const draw = useRef<(progress: number) => void>(() => {});

  useEffect(() => {
    const host = canvas.current;
    if (!host) return;
    // Own a fresh canvas per setup: Strict Mode may clean up and set up the same host.
    const element = document.createElement("canvas");
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.display = "block";
    host.append(element);
    const gl = element.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    // A failed context still has a simple rising paper wipe and readable chapters.
    if (!gl) {
      element.style.backgroundColor = `var(${colorVar})`;
      draw.current = (progress) => {
        host.dataset.active = String(progress > 0);
        element.style.clipPath = `inset(${(1 - progress) * 100}% 0 0)`;
      };
      return () => {
        draw.current = () => {};
        element.remove();
      };
    }
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
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      element.width = Math.round(element.clientWidth * ratio);
      element.height = Math.round(element.clientHeight * ratio);
      gl.viewport(0, 0, element.width, element.height);
      gl.uniform2f(resolutionLocation, element.width, element.height);
      const progress = Math.max(0, last);
      last = -1;
      draw.current(progress);
    };
    draw.current = (progress: number) => {
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
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => {
      observer.disconnect();
      draw.current = () => {};
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      element.remove();
    };
  }, [colorVar]);

  return { canvas, draw };
}
