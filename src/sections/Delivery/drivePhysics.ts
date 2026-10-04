export type Velocity = { x: number; y: number };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Directional controls steer a heading; momentum follows with tyre grip and rolling drag. */
export function driveVelocity(
  velocity: Velocity,
  heading: number,
  input: Velocity,
  dt: number,
  maxSpeed: number,
  reduced: boolean,
) {
  const throttle = Math.hypot(input.x, input.y) > 0;
  let turn = 0;
  if (throttle) {
    const wanted = (Math.atan2(input.x, -input.y) * 180) / Math.PI;
    const difference = ((((wanted - heading + 540) % 360) + 360) % 360) - 180;
    const rate = 540 - 120 * Math.min(1, Math.hypot(velocity.x, velocity.y) / maxSpeed);
    turn = reduced ? difference : clamp(difference, -rate * dt, rate * dt);
    heading += turn;
  }
  const radians = (heading * Math.PI) / 180;
  const alignment = throttle
    ? Math.max(
        0.24,
        (Math.sin(radians) * input.x - Math.cos(radians) * input.y) / Math.hypot(input.x, input.y),
      )
    : 0;
  const speed = maxSpeed * alignment;
  const grip = reduced ? 1 : 1 - Math.exp(-dt * (throttle ? 9 : 3.9));
  return {
    heading,
    velocity: {
      x: velocity.x + (Math.sin(radians) * speed - velocity.x) * grip,
      y: velocity.y + (-Math.cos(radians) * speed - velocity.y) * grip,
    },
    turn,
  };
}
