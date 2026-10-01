"use client";

import { useEffect, useRef } from "react";

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
uniform float uSpread;
varying vec2 vUv;
float hash(vec2 p) {
  return fract(sin(dot(vec3(p, 1.0), vec3(37.1, 61.7, 12.4))) * 3758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f *= f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  return noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125;
}
void main() {
  vec2 centred = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float edge = vUv.y - uProgress * 1.2 + fbm(centred * 15.0) * uSpread;
  float pixel = 1.0 / uResolution.y;
  gl_FragColor = vec4(uColor, 1.0 - smoothstep(-pixel, pixel, edge));
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
  const canvas = useRef<HTMLCanvasElement>(null);
  const draw = useRef<(progress: number) => void>(() => {});

  useEffect(() => {
    const element = canvas.current;
    const gl = element?.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!element || !gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
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
    gl.uniform1f(uniform("uSpread"), 0.5);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let last = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(element.clientWidth * ratio);
      element.height = Math.round(element.clientHeight * ratio);
      gl.viewport(0, 0, element.width, element.height);
      gl.uniform2f(resolutionLocation, element.width, element.height);
      draw.current(last);
    };
    draw.current = (progress: number) => {
      last = progress;
      // Hidden while empty, so the canvas costs nothing before the fill begins.
      element.dataset.active = String(progress > 0);
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
    };
  }, [colorVar]);

  return { canvas, draw };
}
