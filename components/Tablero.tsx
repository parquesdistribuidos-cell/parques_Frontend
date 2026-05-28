"use client";
import React from "react";

const COLOR_MAP: Record<string, string> = {
  rojo: "#dc2626", azul: "#2563eb", verde: "#16a34a", amarillo: "#d97706",
};

const SEGUROS = new Set([5, 12, 17, 22, 26, 29, 34, 39, 43, 46, 51, 56, 60, 63, 68, 9]);
const SALIDAS = new Set([5, 22, 39, 56]);
const SALIDA_COLOR: Record<number, string> = { 5: "rojo", 22: "verde", 39: "amarillo", 56: "azul" };

function getCasillaPos(num: number): { x: number; y: number } {
  const SIZE = 520;
  const MARGIN = 40;
  const CELL = (SIZE - MARGIN * 2) / 17;
  if (num >= 1 && num <= 17) return { x: MARGIN + (num - 1) * CELL, y: SIZE - MARGIN };
  if (num >= 18 && num <= 34) return { x: SIZE - MARGIN, y: SIZE - MARGIN - (num - 17) * CELL };
  if (num >= 35 && num <= 51) return { x: SIZE - MARGIN - (num - 34) * CELL, y: MARGIN };
  return { x: MARGIN, y: MARGIN + (num - 51) * CELL };
}

const CARCEL_POS: Record<string, { cx: number; cy: number }[]> = {
  rojo:     [{ cx: 90, cy: 90 }, { cx: 125, cy: 90 }, { cx: 90, cy: 125 }, { cx: 125, cy: 125 }],
  verde:    [{ cx: 395, cy: 90 }, { cx: 430, cy: 90 }, { cx: 395, cy: 125 }, { cx: 430, cy: 125 }],
  amarillo: [{ cx: 395, cy: 395 }, { cx: 430, cy: 395 }, { cx: 395, cy: 430 }, { cx: 430, cy: 430 }],
  azul:     [{ cx: 90, cy: 395 }, { cx: 125, cy: 395 }, { cx: 90, cy: 430 }, { cx: 125, cy: 430 }],
};

const RECTA_POS: Record<string, { x: number; y: number }[]> = {
  rojo:     Array.from({length: 8}, (_, i) => ({ x: 260, y: 480 - i * 30 })),
  verde:    Array.from({length: 8}, (_, i) => ({ x: 40 + i * 30, y: 260 })),
  amarillo: Array.from({length: 8}, (_, i) => ({ x: 260, y: 40 + i * 30 })),
  azul:     Array.from({length: 8}, (_, i) => ({ x: 480 - i * 30, y: 260 })),
};

interface TableroProps {
  tablero: Record<string, unknown> | null;
  turnoActual: number | null;
  usuarioId: number | null;
  movimientosLegales: Array<{ ficha_id: number; valor: number; dado: string; destino_descripcion: string }>;
  onFichaClick?: (fichaId: number, valor?: number) => void;
}

interface FichaData {
  id: number; color: string; estado: string; posicion: number;
}

const SQ = 11; // half-size of path squares → 22×22 each

