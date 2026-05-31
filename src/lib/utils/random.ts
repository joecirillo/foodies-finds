export const pickRandom = <T>(arr: T[]): T | undefined =>
  arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : undefined
