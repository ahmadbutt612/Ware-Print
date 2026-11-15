/** Schematic of a complete setup: unwind → flexo → die cutting → slitting → rewind. */
export function LineDiagram({ className }: { className?: string }) {
  const ink = "var(--color-ink)";
  const line = "var(--color-line-strong)";
  const red = "var(--color-red)";
  const label = { fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.06em", fill: "var(--color-ink-2)" };

  return (
    <svg viewBox="0 0 640 230" className={className} role="img" aria-labelledby="line-diagram-title">
      <title id="line-diagram-title">
        Diagram of a complete setup: a flexo printing machine, a die cutter and a slitter rewinder sold together
      </title>
      <defs>
        <marker id="arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 8 4 0 8z" fill={red} />
        </marker>
      </defs>

      {/* dimension line */}
      <g stroke={ink} strokeWidth="1">
        <path d="M86 34v12M584 34v12M86 40h498" />
      </g>
      <rect x="226" y="31" width="218" height="18" fill="var(--color-paper)" />
      <text x="335" y="44" textAnchor="middle" {...label} fill="var(--color-ink)">
        COMPLETE SETUP · 3 MACHINES
      </text>

      {/* floor */}
      <path d="M8 182h624" stroke={line} strokeWidth="1" />
      <path d="M8 186h624" stroke={line} strokeWidth="1" strokeDasharray="3 5" />

      {/* unwind roll */}
      <g fill="var(--color-paper)" stroke={ink} strokeWidth="1.5">
        <path d="M24 182 40 136l16 46" fill="none" />
        <circle cx="40" cy="126" r="24" />
        <circle cx="40" cy="126" r="5" />
      </g>

      {/* 01 flexo (central impression drum with print decks) */}
      <g fill="var(--color-paper)" stroke={ink} strokeWidth="1.5">
        <rect x="88" y="62" width="168" height="120" />
        <circle cx="172" cy="122" r="34" />
        <circle cx="172" cy="122" r="4" />
        {[
          [124, 92],
          [116, 122],
          [124, 152],
          [220, 92],
          [228, 122],
          [220, 152],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="9" />
        ))}
      </g>
      <text x="172" y="204" textAnchor="middle" {...label}>
        01 FLEXO PRINTING
      </text>

      {/* 02 die cutter (rotary die + anvil) */}
      <g fill="var(--color-paper)" stroke={ink} strokeWidth="1.5">
        <rect x="300" y="82" width="124" height="100" />
        <circle cx="362" cy="116" r="19" />
        <circle cx="362" cy="152" r="17" />
        <path d="M343 116h-8M381 116h8" />
      </g>
      <text x="362" y="204" textAnchor="middle" {...label}>
        02 DIE CUTTING
      </text>

      {/* 03 slitter (knives + two rewind shafts) */}
      <g fill="var(--color-paper)" stroke={ink} strokeWidth="1.5">
        <rect x="466" y="92" width="118" height="90" />
        {[490, 516, 542].map((x) => (
          <circle key={x} cx={x} cy="118" r="7" />
        ))}
        <circle cx="500" cy="157" r="14" />
        <circle cx="552" cy="157" r="14" />
      </g>
      <text x="525" y="204" textAnchor="middle" {...label}>
        03 SLITTING
      </text>

      {/* web path */}
      <g stroke={red} strokeWidth="1.75" fill="none">
        <path d="M64 120h22" markerEnd="url(#arrow)" />
        <path d="M258 128h40" markerEnd="url(#arrow)" />
        <path d="M426 134h38" markerEnd="url(#arrow)" />
        <path d="M586 150h36" markerEnd="url(#arrow)" />
      </g>
    </svg>
  );
}
