import * as THREE from "three";
import type { RangeFilm } from "@/content/rangeFilms";

/** A poster stays visible until a muted film has a decoded frame. Only the central film plays. */
export function createWorldFilm(film: RangeFilm, mobile: boolean, wake: () => void) {
  const placeholder = new THREE.DataTexture(new Uint8Array([15, 23, 36, 255]), 1, 1);
  placeholder.colorSpace = THREE.SRGBColorSpace;
  placeholder.needsUpdate = true;
  let poster: THREE.Texture = placeholder;
  let video: HTMLVideoElement | null = null;
  let texture: THREE.VideoTexture | null = null;
  let disposed = false;
  let warmed = false;
  let wanted = false;
  let pending = false;
  let blocked = false;
  let decoded = false;
  let mp4 = false;

  function warm() {
    if (warmed || disposed) return;
    warmed = true;
    new THREE.TextureLoader().load(film.poster, (loaded) => {
      if (disposed) return loaded.dispose();
      loaded.colorSpace = THREE.SRGBColorSpace;
      poster = loaded;
      wake();
    });
  }
  function play() {
    if (!video || pending || !wanted || blocked || !video.paused || disposed) return;
    pending = true;
    void video.play().then(
      () => {
        pending = false;
        if (!wanted || disposed) video?.pause();
        wake();
      },
      () => {
        pending = false;
        if (wanted) blocked = true;
        wake();
      },
    );
  }
  function source() {
    if (!video) return;
    const base = mobile ? film.mobileBase : film.base;
    video.src = `${base}.${mp4 ? "mp4" : "webm"}`;
    video.load();
    play();
  }
  function loaded() {
    decoded = true;
    wake();
  }
  function failed() {
    if (!mp4) {
      mp4 = true;
      blocked = false;
      pending = false;
      source();
    } else {
      decoded = false;
      blocked = true;
      video?.pause();
      wake();
    }
  }
  function prepare() {
    if (video || disposed) return;
    video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";
    video.addEventListener("loadeddata", loaded);
    video.addEventListener("error", failed);
    mp4 = !video.canPlayType('video/webm; codecs="vp9"');
    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    source();
  }

  return {
    warm,
    setPlaying(value: boolean) {
      if (wanted !== value) blocked = false;
      wanted = value;
      if (value) {
        prepare();
        play();
      } else video?.pause();
    },
    get texture() {
      return decoded && texture ? texture : poster;
    },
    get aspect() {
      return video?.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
    },
    get playing() {
      return !!video && !video.paused;
    },
    dispose() {
      disposed = true;
      wanted = false;
      if (video) {
        video.removeEventListener("loadeddata", loaded);
        video.removeEventListener("error", failed);
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      texture?.dispose();
      if (poster !== placeholder) poster.dispose();
      placeholder.dispose();
    },
  };
}