export default function Tablero({ tablero, turnoActual, usuarioId, movimientosLegales, onFichaClick }: TableroProps) {
  const esMiTurno = turnoActual === usuarioId;
  const fichasMovibles = new Set(movimientosLegales.map(m => m.ficha_id));

  const fichas: Array<{ data: FichaData; x: number; y: number; key: string }> = [];
  if (tablero) {
    const casillas = tablero.casillas as Record<string, FichaData[]> || {};
    const carceles = tablero.carceles as Record<string, FichaData[]> || {};
    const rectasFinales = tablero.rectas_finales as Record<string, Record<string, FichaData[]>> || {};

    Object.entries(casillas).forEach(([num, fs]) => {
      fs.forEach((f, i) => {
        const pos = getCasillaPos(parseInt(num));
        fichas.push({ data: f, x: pos.x + i * 6 - 3, y: pos.y - 8, key: `t-${f.id}` });
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

  return (
    <svg viewBox="0 0 520 520" className="w-full max-w-xl mx-auto drop-shadow-2xl">
      {/* Board background */}
      <rect width="520" height="520" fill="#F2E8D0" />
      <rect x="8" y="8" width="504" height="504" rx="10"
        fill="#EAD9B4" stroke="#8B6914" strokeWidth="2.5" />

      {/* Corner jail areas */}
      {[
        { color: "rojo",     x: 18,  y: 18,  label: "ROJO" },
        { color: "verde",    x: 330, y: 18,  label: "VERDE" },
        { color: "amarillo", x: 330, y: 330, label: "AMARILLO" },
        { color: "azul",     x: 18,  y: 330, label: "AZUL" },
      ].map(({ color, x, y, label }) => (
        <g key={color}>
          <rect x={x} y={y} width={172} height={172} rx="8"
            fill={COLOR_MAP[color]} fillOpacity="0.72"
            stroke={COLOR_MAP[color]} strokeWidth="2.5"
            strokeOpacity="0.9" />
          {/* Piece slots (circular wells) */}
          {CARCEL_POS[color].map((slot, i) => (
            <circle key={i} cx={slot.cx} cy={slot.cy} r={20}
              fill="white" fillOpacity="0.28"
              stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />
          ))}
          <text x={x + 86} y={y + 162} textAnchor="middle"
            fill="white" fontSize="9" fontWeight="bold" opacity="0.85">{label}</text>
        </g>
      ))}

      {/* Center goal area */}
      <rect x="176" y="176" width="168" height="168" rx="8"
        fill="#EAD9B4" stroke="#8B6914" strokeWidth="2" />
      {/* 4 colored triangles from each corner of center to the middle */}
      <polygon points="176,176 260,260 344,176" fill={COLOR_MAP["verde"]} fillOpacity="0.5" />
      <polygon points="344,176 260,260 344,344" fill={COLOR_MAP["amarillo"]} fillOpacity="0.5" />
      <polygon points="344,344 260,260 176,344" fill={COLOR_MAP["azul"]} fillOpacity="0.5" />
      <polygon points="176,344 260,260 176,176" fill={COLOR_MAP["rojo"]} fillOpacity="0.5" />
      {/* Center circle (goal) */}
      <circle cx="260" cy="260" r="34"
        fill="#EAD9B4" stroke="#8B6914" strokeWidth="1.5" />
      <text x="260" y="255" textAnchor="middle" fill="#6B4A10" fontSize="18">🏆</text>
      <text x="260" y="273" textAnchor="middle" fill="#8B6914" fontSize="8" fontWeight="bold">META</text>

      {/* Path squares (68 casillas) */}
      {Array.from({ length: 68 }, (_, i) => i + 1).map((num) => {
        const { x, y } = getCasillaPos(num);
        const esSeguro = SEGUROS.has(num);
        const esSalida = SALIDAS.has(num);
        const salidaColor = esSalida ? SALIDA_COLOR[num] : null;
        return (
          <g key={num}>
            <rect
              x={x - SQ} y={y - SQ} width={SQ * 2} height={SQ * 2} rx={2}
              fill={
                esSalida ? `${COLOR_MAP[salidaColor!]}44`
                : esSeguro ? "#FFFACD"
                : "#F5EDD5"
              }
              stroke={
                esSalida ? COLOR_MAP[salidaColor!]
                : esSeguro ? "#C8A02A"
                : "#C4A060"
              }
              strokeWidth={esSalida || esSeguro ? 1.5 : 0.8}
            />
            {esSeguro && !esSalida && (
              <text x={x} y={y + 4} textAnchor="middle" fill="#C8A02A" fontSize="9">★</text>
            )}
          </g>
        );
      })}

      {/* Home stretch lanes */}
      {Object.entries(RECTA_POS).map(([color, posiciones]) =>
        posiciones.slice(0, 7).map((p, i) => (
          <rect key={`rf-${color}-${i}`}
            x={p.x - SQ} y={p.y - SQ} width={SQ * 2} height={SQ * 2} rx={2}
            fill={COLOR_MAP[color]}
            fillOpacity={0.22 + i * 0.1}
            stroke={COLOR_MAP[color]}
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />
        ))
      )}

      {/* Square number labels at key positions */}
      {[1, 9, 17, 22, 26, 34, 39, 43, 51, 56, 60, 68].map(num => {
        const { x, y } = getCasillaPos(num);
        return (
          <text key={`n-${num}`} x={x} y={y - SQ - 3} textAnchor="middle"
            fill="#8B6914" fontSize="7" opacity="0.75">{num}</text>
        );
      })}

      {/* Pieces */}
      {fichas.map(({ data, x, y, key }) => {
        const movible = esMiTurno && fichasMovibles.has(data.id);
        const mov = movimientosLegales.find(m => m.ficha_id === data.id);
        return (
          <g key={key} style={{ cursor: movible ? "pointer" : "default" }}
            onClick={() => movible && mov && onFichaClick?.(data.id, mov.valor)}>
            {movible && (
              <circle cx={x} cy={y} r={15}
                fill={COLOR_MAP[data.color]} fillOpacity="0.35"
                className="animate-ping" style={{ animationDuration: "1s" }} />
            )}
            <circle cx={x} cy={y} r={10}
              fill={COLOR_MAP[data.color] || "#888"}
              stroke={movible ? "white" : "rgba(0,0,0,0.4)"}
              strokeWidth={movible ? 2.5 : 1.5}
              filter={movible
                ? `drop-shadow(0 0 6px ${COLOR_MAP[data.color]})`
                : "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
              }
            />
            <text x={x} y={y + 4} textAnchor="middle" fill="white"
              fontSize="7" fontWeight="bold">{data.id % 10}</text>
          </g>
        );
      })}
    </svg>
  );
}
