import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initialize,
  readWorksheet,
  subscribeWorksheet,
  subscribeDashboard,
  listWorksheets,
  isTableauAvailable,
  TABLEAU_NOT_AVAILABLE,
} from '../services/tableau.js';
import { MOCK_TANKS, MOCK_COLUMNS } from '../services/mockData.js';

/**
 * Top-level data hook for the extension. Encapsulates Tableau init, the active
 * worksheet, refreshes on filter/parameter/dashboard events, and a debounced
 * refresh to prevent re-render storms on rapid filter spam.
 *
 * Returns:
 *   status:           'loading' | 'ready' | 'mock' | 'empty' | 'error'
 *   error:            string | null
 *   rows:             Tank[]
 *   columns:          string[]
 *   missingColumns:   string[]   (columns the schema expects but worksheet doesn't have)
 *   worksheets:       string[]
 *   selectedWorksheet:string | null
 *   selectWorksheet:  (name) => void
 *   refresh:          () => Promise<void>
 *   isMock:           boolean    (true when running outside Tableau)
 */
export function useTableauData(options = {}) {
  const { initialWorksheet = null, debounceMs = 200 } = options;

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [missingColumns, setMissingColumns] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState(initialWorksheet);
  const [isMock, setIsMock] = useState(false);

  // Refs for stable closures / cleanup tracking. Avoids the classic stale-closure trap
  // when the same callback is captured by long-lived event listeners.
  const mountedRef = useRef(true);
  const debounceRef = useRef(null);
  const wsUnsubRef = useRef(null);
  const dashUnsubRef = useRef(null);

  const setSafe = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const loadFromTableau = useCallback(async (worksheetName) => {
    const result = await readWorksheet(worksheetName);
    if (!mountedRef.current) return;

    if (!result.ok) {
      setStatus('error');
      setError(humanError(result));
      return;
    }
    setRows(result.rows);
    setColumns(result.columns);
    setMissingColumns(result.missingColumns);
    setSelectedWorksheet(result.worksheetName);
    setStatus(result.rows.length === 0 ? 'empty' : 'ready');
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (isMock) {
      setRows(MOCK_TANKS);
      setColumns(MOCK_COLUMNS);
      setMissingColumns([]);
      setStatus('mock');
      return;
    }
    await loadFromTableau(selectedWorksheet);
  }, [isMock, selectedWorksheet, loadFromTableau]);

  // Debounced refresh: filter changes can fire several times in quick succession.
  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      refresh();
    }, debounceMs);
  }, [refresh, debounceMs]);

  // Initial mount: try Tableau, fall back to mock data otherwise.
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      if (!isTableauAvailable()) {
        await waitForTableau(2000);
      }
      if (cancelled) return;

      const init = await initialize();
      if (cancelled) return;

      if (!init.ok) {
        if (init.code === TABLEAU_NOT_AVAILABLE) {
          // Outside Tableau — show mock data so devs / users opening the URL
          // directly aren't staring at a blank page.
          setSafe(() => {
            setIsMock(true);
            setRows(MOCK_TANKS);
            setColumns(MOCK_COLUMNS);
            setMissingColumns([]);
            setStatus('mock');
            setError(null);
          });
        } else {
          setSafe(() => {
            setStatus('error');
            setError('Failed to initialize Tableau Extensions API. Reload the workbook or re-add the extension.');
          });
        }
        return;
      }

      const ws = listWorksheets();
      if (mountedRef.current) setWorksheets(ws);

      await loadFromTableau(initialWorksheet);

      if (cancelled || !mountedRef.current) return;

      // Wire up listeners *after* initial load so we don't double-fetch.
      wsUnsubRef.current = subscribeWorksheet(initialWorksheet, scheduleRefresh);
      dashUnsubRef.current = subscribeDashboard(() => {
        if (mountedRef.current) setWorksheets(listWorksheets());
        scheduleRefresh();
      });
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (wsUnsubRef.current)  wsUnsubRef.current();
      if (dashUnsubRef.current) dashUnsubRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-subscribe when the user picks a different worksheet.
  const selectWorksheet = useCallback((name) => {
    if (wsUnsubRef.current) { wsUnsubRef.current(); wsUnsubRef.current = null; }
    setSelectedWorksheet(name);
    if (!isMock) {
      loadFromTableau(name);
      wsUnsubRef.current = subscribeWorksheet(name, scheduleRefresh);
    }
  }, [isMock, loadFromTableau, scheduleRefresh]);

  return {
    status, error, rows, columns, missingColumns,
    worksheets, selectedWorksheet, selectWorksheet,
    refresh, isMock,
  };
}

function humanError(result) {
  switch (result.code) {
    case 'NOT_IN_DASHBOARD':    return 'This extension must be added to a dashboard zone, not a worksheet.';
    case 'NO_WORKSHEETS':       return 'The dashboard has no worksheets. Add a worksheet, then refresh.';
    case 'WORKSHEET_NOT_FOUND': return 'The selected worksheet was renamed or removed. Pick another worksheet.';
    case 'READ_FAILED':         return 'Could not read worksheet data. Check that columns are mapped correctly.';
    case 'INIT_FAILED':         return 'Tableau Extensions API failed to initialize.';
    default:                    return result.error?.message || 'Unknown error.';
  }
}

function waitForTableau(timeoutMs) {
  return new Promise(resolve => {
    if (isTableauAvailable()) return resolve(true);
    const start = Date.now();
    const timer = setInterval(() => {
      if (isTableauAvailable() || Date.now() - start > timeoutMs) {
        clearInterval(timer);
        resolve(isTableauAvailable());
      }
    }, 100);
  });
}
