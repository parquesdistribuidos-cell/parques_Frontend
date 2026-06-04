"use client";
import React, { useState } from "react";

const COLOR_MAP: Record<string, string> = {
  rojo: "#dc2626",
  azul: "#2563eb",
  verde: "#16a34a",
  amarillo: "#d97706",
};
const COLOR_PREFIX: Record<string, string> = {
  rojo: "R",
  azul: "AZ",
  amarillo: "A",
  verde: "V",
};
const ROTATE_COLOR: Record<string, string> = {
  verde: "verde",
  rojo: "rojo",
  azul: "azul",
  amarillo: "amarillo",
};

const SEGUROS = new Set([21, 26, 33, 38, 43, 50, 55, 60, 67, 4, 9, 16]);
const SALIDAS = new Set([9, 60, 43, 26]);
const SALIDA_COLOR: Record<number, string> = {
  9: "amarillo",
  60: "azul",
  43: "rojo",
  26: "verde",
};

const BOARD_SIZE = 520; // tamaño total del SVG; cambiarlo requiere ajustar viewBox/dibujos
const BOARD_INSET = 8; // margen interno del marco; mayor = pista mas adentro
const SQ = 11; // mitad del lado de cada casilla; mayor = casillas mas grandes
const JAIL_SIZE = 100; // tamaño del cuadrado de carcel; mayor = carceles mas grandes
const JAIL_LABEL_OFFSET_Y = 32; // separacion del texto bajo la carcel; mayor = texto mas abajo
const BOARD_CENTER = 260; // centro del tablero; debe ser BOARD_SIZE / 2

const OUTER_PADDING = 0; // margen para alejar la pista del borde; mayor = pista mas adentro
const NOTCH_DEPTH = 90; // 100 profundidad del arco invertido; mayor = mas hundido hacia el centro
const MIN_CENTER_CLEARANCE = 0; //80  separacion minima respecto al centro; mayor = pista mas lejos del centro
// CURVE_SAMPLES eliminado: la ruta ahora es rectilinea

function displayColor(color: string) {
  return ROTATE_COLOR[color] || color;
}

const CARCEL_POS: Record<string, { cx: number; cy: number }[]> = {
  rojo: [
    { cx: 60, cy: 60 },
    { cx: 95, cy: 60 },
    { cx: 60, cy: 95 },
    { cx: 95, cy: 95 },
  ],
  verde: [
    { cx: 425, cy: 60 },
    { cx: 460, cy: 60 },
    { cx: 425, cy: 95 },
    { cx: 460, cy: 95 },
  ],
  amarillo: [
    { cx: 425, cy: 425 },
    { cx: 460, cy: 425 },
    { cx: 425, cy: 460 },
    { cx: 460, cy: 460 },
  ],
  azul: [
    { cx: 60, cy: 425 },
    { cx: 95, cy: 425 },
    { cx: 60, cy: 460 },
    { cx: 95, cy: 460 },
  ],
};

