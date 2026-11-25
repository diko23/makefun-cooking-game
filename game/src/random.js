// Seeded deterministic PRNG (Mulberry32) for reproducible shifts and screenshot scenes.

export function createRng(seed = 1) {
  let state = (Number(seed) || 1) >>> 0;
  if (state === 0) state = 0x9e3779b9;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min, maxInclusive) {
    return min + Math.floor(next() * (maxInclusive - min + 1));
  }

  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }

  return { next, int, pick };
}
