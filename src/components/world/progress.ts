/** Hold the low flight composition, before the camera's upward bank. */
export const WORLD_FLIGHT_END = 0.6;

/** Keep the camera, shaders and DOM shading on the same part of the original flight. */
export const worldFlightProgress = (chapter: number) => chapter * WORLD_FLIGHT_END;

export function worldScrollMetrics(height: number, mobile: boolean) {
  return {
    flight: height * (mobile ? 1.15 : 1.3),
    filmPause: height * 0.25,
    filmStep: height * 0.95,
    /* The last film rests, then Daylight's hand-off (fall away, paper) runs while still pinned.
       Keep it at least as long as Daylight's runway (daylight.css). */
    endHold: height * 1.95,
  };
}
