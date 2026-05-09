// Thin wrapper over the Tableau Dashboard Extensions API. No React in here on purpose —
// kept testable and callable from anywhere. All public functions are async and resolve to
// `{ ok, ...payload }` or `{ ok: false, error, code }` shapes so callers don't have to
// remember which functions throw.

import { sanitizeRow, validateColumns } from '../utils/sanitize.js';

const SCHEMA = {
  TankName:          ['tankname', 'tank name', 'tank', 'tank_name'],
  Temperature:       ['temperature', 'temp', 'temperaturec', 'temperature_c', 'temp_c'],
  ABV:               ['abv', 'abv%', 'alcohol', 'alcoholpercent'],
  FillPercent:       ['fillpercent', 'fill', 'fill_percent', 'fillpct', 'fill%'],
  FermentationStage: ['fermentationstage', 'stage', 'fermentation_stage', 'fermentation'],
  BatchID:           ['batchid', 'batch', 'batch_id', 'batch#'],
  Status:            ['status', 'state', 'health'],
};

export const TABLEAU_NOT_AVAILABLE = 'TABLEAU_NOT_AVAILABLE';
export const NOT_IN_DASHBOARD = 'NOT_IN_DASHBOARD';
export const NO_WORKSHEETS = 'NO_WORKSHEETS';
export const WORKSHEET_NOT_FOUND = 'WORKSHEET_NOT_FOUND';
export const INIT_FAILED = 'INIT_FAILED';
export const READ_FAILED = 'READ_FAILED';

let initPromise = null;

export function isTableauAvailable() {
  return typeof window !== 'undefined'
      && !!window.tableau
      && !!window.tableau.extensions;
}

export async function initialize() {
  if (!isTableauAvailable()) {
    return { ok: false, code: TABLEAU_NOT_AVAILABLE };
  }
  if (!initPromise) {
    initPromise = window.tableau.extensions.initializeAsync({ configure: undefined });
  }
  try {
    await initPromise;
    return { ok: true };
  } catch (err) {
    initPromise = null;
    return { ok: false, code: INIT_FAILED, error: err };
  }
}

export function getDashboard() {
  if (!isTableauAvailable()) return null;
  const dc = window.tableau.extensions.dashboardContent;
  return dc?.dashboard ?? null;
}

export function listWorksheets() {
  const d = getDashboard();
  if (!d) return [];
  return (d.worksheets ?? []).map(w => w.name);
}

export function findWorksheet(name) {
  const d = getDashboard();
  if (!d) return null;
  if (name) {
    const exact = d.worksheets.find(w => w.name === name);
    if (exact) return exact;
  }
  return d.worksheets[0] ?? null;
}

// Reads summary (aggregated mark) data from the named worksheet (or first one) and maps
// columns to the tank schema. Returns { ok, rows, columns, missingColumns, worksheetName }.
export async function readWorksheet(worksheetName, options = {}) {
  if (!isTableauAvailable()) return { ok: false, code: TABLEAU_NOT_AVAILABLE };

  const d = getDashboard();
  if (!d) return { ok: false, code: NOT_IN_DASHBOARD };

  if (!d.worksheets?.length) return { ok: false, code: NO_WORKSHEETS };

  const worksheet = findWorksheet(worksheetName);
  if (!worksheet) return { ok: false, code: WORKSHEET_NOT_FOUND };

  let dataTable;
  try {
    dataTable = await worksheet.getSummaryDataAsync({
      ignoreSelection: true,
      maxRows: options.maxRows ?? 5000,
    });
  } catch (err) {
    return { ok: false, code: READ_FAILED, error: err, worksheetName: worksheet.name };
  }

  const colByCanonical = {};
  dataTable.columns.forEach((col, i) => {
    colByCanonical[canonical(col.fieldName)] = i;
  });

  const colIndex = {};
  for (const [field, aliases] of Object.entries(SCHEMA)) {
    const found = aliases.find(a => colByCanonical[a] != null);
    colIndex[field] = found != null ? colByCanonical[found] : -1;
  }

  const missingColumns = Object.entries(colIndex)
    .filter(([, idx]) => idx < 0)
    .map(([k]) => k);

  const rows = dataTable.data.map((row, rowIndex) => sanitizeRow({
    tankName:          colIndex.TankName          >= 0 ? row[colIndex.TankName].formattedValue   : `Tank ${rowIndex + 1}`,
    temperature:       colIndex.Temperature       >= 0 ? toNum(row[colIndex.Temperature])        : null,
    abv:               colIndex.ABV               >= 0 ? toNum(row[colIndex.ABV])                : null,
    fillPercent:       colIndex.FillPercent       >= 0 ? toNum(row[colIndex.FillPercent])        : null,
    fermentationStage: colIndex.FermentationStage >= 0 ? row[colIndex.FermentationStage].formattedValue : '',
    batchId:           colIndex.BatchID           >= 0 ? row[colIndex.BatchID].formattedValue    : '',
    status:            colIndex.Status            >= 0 ? row[colIndex.Status].formattedValue     : '',
    _rowIndex:         rowIndex,
  }));

  return {
    ok: true,
    rows,
    columns: dataTable.columns.map(c => c.fieldName),
    missingColumns,
    worksheetName: worksheet.name,
  };
}

// Subscribe to filter / mark / settings changes on a worksheet. Returns an unsubscribe.
export function subscribeWorksheet(worksheetName, callback) {
  const worksheet = findWorksheet(worksheetName);
  if (!worksheet) return () => {};

  const eventTypes = [
    window.tableau.TableauEventType.FilterChanged,
    window.tableau.TableauEventType.MarkSelectionChanged,
    window.tableau.TableauEventType.ParameterChanged,
  ];

  const unsubFns = eventTypes
    .map(et => safeAdd(worksheet, et, callback))
    .filter(Boolean);

  return () => {
    for (const fn of unsubFns) {
      try { fn(); } catch { /* swallow — best effort cleanup */ }
    }
  };
}

// Subscribe to dashboard-level events (worksheet add/remove/rename, settings).
export function subscribeDashboard(callback) {
  const d = getDashboard();
  if (!d) return () => {};
  const fn = safeAdd(d, window.tableau.TableauEventType.DashboardLayoutChanged, callback);
  return () => { try { fn?.(); } catch { /* */ } };
}

function safeAdd(target, eventType, cb) {
  try {
    return target.addEventListener(eventType, cb);
  } catch {
    return null;
  }
}

function toNum(cell) {
  if (cell == null) return null;
  const v = cell.nativeValue ?? cell.value;
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function canonical(s) {
  return String(s ?? '').toLowerCase().replace(/[\s_\-#%]+/g, '');
}

export const __test = { canonical, toNum, validateColumns };
