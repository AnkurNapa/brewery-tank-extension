import { memo, useId } from 'react';
import { temperatureBand, tintLight, tintDark, statusColor } from '../utils/colors.js';
import { formatPercent, formatTemperature, formatAbv } from '../utils/format.js';
import { safeId, safeText } from '../utils/sanitize.js';

const TANK_LEFT = 10;
const TANK_RIGHT = 90;
const TANK_TOP = 14;
const TANK_BOTTOM = 86;
const TANK_W = TANK_RIGHT - TANK_LEFT;
const TANK_H = TANK_BOTTOM - TANK_TOP;

// Pre-computed wave path. Width is 200 (twice the tank's 80) so a -50% translate
// loops seamlessly. Path is filled (closes back to baseline). The wave's natural
// surface line sits at y=4 within its own coordinate system; we translate the whole
// path to ride at the top of the liquid.
const WAVE_PATH = (() => {
  const amp = 2.4;
  const baseline = 4;
  // Two full sine periods over x=0..200, then drop to a high y to ensure a fill below.
  return [
    `M 0 ${baseline}`,
    `C 25 ${baseline - amp}, 25 ${baseline + amp}, 50 ${baseline}`,
    `S 75 ${baseline - amp}, 100 ${baseline}`,
    `S 125 ${baseline + amp}, 150 ${baseline}`,
    `S 175 ${baseline - amp}, 200 ${baseline}`,
    `V 100`,
    `H 0`,
    `Z`,
  ].join(' ');
})();

function Tank({ tank, onHover, onLeave }) {
  const reactId = useId();
  const idBase = safeId(`${tank.tankName}-${reactId}`);
  const clipId = `clip-${idBase}`;
  const gradId = `grad-${idBase}`;
  const titleId = `title-${idBase}`;
  const descId = `desc-${idBase}`;

  const band = temperatureBand(tank.temperature);
  const isCritical = band.label === 'Critical' || /critical/i.test(tank.status);
  const isActiveFermentation = /active/i.test(tank.fermentationStage);

  const fill = Math.max(0, Math.min(100, tank.fillPercent ?? 0));
  const liquidTopY = TANK_BOTTOM - (TANK_H * fill) / 100;
  const liquidHeight = TANK_BOTTOM - liquidTopY;

  const handleEnter = (e) => {
    onHover?.(tank, e);
  };
  const handleMove = (e) => {
    onHover?.(tank, e);
  };
  const handleLeave = () => {
    onLeave?.();
  };
  const handleFocus = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    onHover?.(tank, { clientX: r.left + r.width / 2, clientY: r.top });
  };

  return (
    <div
      className="tank-card bg-white rounded-md border border-slate-200 p-3 flex flex-col gap-2 outline-none focus-visible:ring-2 focus-visible:ring-tank-accent"
      tabIndex={0}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onFocus={handleFocus}
      onBlur={handleLeave}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div id={titleId} className="text-sm font-semibold text-slate-800 truncate">
            {safeText(tank.tankName)}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500 truncate">
            {safeText(tank.fermentationStage) || '—'}
          </div>
        </div>
        {tank.status && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: statusColor(tank.status) + '22',
              color: statusColor(tank.status),
            }}
          >
            {safeText(tank.status)}
          </span>
        )}
      </div>

      {/* Tank SVG */}
      <div className="flex-1 relative" style={{ minHeight: 110 }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={TANK_LEFT} y={TANK_TOP} width={TANK_W} height={TANK_H} rx="6" ry="6" />
            </clipPath>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={tintLight(band.color)}  stopOpacity="0.95" />
              <stop offset="100%" stopColor={tintDark(band.color)}   stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Tank shell */}
          <rect
            x={TANK_LEFT} y={TANK_TOP}
            width={TANK_W} height={TANK_H}
            rx="6" ry="6"
            fill="#eef2f6" stroke="#94a3b8" strokeWidth="0.8"
          />

          {/* Liquid (clipped to shell) */}
          <g clipPath={`url(#${clipId})`} className={isActiveFermentation ? 'tank-glow-active' : ''}>
            <rect
              x={TANK_LEFT}
              y={liquidTopY}
              width={TANK_W}
              height={liquidHeight}
              fill={`url(#${gradId})`}
              style={{ transition: 'y 700ms ease, height 700ms ease' }}
            />
            {/* Wave on the surface — moves laterally; whole group rides up/down with the fill level. */}
            <g style={{ transform: `translate(${TANK_LEFT}px, ${liquidTopY - 4}px)`, transition: 'transform 700ms ease' }}>
              <g className="tank-wave animate-liquidWave">
                <path d={WAVE_PATH} fill={tintLight(band.color)} fillOpacity="0.55" />
              </g>
            </g>
          </g>

          {/* Critical glow (above shell) */}
          {isCritical && (
            <rect
              className="animate-criticalBlink"
              x={TANK_LEFT - 1.5} y={TANK_TOP - 1.5}
              width={TANK_W + 3} height={TANK_H + 3}
              rx="7" ry="7"
              fill="none"
              stroke={band.color}
              strokeWidth="1.2"
            />
          )}

          {/* Fill level chip inside the tank */}
          <text
            x={TANK_LEFT + TANK_W / 2}
            y={Math.max(TANK_TOP + 10, liquidTopY - 3)}
            textAnchor="middle"
            fontSize="7"
            fill="#1f2933"
            style={{ fontWeight: 600, paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.7)', strokeWidth: 1 }}
          >
            {formatPercent(fill)}
          </text>
        </svg>
      </div>

      {/* Stats row */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Temp</span>
          <span className="text-xs font-semibold" style={{ color: band.color }}>
            {formatTemperature(tank.temperature)}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">ABV</span>
          <span className="text-xs font-semibold text-slate-800">
            {formatAbv(tank.abv)}
          </span>
        </div>
      </div>

      {tank.batchId && (
        <div className="text-[10px] text-slate-400 truncate">
          Batch <span className="text-slate-600">{safeText(tank.batchId)}</span>
        </div>
      )}

      {/* Hidden description for screen readers */}
      <span id={descId} className="sr-only">
        {`${safeText(tank.tankName)}, ${safeText(tank.fermentationStage) || 'unknown stage'}, fill ${formatPercent(fill)}, temperature ${formatTemperature(tank.temperature)}, ABV ${formatAbv(tank.abv)}, status ${safeText(tank.status) || 'normal'}`}
      </span>
    </div>
  );
}

export default memo(Tank);
