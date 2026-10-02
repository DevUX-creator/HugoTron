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
    let visible = false;
    let disposed = false;
    let failed = false;
    let frame = 0;
    let videoFrame: number | undefined;
    let videoOwner: HTMLVideoElement | undefined;
    let renderer: ReturnType<typeof createEngravingSurface> | undefined;
    let lastVideo: HTMLVideoElement | undefined;
    let lastDecoded: number | undefined;
    let lastTime = -1;
    let dirty = true;
    const videos = Array.from(element.querySelectorAll("video"));
    const active = () => element.querySelector<HTMLVideoElement>(selector);
    const allowed = () => visible && !document.hidden && !disposed && !failed;
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (videoFrame !== undefined) videoOwner?.cancelVideoFrameCallback(videoFrame);
      videoFrame = undefined;
      videoOwner = undefined;
    };
    const draw = (video: HTMLVideoElement) => {
      if (!allowed() || video.readyState < 2 || !video.videoWidth) return;
      const decoded = video.getVideoPlaybackQuality?.().totalVideoFrames;
      const sameFrame =
        decoded === undefined ? video.currentTime === lastTime : decoded === lastDecoded;
      if (!dirty && video === lastVideo && sameFrame) return;
      // No context, texture or drawing buffer is allocated until a visible film has a frame.
      renderer ??= createEngravingSurface(element, { weight, cross, pitchPx });
      if (!renderer) {
        failed = true;
        stop();
        return;
      }
      renderer.draw(video);
      lastVideo = video;
      lastDecoded = decoded;
      lastTime = video.currentTime;
      dirty = false;
    };
    const scheduleVideo = (video: HTMLVideoElement) => {
      if (!allowed() || video.paused || video.ended) return;
      if (typeof video.requestVideoFrameCallback !== "function") {
        // Older engines use rAF, but the decoded-frame check still skips repeated uploads.
        if (!frame) frame = requestAnimationFrame(sync);
        return;
      }
      if (videoFrame !== undefined) return;
      videoOwner = video;
      videoFrame = video.requestVideoFrameCallback(() => {
        videoFrame = undefined;
        videoOwner = undefined;
        if (!allowed() || active() !== video) return;
        draw(video);
        scheduleVideo(video);
      });
    };
    function sync() {
      frame = 0;
      if (!allowed()) return;
      const video = active();
      if (!video) return;
      if (videoOwner && (videoOwner !== video || video.paused)) {
        videoOwner.cancelVideoFrameCallback(videoFrame!);
        videoFrame = undefined;
        videoOwner = undefined;
      }
      draw(video);
      scheduleVideo(video);
    }
    const wake = () => {
      if (allowed() && !frame) frame = requestAnimationFrame(sync);
    };
    const resize = () => {
      dirty = true;
      wake();
    };
    const seeked = () => {
      dirty = true;
      wake();
    };
    const visibility = () => {
      stop();
      wake();
    };
    const view = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      visibility();
    });
    view.observe(element);
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    // React commits the playlist's active slot after the media playing event.
    // Follow that change so the new slot can never leave a stale engraving behind.
    const selection = new MutationObserver(() => {
      stop();
      wake();
    });
    for (const video of videos) {
      selection.observe(video, { attributes: true, attributeFilter: ["data-active"] });
      for (const event of ["playing", "loadeddata", "pause", "ended"])
        video.addEventListener(event, wake);
      video.addEventListener("seeked", seeked);
    }
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true;
      stop();
      view.disconnect();
      observer.disconnect();
      selection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      for (const video of videos) {
        for (const event of ["playing", "loadeddata", "pause", "ended"])
          video.removeEventListener(event, wake);
        video.removeEventListener("seeked", seeked);
      }
      renderer?.dispose();
    };
  }, [root, selector, weight, cross, pitchPx]);
}

/** Owns one video texture and one lazily created context; visual shader is unchanged. */
function createEngravingSurface(
  element: HTMLElement,
  { weight, cross, pitchPx }: { weight: number; cross: number; pitchPx: number },
) {
  const surface = document.createElement("canvas");
  surface.className = "engraved-film__ink";
  surface.setAttribute("aria-hidden", "true");
  element.append(surface);
  const gl = surface.getContext("webgl", { antialias: false, preserveDrawingBuffer: false });
  if (!gl) {
    surface.remove();
    return null;
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
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    surface.remove();
    return null;
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
  let sourceWidth = 0,
    sourceHeight = 0,
    sized = false;
  return {
    draw(video: HTMLVideoElement) {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(surface.clientWidth * ratio));
      const height = Math.max(1, Math.round(surface.clientHeight * ratio));
      if (!sized || surface.width !== width || surface.height !== height) {
        sized = true;
        surface.width = width;
        surface.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform1f(pitch, pitchPx * ratio);
        gl.uniform2f(resolution, width, height);
      }
      const film = video.videoWidth / video.videoHeight;
      const view = width / height;
      gl.uniform2f(cover, view > film ? 1 : view / film, view > film ? film / view : 1);
      if (sourceWidth !== video.videoWidth || sourceHeight !== video.videoHeight) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
        sourceWidth = video.videoWidth;
        sourceHeight = video.videoHeight;
      } else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (element.dataset.engraved !== "true") element.dataset.engraved = "true";
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      surface.remove();
      delete element.dataset.engraved;
    },
  };
}
