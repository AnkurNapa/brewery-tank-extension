// Centered overlay used for loading, error, and empty states. Pure presentational —
// the parent owns the status logic.

export default function StatusOverlay({ icon = 'info', title, message, action }) {
  const tone =
    icon === 'error'   ? 'text-temp-critical' :
    icon === 'warning' ? 'text-temp-hot'      :
    icon === 'mock'    ? 'text-temp-normal'   :
                         'text-slate-500';

  return (
    <div role="status" className="absolute inset-0 flex items-center justify-center bg-white/85 z-10 p-6">
      <div className="max-w-md text-center">
        <div className={`text-sm font-semibold mb-1 ${tone}`}>{title}</div>
        {message && <div className="text-xs text-slate-500 leading-relaxed">{message}</div>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
