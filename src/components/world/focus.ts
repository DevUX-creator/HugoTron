/** A shared, uneven foreground lens for the composite, flowing lines and sparks. */
export const foregroundFocusShader = /* glsl */ `
  float foregroundVeil(vec2 uv, float time) {
    vec2 drift = vec2(sin(time * 0.12) * 0.018, cos(time * 0.09) * 0.012);
    vec2 left = (uv - vec2(0.1, 0.29) - drift) / vec2(0.23, 0.25);
    vec2 right = (uv - vec2(0.91, 0.18) + drift) / vec2(0.24, 0.28);
    float banks = exp(-dot(left, left) * 1.4) + exp(-dot(right, right) * 1.6);
    float opening = sin(uv.x * 11.0 + uv.y * 7.0 + time * 0.06) * 0.6
      + cos(uv.y * 14.0 - uv.x * 4.0) * 0.4;
    return min(banks, 1.0) * mix(0.2, 1.0, smoothstep(-0.55, 0.65, opening));
  }
  float foregroundClear(vec2 uv, float aspect, vec2 pointer) {
    return smoothstep(0.1, 0.4, length((uv - pointer) * vec2(aspect, 1.0)));
  }
  float foregroundSoftness(vec2 uv, float aspect, vec2 pointer, float time) {
    float veil = foregroundVeil(uv, time);
    float lower = 1.0 - smoothstep(0.04, 0.46, uv.y);
    return max(lower * (0.8 + veil * 0.2), veil * 0.5) * foregroundClear(uv, aspect, pointer);
  }
`;
