import { useMemo } from 'react';
import Tank from './Tank.jsx';
import { deduplicateTanks, isRenderable } from '../utils/validation.js';

// Responsive auto-fit grid. Aims for ~220 px tank cards but lets the browser pack
// as many columns as fit. minmax(0, 1fr) prevents long names blowing the layout out.
const GRID_STYLE = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
};

export default function TankGrid({ rows, onHover, onLeave }) {
  const tanks = useMemo(() => deduplicateTanks(rows.filter(isRenderable)), [rows]);

  return (
    <div
      className="grid gap-3 p-3 overflow-auto h-full"
      style={GRID_STYLE}
      role="list"
      aria-label="Brewery tanks"
    >
      {tanks.map((tank) => (
        <div role="listitem" key={`${tank.tankName}-${tank.batchId || ''}`}>
          <Tank tank={tank} onHover={onHover} onLeave={onLeave} />
        </div>
      ))}
    </div>
  );
}
