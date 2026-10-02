"use client";

import { useEffect, type RefObject } from "react";
import "./engravedFilm.css";

const VERTEX = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

/*
 * Line engraving: diagonal hatching whose stroke widens with the shadow, a second, crossing
 * hatch only in the deepest shadows, and an ink outline where the picture changes sharply.
 */
const FRAGMENT = `
precision mediump float;
uniform sampler2D uFrame;
uniform vec2 uResolution;
uniform vec2 uCover;
uniform float uPitch;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uWeight;
uniform float uCross;
varying vec2 vUv;

float luma(vec2 uv) {
  return dot(texture2D(uFrame, uv).rgb, vec3(0.299, 0.587, 0.114));
}

float hatch(vec2 p, float angle, float width) {
  float t = dot(p, vec2(cos(angle), sin(angle))) / uPitch;
  float distance = abs(fract(t) - 0.5) * 2.0;
  float soft = 1.6 / uPitch;
  return 1.0 - smoothstep(width - soft, width + soft, distance);
}

void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  // Lift the shadows first, so dark footage still reads as shapes rather than solid ink.
  float light = smoothstep(0.04, 0.62, pow(luma(uv), 0.55));
  float shade = 1.0 - light;
  vec2 p = gl_FragCoord.xy;
  float ink = hatch(p, 0.49, shade * 0.92 * uWeight);
  ink = max(ink, hatch(p, -0.62, clamp((shade - 0.72) * 2.2, 0.0, 0.7) * uCross));
  vec2 texel = uCover / uResolution * 1.5;
  float edge = abs(luma(uv + vec2(texel.x, 0.0)) - luma(uv - vec2(texel.x, 0.0)))
    + abs(luma(uv + vec2(0.0, texel.y)) - luma(uv - vec2(0.0, texel.y)));
  ink = max(ink, smoothstep(0.08, 0.22, edge) * 0.9 * uWeight);
  gl_FragColor = vec4(mix(uPaper, uInk, ink), 1.0);
}`;

function toRgb(color: string): [number, number, number] {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return [0, 0, 0];
  context.fillStyle = color;
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(context.fillStyle);
  return match
    ? [parseInt(match[1]!, 16) / 255, parseInt(match[2]!, 16) / 255, parseInt(match[3]!, 16) / 255]
    : [0, 0, 0];
}

/**
 * Redraws a playing video inside `root` as a line engraving in the paper story's ink, on a
 * canvas appended to `root`. `selector` picks the video to read (for a playlist, the active
 * one). It draws only when a new frame exists; without WebGL the plain video shows through.
 *
 * `weight` scales stroke and outline (1 = full, lower is lighter); `cross` scales the second,
 * crossing hatch in the deepest shadows; `pitchPx` is the line spacing in CSS pixels.
 */
export function useEngraving(
  root: RefObject<HTMLElement | null>,
  selector: string,
  {
    weight = 1,
    cross = 1,
    pitchPx = 5,
  }: { weight?: number; cross?: number; pitchPx?: number } = {},
) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    // A fresh canvas per setup: a released context cannot be reused (React Strict Mode re-runs).
    const surface = document.createElement("canvas");
    surface.className = "engraved-film__ink";
    surface.setAttribute("aria-hidden", "true");
    element.append(surface);
    const gl = surface.getContext("webgl", { antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      surface.remove();
      return;
    }
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      surface.remove();
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const style = getComputedStyle(element);
    gl.uniform3fv(uniform("uInk"), toRgb(style.getPropertyValue("--color-world-paper-ink")));
    gl.uniform3fv(uniform("uPaper"), toRgb(style.getPropertyValue("--color-world-paper-light")));
    const resolution = uniform("uResolution");
    const cover = uniform("uCover");
    const pitch = uniform("uPitch");
    gl.uniform1f(uniform("uWeight"), weight);
    gl.uniform1f(uniform("uCross"), cross);

    let frame = 0;
    const active = () => element.querySelector<HTMLVideoElement>(selector);
    const draw = () => {
      frame = 0;
      const video = active();
      if (!video || video.readyState < 2 || !video.videoWidth) return;
      const width = surface.width;
      const height = surface.height;
      // Crop like `object-fit: cover`.
      const film = video.videoWidth / video.videoHeight;
      const view = width / height;
      gl.uniform2f(cover, view > film ? 1 : view / film, view > film ? film / view : 1);
      gl.uniform2f(resolution, width, height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      element.dataset.engraved = "true";
      if (!video.paused) frame = requestAnimationFrame(draw);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      surface.width = Math.round(surface.clientWidth * ratio);
      surface.height = Math.round(surface.clientHeight * ratio);
      gl.viewport(0, 0, surface.width, surface.height);
      gl.uniform1f(pitch, pitchPx * ratio);
      wake();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    const events = ["playing", "loadeddata", "seeked"] as const;
    const videos = Array.from(element.querySelectorAll("video"));
    for (const video of videos) for (const event of events) video.addEventListener(event, wake);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const video of videos)
        for (const event of events) video.removeEventListener(event, wake);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      surface.remove();
      delete element.dataset.engraved;
    };
  }, [root, selector, weight, cross, pitchPx]);
}
