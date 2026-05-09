// Temperature-band colors used by tank fill, glow, and the small temperature chip.
// Bands are in °C — adjust if the upstream column is in °F.

export const TEMP_BANDS = {
  COLD:     { min: -Infinity, max: 8,    color: '#1976d2', label: 'Cold' },
  NORMAL:   { min: 8,         max: 20,   color: '#2e7d32', label: 'Normal' },
  HOT:      { min: 20,        max: 26,   color: '#ef6c00', label: 'Hot' },
  CRITICAL: { min: 26,        max: Infinity, color: '#c62828', label: 'Critical' },
};

export function temperatureBand(value) {
  if (value == null || !Number.isFinite(value)) return TEMP_BANDS.NORMAL;
  if (value < TEMP_BANDS.NORMAL.min)   return TEMP_BANDS.COLD;
  if (value < TEMP_BANDS.HOT.min)      return TEMP_BANDS.NORMAL;
  if (value < TEMP_BANDS.CRITICAL.min) return TEMP_BANDS.HOT;
  return TEMP_BANDS.CRITICAL;
}

// Lighter / darker variants for the SVG fill gradient.
export function tintLight(hex)  { return shiftHex(hex, 0.35); }
export function tintMedium(hex) { return shiftHex(hex, 0.18); }
export function tintDark(hex)   { return shiftHex(hex, -0.20); }

function shiftHex(hex, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  if (amount >= 0) {
    r = r + (255 - r) * amount;
    g = g + (255 - g) * amount;
    b = b + (255 - b) * amount;
  } else {
    r = r * (1 + amount);
    g = g * (1 + amount);
    b = b * (1 + amount);
  }
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

// Status colour for the chip in the tank header.
export function statusColor(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('critical')) return '#c62828';
  if (s.includes('warn'))     return '#ef6c00';
  if (s.includes('healthy') || s.includes('ok')) return '#2e7d32';
  return '#64748b';
}
