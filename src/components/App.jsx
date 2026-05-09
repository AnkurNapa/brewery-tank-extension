import { useCallback, useState } from 'react';
import TankGrid from './TankGrid.jsx';
import StatusOverlay from './StatusOverlay.jsx';
import Tooltip from './Tooltip.jsx';
import { useTableauData } from '../hooks/useTableauData.js';
import { validateColumns } from '../utils/sanitize.js';
import { formatPercent, formatTemperature, formatAbv } from '../utils/format.js';

export default function App() {
  const {
    status, error, rows, missingColumns,
    worksheets, selectedWorksheet, selectWorksheet,
    refresh, isMock,
  } = useTableauData();

  const [tooltip, setTooltip] = useState(null);

  const handleHover = useCallback((tank, event) => {
    setTooltip({
      x: event.clientX, y: event.clientY,
      rows: [
        { label: 'Tank',  value: tank.tankName },
        { label: 'Stage', value: tank.fermentationStage || '—' },
        { label: 'Fill',  value: formatPercent(tank.fillPercent) },
        { label: 'Temp',  value: formatTemperature(tank.temperature) },
        { label: 'ABV',   value: formatAbv(tank.abv) },
        { label: 'Batch', value: tank.batchId || '—' },
        { label: 'Status',value: tank.status || '—' },
      ],
    });
  }, []);

  const handleLeave = useCallback(() => setTooltip(null), []);

  const validation = validateColumns(missingColumns);

  return (
    <div className="relative h-full w-full bg-slate-50">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white">
        <div>
          <div className="text-sm font-semibold text-slate-800">Brewery Tank Monitor</div>
          <div className="text-[10px] text-slate-500">
            {isMock
              ? 'Showing mock data — open this URL inside a Tableau dashboard to see live values.'
              : `Worksheet: ${selectedWorksheet || '—'}  •  ${rows.length} tank(s)`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {worksheets.length > 1 && (
            <select
              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
              value={selectedWorksheet ?? ''}
              onChange={e => selectWorksheet(e.target.value)}
              aria-label="Select source worksheet"
            >
              {worksheets.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
            onClick={refresh}
            aria-label="Refresh tank data"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="absolute inset-0 top-[52px]">
        {status === 'loading' && (
          <StatusOverlay
            icon="info"
            title="Connecting to Tableau…"
            message="Reading dashboard worksheets."
          />
        )}

        {status === 'empty' && (
          <StatusOverlay
            icon="warning"
            title="No tank data"
            message="The selected worksheet has no rows after the current filters."
          />
        )}

        {status === 'error' && (
          <StatusOverlay
            icon="error"
            title="Couldn't load tank data"
            message={error}
            action={
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800"
                onClick={refresh}
              >
                Retry
              </button>
            }
          />
        )}

        {(status === 'ready' || status === 'mock') && (
          <>
            <TankGrid rows={rows} onHover={handleHover} onLeave={handleLeave} />
            {!validation.ok && (
              <div className="absolute bottom-2 right-2 text-[10px] text-temp-hot bg-white border border-temp-hot/30 rounded px-2 py-1 shadow-sm">
                Missing column(s): {validation.missingRequired.join(', ')}
              </div>
            )}
            {validation.ok && validation.missingOptional.length > 0 && (
              <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-white border border-slate-200 rounded px-2 py-1">
                Optional column(s) not mapped: {validation.missingOptional.join(', ')}
              </div>
            )}
          </>
        )}
      </div>

      <Tooltip tooltip={tooltip} />
    </div>
  );
}
