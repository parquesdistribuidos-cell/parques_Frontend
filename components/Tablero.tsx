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

const SEGUROS = new Set([
  5, 12, 17, 22, 26, 29, 34, 39, 43, 46, 51, 56, 60, 63, 68, 9,
]);
const SALIDAS = new Set([5, 22, 39, 56]);
const SALIDA_COLOR: Record<number, string> = {
  5: "azul",
  22: "amarillo",
  39: "verde",
  56: "rojo",
};

function getCasillaPos(num: number): { x: number; y: number } {
  const SIZE = 520;
  const MARGIN = 40;
  const CELL = (SIZE - MARGIN * 2) / 17;
  if (num >= 1 && num <= 17)
    return { x: MARGIN + (num - 1) * CELL, y: SIZE - MARGIN };
  if (num >= 18 && num <= 34)
    return { x: SIZE - MARGIN, y: SIZE - MARGIN - (num - 17) * CELL };
  if (num >= 35 && num <= 51)
    return { x: SIZE - MARGIN - (num - 34) * CELL, y: MARGIN };
  return { x: MARGIN, y: MARGIN + (num - 51) * CELL };
}

function displayColor(color: string) {
  return ROTATE_COLOR[color] || color;
}

const CARCEL_POS: Record<string, { cx: number; cy: number }[]> = {
  rojo: [
    { cx: 90, cy: 90 },
    { cx: 125, cy: 90 },
    { cx: 90, cy: 125 },
    { cx: 125, cy: 125 },
  ],
  verde: [
    { cx: 395, cy: 90 },
    { cx: 430, cy: 90 },
    { cx: 395, cy: 125 },
    { cx: 430, cy: 125 },
  ],
  amarillo: [
    { cx: 395, cy: 395 },
    { cx: 430, cy: 395 },
    { cx: 395, cy: 430 },
    { cx: 430, cy: 430 },
  ],
  azul: [
    { cx: 90, cy: 395 },
    { cx: 125, cy: 395 },
    { cx: 90, cy: 430 },
    { cx: 125, cy: 430 },
  ],
};

const RECTA_POS: Record<string, { x: number; y: number }[]> = {
  azul: Array.from({ length: 8 }, (_, i) => ({ x: 260, y: 480 - i * 30 })),
  amarillo: Array.from({ length: 8 }, (_, i) => ({ x: 40 + i * 30, y: 260 })),
  verde: Array.from({ length: 8 }, (_, i) => ({ x: 260, y: 40 + i * 30 })),
  rojo: Array.from({ length: 8 }, (_, i) => ({ x: 480 - i * 30, y: 260 })),
};

interface TableroProps {
  tablero: Record<string, unknown> | null;
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

const SQ = 11; // half-size of path squares → 22×22 each
const JAIL_SIZE = 100;
const JAIL_LABEL_OFFSET_Y = 32;

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
}: TableroProps) {
  const esMiTurno = turnoActual === usuarioId;
  const fichasMovibles = new Set(movimientosLegales.map((m) => m.ficha_id));
  const [hoveredLocal, setHoveredLocal] = useState<{
    ficha_id: number;
    destino_descripcion: string;
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
        fill={COLOR_MAP[displayColor("verde")]}
        fillOpacity="0.5"
      />
      <polygon
        points="344,176 260,260 344,344"
        fill={COLOR_MAP[displayColor("amarillo")]}
        fillOpacity="0.5"
      />
      <polygon
        points="344,344 260,260 176,344"
        fill={COLOR_MAP[displayColor("azul")]}
        fillOpacity="0.5"
      />
      <polygon
        points="176,344 260,260 176,176"
        fill={COLOR_MAP[displayColor("rojo")]}
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

      {/* Square number labels at key positions */}
      {[1, 9, 17, 22, 26, 34, 39, 43, 51, 56, 60, 68].map((num) => {
        const { x, y } = getCasillaPos(num);
        return (
          <text
            key={`n-${num}`}
            x={x}
            y={y - SQ - 3}
            textAnchor="middle"
            fill="#8B6914"
            fontSize="7"
            opacity="0.75"
          >
            {num}
          </text>
        );
      })}

      {/* Pieces */}
      {fichas.map(({ data, x, y, key }) => {
        const movible = esMiTurno && fichasMovibles.has(data.id);
        const mov = movimientosLegales.find((m) => m.ficha_id === data.id);
        const hoverFicha = activeHover?.ficha_id === data.id;
        return (
          <g
            key={key}
            style={{ cursor: movible ? "pointer" : "default" }}
            onClick={() => movible && mov && onFichaClick?.(data.id, mov.valor)}
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
              <circle
                cx={x}
                cy={y}
                r={17}
                fill={highlightColor}
                fillOpacity="0.12"
                stroke={highlightColor}
                strokeWidth={2}
              />
            )}
            {movible && (
              <circle
                cx={x}
                cy={y}
                r={15}
                fill={COLOR_MAP[data.color]}
                fillOpacity="0.35"
                className="animate-ping"
                style={{ animationDuration: "1s" }}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={10}
              fill={COLOR_MAP[data.color] || "#888"}
              stroke={movible ? "white" : "rgba(0,0,0,0.4)"}
              strokeWidth={movible ? 2.5 : 1.5}
              filter={
                movible
                  ? `drop-shadow(0 0 6px ${COLOR_MAP[data.color]})`
                  : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
              }
            />
            <text
              x={x}
              y={y + 4}
              textAnchor="middle"
              fill="white"
              fontSize="6"
              fontWeight="bold"
            >
              {etiquetaFicha(data.id, data.color)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
