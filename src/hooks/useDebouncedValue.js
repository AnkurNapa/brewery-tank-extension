import { useEffect, useState } from 'react';

/**
 * Returns a value that lags behind the input by `delayMs`. Used to smooth out
 * downstream layout work when an upstream value (size, filter selection) flaps.
 */
export function useDebouncedValue(value, delayMs = 150) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