function buildTrackPositions(): Array<{ x: number; y: number }> {
  const center = { x: BOARD_CENTER, y: BOARD_CENTER };
  const halfJail = JAIL_SIZE / 2;
  const colors = ["rojo", "verde", "amarillo", "azul"] as const;

  const centers = colors.map((color) => {
    const slots = CARCEL_POS[color] || [];
    const sum = slots.reduce(
      (acc, slot) => ({ x: acc.x + slot.cx, y: acc.y + slot.cy }),
      { x: 0, y: 0 },
    );
    return { cx: sum.x / slots.length, cy: sum.y / slots.length };
  });

  const jailBounds = centers.reduce(
    (acc, c, idx) => {
      const color = colors[idx];
      acc[color] = {
        left: c.cx - halfJail,
        right: c.cx + halfJail,
        top: c.cy - halfJail,
        bottom: c.cy + halfJail,
      };
      return acc;
    },
    {} as Record<
      (typeof colors)[number],
      { left: number; right: number; top: number; bottom: number }
    >,
  );

  const leftMaxRight = Math.max(jailBounds.rojo.right, jailBounds.azul.right);
  const rightMinLeft = Math.min(
    jailBounds.verde.left,
    jailBounds.amarillo.left,
  );
  const topMaxBottom = Math.max(
    jailBounds.rojo.bottom,
    jailBounds.verde.bottom,
  );
  const bottomMinTop = Math.min(jailBounds.azul.top, jailBounds.amarillo.top);

  const centerSquareHalf = 84;
  const step = SQ * 2;

  const bounds = {
    minX: BOARD_INSET + SQ + OUTER_PADDING,
    maxX: BOARD_SIZE - BOARD_INSET - SQ - OUTER_PADDING,
    minY: BOARD_INSET + SQ + OUTER_PADDING,
    maxY: BOARD_SIZE - BOARD_INSET - SQ - OUTER_PADDING,
  };

  const outerLeft = bounds.minX;
  const outerRight = bounds.maxX;
  const outerTop = bounds.minY;
  const outerBottom = bounds.maxY;

  const centerLeftLimit = center.x - centerSquareHalf - MIN_CENTER_CLEARANCE;
  const centerRightLimit = center.x + centerSquareHalf + MIN_CENTER_CLEARANCE;
  const centerTopLimit = center.y - centerSquareHalf - MIN_CENTER_CLEARANCE;
  const centerBottomLimit = center.y + centerSquareHalf + MIN_CENTER_CLEARANCE;

  const desiredInnerLeft = leftMaxRight + NOTCH_DEPTH;
  const desiredInnerRight = rightMinLeft - NOTCH_DEPTH;
  const desiredInnerTop = topMaxBottom + NOTCH_DEPTH;
  const desiredInnerBottom = bottomMinTop - NOTCH_DEPTH;

  const innerLeft = Math.min(
    centerLeftLimit,
    Math.max(desiredInnerLeft, outerLeft + step),
  );
  const innerRight = Math.max(
    centerRightLimit,
    Math.min(desiredInnerRight, outerRight - step),
  );
  const innerTop = Math.min(
    centerTopLimit,
    Math.max(desiredInnerTop, outerTop + step),
  );
  const innerBottom = Math.max(
    centerBottomLimit,
    Math.min(desiredInnerBottom, outerBottom - step),
  );

  const ordered = [
    { x: innerLeft, y: outerBottom },
    { x: innerRight, y: outerBottom },
    { x: innerRight, y: innerBottom },
    { x: outerRight, y: innerBottom },
    { x: outerRight, y: innerTop },
    { x: innerRight, y: innerTop },
    { x: innerRight, y: outerTop },
    { x: innerLeft, y: outerTop },
    { x: innerLeft, y: innerTop },
    { x: outerLeft, y: innerTop },
    { x: outerLeft, y: innerBottom },
    { x: innerLeft, y: innerBottom },
    { x: innerLeft, y: outerBottom },
  ];

  const cumulative = [0];
  for (let i = 1; i < ordered.length; i += 1) {
    const dx = ordered[i].x - ordered[i - 1].x;
    const dy = ordered[i].y - ordered[i - 1].y;
    cumulative[i] = cumulative[i - 1] + Math.hypot(dx, dy);
  }

  const total = cumulative[cumulative.length - 1];
  const casillas: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 68; i += 1) {
    const target = (total * i) / 68;
    let seg = 1;
    while (seg < cumulative.length && cumulative[seg] < target) seg += 1;
    const prev = cumulative[seg - 1];
    const span = cumulative[seg] - prev || 1;
    const t = (target - prev) / span;
    const p0 = ordered[seg - 1];
    const p1 = ordered[seg];
    casillas.push({
      x: p0.x + (p1.x - p0.x) * t,
      y: p0.y + (p1.y - p0.y) * t,
    });
  }

  return casillas;
}

const CASILLA_POS = buildTrackPositions();

function getCasillaPos(num: number): { x: number; y: number } {
  const idx = (((num - 1) % 68) + 68) % 68;
  return CASILLA_POS[idx] || { x: BOARD_CENTER, y: BOARD_CENTER };
}

