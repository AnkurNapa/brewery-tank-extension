import { format } from 'd3';

const intFmt = format(',d');
const pctFmt = format('.1f');
const tempFmt = format('.1f');
const abvFmt = format('.1f');

export function formatPercent(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${pctFmt(value)}%`;
}

export function formatTemperature(value, unit = '°C') {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${tempFmt(value)} ${unit}`;
}

export function formatAbv(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${abvFmt(value)}% ABV`;
}

export function formatInt(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  return intFmt(value);
}
