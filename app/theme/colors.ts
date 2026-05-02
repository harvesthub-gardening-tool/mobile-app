export const colors = {
  base: {
    black: "#000000",
    white: "#FFFFFF",
  },
  text: {
    primary: "#191c1b",
    secondary: "#2f3632",
    muted: "#6b746e",
    subtle: "#8d968f",
    onPrimary: "#ffffff",
  },
  brand: {
    primary: "#173124",
    primaryContainer: "#2d4739",
    primaryFixed: "#d6e4d8",
    primaryFixedDim: "#b8cdbb",
    secondary: "#6b5c45",
    secondaryContainer: "#8b7657",
    secondaryFixed: "#e8dfce",
    tertiaryContainer: "#d5a24a",
    onTertiaryContainer: "#173124",
    accent: "#63FFA4",
    info: "#2f7bd6",
  },
  surface: {
    base: "#f8faf8",
    low: "#f2f4f2",
    lowest: "#ffffff",
    glass: "rgba(248,250,248,0.70)",
  },
  state: {
    success: "#2e7d32",
    successSoft: "#e8f5e9",
    warning: "#f0c96a",
    warningSoft: "#fff8e1",
    danger: "#c23939",
    dangerSoft: "#ffebee",
    infoSoft: "#e3f2fd",
  },
  border: {
    subtle: "#c2c8c2",
  },
  overlay: {
    backdrop: "rgba(25,28,27,0.38)",
    shadow: "rgba(25,28,27,0.06)",
  },
  garden: {
    map: "#7ec850",
    mapBorder: "#c4a46c",
  },
} as const;

function normalizeHex(hex: string): string {
  'worklet';
  const value = hex.replace("#", "").trim();
  if (value.length === 3) {
    return `${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`;
  }
  return value;
}

export function withAlpha(hexColor: string, alpha: number): string {
  'worklet';
  const hex = normalizeHex(hexColor);
  if (hex.length !== 6) {
    return hexColor;
  }
  const a = Math.max(0, Math.min(1, alpha));
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