const RECTA_POS: Record<string, { x: number; y: number }[]> = {
  rojo: Array.from({ length: 8 }, (_, i) => ({ x: 260, y: 40 + i * 30 })),
  verde: Array.from({ length: 8 }, (_, i) => ({ x: 480 - i * 30, y: 260 })),
  amarillo: Array.from({ length: 8 }, (_, i) => ({ x: 260, y: 480 - i * 30 })),
  azul: Array.from({ length: 8 }, (_, i) => ({ x: 40 + i * 30, y: 260 })),
};

interface TableroProps {
  tablero: Record<string, unknown> | null;
  dadesDisponibles?: string[];
  turnoActual: number | null;
  usuarioId: number | null;
  movimientosLegales: Array<{
    ficha_id: number;
    valor: number;
    dado: string;
    destino_descripcion: string;
  }>;
  hoveredMove?: { ficha_id: number; destino_descripcion: string } | null;
  onFichaClick?: (fichaId: number, valor?: number) => void;
}

interface FichaData {
  id: number;
  color: string;
  estado: string;
  posicion: number;
}

function etiquetaFicha(id: number, color?: string) {
  const numero = Math.abs(id) % 10;
  if (!color) return String(numero);
  const prefijo = COLOR_PREFIX[color] || "";
  return `${prefijo}${numero}`;
}

function parseDestino(descripcion: string) {
  const lower = descripcion.toLowerCase();
  if (lower.includes("meta")) return { tipo: "meta" } as const;
  const casillaMatch = lower.match(/casilla\s+(\d+)/);
  if (casillaMatch)
    return { tipo: "casilla", casilla: Number(casillaMatch[1]) } as const;
  const rectaMatch = lower.match(/recta final[^0-9]*(\d+)/);
  if (rectaMatch) return { tipo: "recta", pos: Number(rectaMatch[1]) } as const;
  return null;
}

function getCarcelCenter(color: string) {
  const slots = CARCEL_POS[color] || [];
  if (!slots.length) return { cx: 0, cy: 0 };
  let sumX = 0;
  let sumY = 0;
  slots.forEach((slot) => {
    sumX += slot.cx;
    sumY += slot.cy;
  });
  return { cx: sumX / slots.length, cy: sumY / slots.length };
}

