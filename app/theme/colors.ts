export const colors = {
    brand: {
        primary: "#2E7D32",
        primaryContainer: "#2d4739",
        primaryFixed: "#d6e4d8",
        primaryFixedDim: "#b8cdbb",
        secondary: "#1565C0",
        tertiaryContainer: "#d5a24a",
        onTertiaryContainer: "#173124",
        accent: "#63FFA4",
        info: "#2196F3",
    },
    background: {
        app: "#F5F5F5",
        gardenHeader: "#63FFA4",
        gardenMap: "#7EC850",
        mapBorder: "#C4A46C",
    },
    surface: {
        base: "#FFFFFF",
        soft: "#F5F5F5",
        subtle: "#F3F8F4",
        raised: "rgba(255,255,255,0.96)",
        raisedMuted: "rgba(255,255,255,0.92)",
    },
    text: {
        primary: "#1B1B1B",
        secondary: "#666666",
        muted: "#999999",
        onDark: "#FFFFFF",
    },
    border: {
        light: "#E3EEE5",
        medium: "#DDEFE1",
        accent: "#2E7D32",
    },
    state: {
        danger: "#FF4444",
        dangerSoft: "#FFEBEE",
        successSoft: "#E8F5E9",
        infoSoft: "#E3F2FD",
    },
    overlay: {
        backdrop: "rgba(0,0,0,0.4)",
        shadow: "#000000",
        white50: "rgba(255,255,255,0.5)",
    },
} as const;

function clampAlpha(alpha: number): number {
    'worklet';
    if (Number.isNaN(alpha)) return 1;
    return Math.max(0, Math.min(1, alpha));
}

function normalizeHex(input: string): string {
    'worklet';
    const hex = input.replace("#", "").trim();
    if (hex.length === 3) {
        return `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    return hex;
}

export function withAlpha(hexColor: string, alpha: number): string {
    'worklet';
    const normalized = normalizeHex(hexColor);
    if (normalized.length !== 6) {
        return hexColor;
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    const safeAlpha = clampAlpha(alpha);
    return `rgba(${r},${g},${b},${safeAlpha})`;
}
