// Lightweight runtime validators used before render. Keep these pure and total —
// returning a bool/array, never throwing.

export function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// True when the row has enough to draw something useful. We accept any row that has
// at least a name and a fill percent — temperature/ABV/stage are degrade-gracefully.
export function isRenderable(row) {
  return isNonEmptyString(row?.tankName) && isFiniteNumber(row?.fillPercent);
}

// De-duplicate tank names by appending a sequential suffix when collisions happen.
// Tableau aggregations sometimes produce duplicates — render keys must be unique.
export function deduplicateTanks(rows) {
  const counts = new Map();
  return rows.map((row, i) => {
    const base = row.tankName || `Tank ${i + 1}`;
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen === 0 ? row : { ...row, tankName: `${base} (${seen + 1})`, _renamedFrom: base };
  });
}