export default function Tablero({
  tablero,
  turnoActual,
  usuarioId,
  movimientosLegales,
  hoveredMove,
  onFichaClick,
  dadesDisponibles
}: TableroProps) {
  const esMiTurno = turnoActual === usuarioId;
  const fichasMovibles = new Set(movimientosLegales.map((m) => m.ficha_id));
  const [hoveredLocal, setHoveredLocal] = useState<{
    ficha_id: number;
    destino_descripcion: string;
  } | null>(null);

  const [popupFicha, setPopupFicha] = useState<{
  ficha_id: number;
  x: number;
  y: number;
  opciones: Array<{ dado: string; valor: number; destino: string }>;
  } | null>(null);

  const fichas: Array<{ data: FichaData; x: number; y: number; key: string }> =
    [];
  if (tablero) {
    const casillas = (tablero.casillas as Record<string, FichaData[]>) || {};
    const carceles = (tablero.carceles as Record<string, FichaData[]>) || {};
    const rectasFinales =
      (tablero.rectas_finales as Record<string, Record<string, FichaData[]>>) ||
      {};

    Object.entries(casillas).forEach(([num, fs]) => {
      fs.forEach((f, i) => {
        const pos = getCasillaPos(parseInt(num));
        fichas.push({
          data: f,
          x: pos.x + i * 6 - 3,
          y: pos.y - 8,
          key: `t-${f.id}`,
        });
      });
    });
    Object.entries(carceles).forEach(([color, fs]) => {
      fs.forEach((f, i) => {
        const p = CARCEL_POS[color]?.[i];
        if (p) fichas.push({ data: f, x: p.cx, y: p.cy, key: `c-${f.id}` });
      });
    });
    Object.entries(rectasFinales).forEach(([color, posiciones]) => {
      Object.entries(posiciones).forEach(([pos, fs]) => {
        fs.forEach((f) => {
          const p = RECTA_POS[color]?.[parseInt(pos) - 1];
          if (p) fichas.push({ data: f, x: p.x, y: p.y, key: `r-${f.id}` });
        });
      });
    });
  }

  const fichaColorById = new Map(fichas.map((f) => [f.data.id, f.data.color]));
  const activeHover = hoveredMove ?? hoveredLocal;
  const hoveredDestino = activeHover?.destino_descripcion
    ? parseDestino(activeHover.destino_descripcion)
    : null;
  const hoveredColor = activeHover
    ? fichaColorById.get(activeHover.ficha_id)
    : undefined;
  const highlightColor = hoveredColor
    ? COLOR_MAP[hoveredColor] || "#ffffff"
    : "#ffffff";

  return (
    <svg
      viewBox="0 0 520 520"
      className="w-full max-w-xl mx-auto drop-shadow-2xl"
    >
      {/* Board background */}
      <rect width="520" height="520" fill="#F2E8D0" />
      <rect
        x="8"
        y="8"
        width="504"
        height="504"
        rx="10"
        fill="#EAD9B4"
        stroke="#8B6914"
        strokeWidth="2.5"
      />

      {/* Corner jail areas */}
      {["rojo", "verde", "amarillo", "azul"].map((color) => {
        const disp = displayColor(color);
        const { cx, cy } = getCarcelCenter(color);
        const rectX = cx - JAIL_SIZE / 2;
        const rectY = cy - JAIL_SIZE / 2;
        const labelY = rectY + JAIL_SIZE + JAIL_LABEL_OFFSET_Y;
        return (
          <g key={color}>
            <rect
              x={rectX}
              y={rectY}
              width={JAIL_SIZE}
              height={JAIL_SIZE}
              rx="8"
              fill={COLOR_MAP[disp]}
              fillOpacity="0.72"
              stroke={COLOR_MAP[disp]}
              strokeWidth="2.5"
              strokeOpacity="0.9"
            />
            {/* Piece slots (circular wells) */}
            {CARCEL_POS[color].map((slot, i) => (
              <circle
                key={i}
                cx={slot.cx}
                cy={slot.cy}
                r={20}
                fill="white"
                fillOpacity="0.28"
                stroke="white"
                strokeWidth="1.5"
                strokeOpacity="0.55"
              />
            ))}
            <text
              x={cx}
              y={labelY}
              textAnchor="middle"
              fill="white"
              fontSize="9"
              fontWeight="bold"
              opacity="0.85"
            >
              {disp.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Center goal area */}
      <rect
        x="176"
        y="176"
        width="168"
        height="168"
        rx="8"
        fill="#EAD9B4"
        stroke="#8B6914"
        strokeWidth="2"
      />
      {/* 4 colored triangles from each corner of center to the middle */}
      <polygon
        points="176,176 260,260 344,176"
        fill={COLOR_MAP[displayColor("rojo")]}
        fillOpacity="0.5"
      />
      <polygon
        points="344,176 260,260 344,344"
        fill={COLOR_MAP[displayColor("verde")]}
        fillOpacity="0.5"
      />
      <polygon
        points="344,344 260,260 176,344"
        fill={COLOR_MAP[displayColor("amarillo")]}
        fillOpacity="0.5"
      />
      <polygon
        points="176,344 260,260 176,176"
        fill={COLOR_MAP[displayColor("azul")]}
        fillOpacity="0.5"
      />
      {/* Center circle (goal) */}
      <circle
        cx="260"
        cy="260"
        r="34"
        fill="#EAD9B4"
        stroke="#8B6914"
        strokeWidth="1.5"
      />
      <text x="260" y="255" textAnchor="middle" fill="#6B4A10" fontSize="18">
        🏆
      </text>
      <text
        x="260"
        y="273"
        textAnchor="middle"
        fill="#8B6914"
        fontSize="8"
        fontWeight="bold"
      >
        META
      </text>

      {/* Path squares (68 casillas) */}
      {Array.from({ length: 68 }, (_, i) => i + 1).map((num) => {
        const { x, y } = getCasillaPos(num);
        const esSeguro = SEGUROS.has(num);
        const esSalida = SALIDAS.has(num);
        const salidaBase = esSalida ? SALIDA_COLOR[num] : null;
        const salidaColor = salidaBase ? displayColor(salidaBase) : null;
        return (
          <g key={num}>
            <rect
              x={x - SQ}
              y={y - SQ}
              width={SQ * 2}
              height={SQ * 2}
              rx={2}
              fill={
                esSalida
                  ? `${COLOR_MAP[salidaColor!]}44`
                  : esSeguro
                    ? "#FFFACD"
                    : "#F5EDD5"
              }
              stroke={
                esSalida
                  ? COLOR_MAP[salidaColor!]
                  : esSeguro
                    ? "#C8A02A"
                    : "#C4A060"
              }
              strokeWidth={esSalida || esSeguro ? 1.5 : 0.8}
            />
            <text
              x={x + SQ - 2}
              y={y + SQ - 3}
              textAnchor="end"
              fill="#8B6914"
              fontSize="6"
              opacity="0.75"
            >
              {num}
            </text>
            {esSeguro && !esSalida && (
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill="#C8A02A"
                fontSize="9"
              >
                ★
              </text>
            )}
          </g>
        );
      })}

      {/* Home stretch lanes */}
      {Object.entries(RECTA_POS).map(([color, posiciones]) =>
        posiciones
          .slice(0, 7)
          .map((p, i) => (
            <rect
              key={`rf-${color}-${i}`}
              x={p.x - SQ}
              y={p.y - SQ}
              width={SQ * 2}
              height={SQ * 2}
              rx={2}
              fill={COLOR_MAP[displayColor(color)]}
              fillOpacity={0.22 + i * 0.1}
              stroke={COLOR_MAP[displayColor(color)]}
              strokeWidth="1.2"
              strokeOpacity="0.8"
            />
          )),
      )}

      {/* Hover destination highlight */}
      {hoveredDestino?.tipo === "casilla" &&
        (() => {
          const { x, y } = getCasillaPos(hoveredDestino.casilla);
          return (
            <rect
              x={x - SQ - 4}
              y={y - SQ - 4}
              width={SQ * 2 + 8}
              height={SQ * 2 + 8}
              rx={4}
              fill={highlightColor}
              fillOpacity={0.18}
              stroke={highlightColor}
              strokeWidth={2}
            />
          );
        })()}
      {hoveredDestino?.tipo === "recta" &&
        hoveredColor &&
        (() => {
          const pos = RECTA_POS[hoveredColor]?.[hoveredDestino.pos - 1];
          if (!pos) return null;
          return (
            <rect
              x={pos.x - SQ - 4}
              y={pos.y - SQ - 4}
              width={SQ * 2 + 8}
              height={SQ * 2 + 8}
              rx={4}
              fill={highlightColor}
              fillOpacity={0.18}
              stroke={highlightColor}
              strokeWidth={2}
            />
          );
        })()}
      {hoveredDestino?.tipo === "meta" && (
        <circle
          cx="260"
          cy="260"
          r="42"
          fill={highlightColor}
          fillOpacity={0.12}
          stroke={highlightColor}
          strokeWidth="2"
        />
      )}

      {/* Pieces */}
      {/* Pieces */}
      {fichas.map(({ data, x, y, key }) => {
        const movible = esMiTurno && fichasMovibles.has(data.id);
        const movsDeEstaFicha = movimientosLegales.filter((m) => m.ficha_id === data.id);
        const mov = movsDeEstaFicha[0];
        const hoverFicha = activeHover?.ficha_id === data.id;
        return (
          <g
            key={key}
            style={{ cursor: movible ? "pointer" : "default" }}
            onClick={() => {
              if (!movible || !movsDeEstaFicha.length) return;

              // Filtrar solo movimientos cuyos dados están disponibles
              const opcionesUnicas = movsDeEstaFicha
                .filter((m, idx, arr) =>
                  arr.findIndex((o) => o.valor === m.valor && o.dado === m.dado) === idx
                );

              if (opcionesUnicas.length > 1) {
                setPopupFicha({
                  ficha_id: data.id,
                  x,
                  y,
                  opciones: opcionesUnicas.map((m) => ({
                    dado: m.dado,
                    valor: m.valor,
                    destino: m.destino_descripcion,
                  })),
                });
              } else {
                setPopupFicha(null);
                onFichaClick?.(data.id, opcionesUnicas[0].valor);
              }
            }}
            onMouseEnter={() => {
              if (!movible || !mov || hoveredMove) return;
              setHoveredLocal({
                ficha_id: mov.ficha_id,
                destino_descripcion: mov.destino_descripcion,
              });
            }}
            onMouseLeave={() => {
              if (!hoveredMove) setHoveredLocal(null);
            }}
          >
            {hoverFicha && (
              <circle cx={x} cy={y} r={17} fill={highlightColor} fillOpacity="0.12" stroke={highlightColor} strokeWidth={2} />
            )}
            {movible && (
              <circle cx={x} cy={y} r={15} fill={COLOR_MAP[data.color]} fillOpacity="0.35" className="animate-ping" style={{ animationDuration: "1s" }} />
            )}
            <circle
              cx={x} cy={y} r={10}
              fill={COLOR_MAP[data.color] || "#888"}
              stroke={movible ? "white" : "rgba(0,0,0,0.4)"}
              strokeWidth={movible ? 2.5 : 1.5}
              filter={movible ? `drop-shadow(0 0 6px ${COLOR_MAP[data.color]})` : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"}
            />
            <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
              {etiquetaFicha(data.id, data.color)}
            </text>
          </g>
        );
      })}

      {/* Popup selección de dado */}
      {popupFicha && (() => {
        const { x, y, opciones, ficha_id } = popupFicha;
        const btnW = 38;
        const btnH = 36;
        const gap = 6;
        const padding = 8;
        const totalW = opciones.length * btnW + (opciones.length - 1) * gap + padding * 2;
        const boxH = btnH + padding * 2;
        const tailH = 10;
        const px = Math.min(Math.max(x - totalW / 2, 8), 520 - totalW - 8);
        const py = y - boxH - tailH - 6;
        const fichaColor = fichas.find((f) => f.data.id === ficha_id)?.data.color;
        const borderColor = fichaColor ? COLOR_MAP[fichaColor] : "#a855f7";
        return (
          <g>
            <rect x={0} y={0} width={520} height={520} fill="transparent" onClick={() => setPopupFicha(null)} />
            <rect x={px} y={py} width={totalW} height={boxH} rx={8} fill="#1a1625" stroke={borderColor} strokeWidth={2} filter="drop-shadow(0 4px 14px rgba(0,0,0,0.7))" />
            <polygon points={`${x - 8},${py + boxH} ${x + 8},${py + boxH} ${x},${py + boxH + tailH}`} fill="#1a1625" />
            <line x1={x - 8} y1={py + boxH} x2={x} y2={py + boxH + tailH} stroke={borderColor} strokeWidth={2} />
            <line x1={x + 8} y1={py + boxH} x2={x} y2={py + boxH + tailH} stroke={borderColor} strokeWidth={2} />
            {opciones.map((op, i) => {
              const bx = px + padding + i * (btnW + gap);
              const by = py + padding;
              return (
                <g key={i} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setPopupFicha(null); onFichaClick?.(ficha_id, op.valor); }}>
                  <rect x={bx} y={by} width={btnW} height={btnH} rx={7} fill={borderColor} fillOpacity={0.9} />
                  <text x={bx + btnW / 2} y={by + btnH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="15" fontWeight="bold">
                    {op.valor}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })()}
    </svg>
  );
}
