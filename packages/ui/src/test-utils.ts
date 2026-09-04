/** Resolves a --lause-* colour variable to the rgb() string getComputedStyle reports. */
export function tokenRgb(name: string): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}
