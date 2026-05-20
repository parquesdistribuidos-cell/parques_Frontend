"use client";
import React from "react";

const COLOR_MAP: Record<string, string> = {
  rojo: "#dc2626", azul: "#2563eb", verde: "#16a34a", amarillo: "#eab308",
};

// Seguros del tablero
const SEGUROS = new Set([5, 12, 17, 22, 26, 29, 34, 39, 43, 46, 51, 56, 60, 63, 68, 9]);
const SALIDAS = new Set([5, 22, 39, 56]);

// Posiciones pixel de las 68 casillas en el SVG (520x520)
function getCasillaPos(num: number): { x: number; y: number } {
  // El tablero se divide en 4 lados de 17 casillas cada uno
  // Lado sur (1-17): de abajo izquierda hacia derecha
  // Lado derecho (18-34): de derecha arriba
  // Lado norte (35-51): de arriba derecha hacia izquierda
  // Lado izquierdo (52-68): de izquierda abajo

  const SIZE = 520;
  const MARGIN = 40;
  const CELL = (SIZE - MARGIN * 2) / 17;

  if (num >= 1 && num <= 17) {
    // Lado sur (izq -> der), fila inferior
    return { x: MARGIN + (num - 1) * CELL, y: SIZE - MARGIN };
  } else if (num >= 18 && num <= 34) {
    // Lado derecho (abajo -> arriba)
    return { x: SIZE - MARGIN, y: SIZE - MARGIN - (num - 17) * CELL };
  } else if (num >= 35 && num <= 51) {
    // Lado norte (der -> izq), fila superior
    return { x: SIZE - MARGIN - (num - 34) * CELL, y: MARGIN };
  } else {
    // Lado izquierdo (arriba -> abajo)
    return { x: MARGIN, y: MARGIN + (num - 51) * CELL };
  }
}

// Posiciones de las cárceles (4 esquinas)
const CARCEL_POS: Record<string, { cx: number; cy: number }[]> = {
  rojo:     [{ cx: 100, cy: 100 }, { cx: 130, cy: 100 }, { cx: 100, cy: 130 }, { cx: 130, cy: 130 }],
  verde:    [{ cx: 390, cy: 100 }, { cx: 420, cy: 100 }, { cx: 390, cy: 130 }, { cx: 420, cy: 130 }],
  amarillo: [{ cx: 390, cy: 390 }, { cx: 420, cy: 390 }, { cx: 390, cy: 420 }, { cx: 420, cy: 420 }],
  azul:     [{ cx: 100, cy: 390 }, { cx: 130, cy: 390 }, { cx: 100, cy: 420 }, { cx: 130, cy: 420 }],
};

// Posiciones de la recta final (centro)
const RECTA_POS: Record<string, { x: number; y: number }[]> = {
  rojo:     Array.from({length: 8}, (_, i) => ({ x: 260, y: 480 - i * 30 })),
  verde:    Array.from({length: 8}, (_, i) => ({ x: 40  + i * 30, y: 260 })),
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

export default function Tablero({ tablero, turnoActual, usuarioId, movimientosLegales, onFichaClick }: TableroProps) {
  const esMiTurno = turnoActual === usuarioId;
  const fichasMovibles = new Set(movimientosLegales.map(m => m.ficha_id));

  // Construir lista de fichas visibles
  const fichas: Array<{ data: FichaData; x: number; y: number; key: string }> = [];

  if (tablero) {
    const casillas = tablero.casillas as Record<string, FichaData[]> || {};
    const carceles = tablero.carceles as Record<string, FichaData[]> || {};
    const rectasFinales = tablero.rectas_finales as Record<string, Record<string, FichaData[]>> || {};

    // Fichas en casillas del tablero
    Object.entries(casillas).forEach(([num, fs]) => {
      fs.forEach((f, i) => {
        const pos = getCasillaPos(parseInt(num));
        fichas.push({ data: f, x: pos.x + i * 6 - 3, y: pos.y - 8, key: `t-${f.id}` });
      });
    });

    // Fichas en cárceles
    Object.entries(carceles).forEach(([color, fs]) => {
      fs.forEach((f, i) => {
        const p = CARCEL_POS[color]?.[i];
        if (p) fichas.push({ data: f, x: p.cx, y: p.cy, key: `c-${f.id}` });
      });
    });

    // Fichas en recta final
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
    <svg viewBox="0 0 520 520" className="w-full max-w-xl mx-auto drop-shadow-2xl" style={{ background: "#1a0a30" }}>
      {/* Fondo del tablero */}
      <rect x="20" y="20" width="480" height="480" rx="16" fill="#2d1b69" stroke="#6d28d9" strokeWidth="2" />

      {/* Área central */}
      <circle cx="260" cy="260" r="80" fill="#1e1040" stroke="#7c3aed" strokeWidth="2" opacity="0.8" />
      <text x="260" y="255" textAnchor="middle" fill="#a78bfa" fontSize="18" fontWeight="bold">🎲</text>
      <text x="260" y="278" textAnchor="middle" fill="#7c3aed" fontSize="11">PARQUÉS</text>

      {/* Áreas de cárcel por color */}
      {[
        { color: "rojo",     x: 30,  y: 30,  w: 160, h: 160, label: "ROJO" },
        { color: "verde",    x: 330, y: 30,  w: 160, h: 160, label: "VERDE" },
        { color: "amarillo", x: 330, y: 330, w: 160, h: 160, label: "AMARILLO" },
        { color: "azul",     x: 30,  y: 330, w: 160, h: 160, label: "AZUL" },
      ].map(({ color, x, y, w, h, label }) => (
        <g key={color}>
          <rect x={x} y={y} width={w} height={h} rx="12"
            fill={COLOR_MAP[color]} fillOpacity="0.15"
            stroke={COLOR_MAP[color]} strokeWidth="1.5" />
          <text x={x + w/2} y={y + 20} textAnchor="middle"
            fill={COLOR_MAP[color]} fontSize="10" fontWeight="bold" opacity="0.7">{label}</text>
        </g>
      ))}

      {/* Casillas del tablero */}
      {Array.from({ length: 68 }, (_, i) => i + 1).map((num) => {
        const { x, y } = getCasillaPos(num);
        const esSeguro = SEGUROS.has(num);
        const esSalida = SALIDAS.has(num);
        return (
          <g key={num}>
            <circle cx={x} cy={y} r={esSeguro ? 9 : 7}
              fill={esSalida ? "rgba(255,215,0,0.3)" : esSeguro ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"}
              stroke={esSalida ? "gold" : esSeguro ? "rgba(255,215,0,0.6)" : "rgba(255,255,255,0.2)"}
              strokeWidth={esSalida ? 2 : 1} />
            {esSeguro && !esSalida && (
              <text x={x} y={y + 4} textAnchor="middle" fill="rgba(255,215,0,0.6)" fontSize="6">★</text>
            )}
          </g>
        );
      })}

      {/* Rectas finales */}
      {Object.entries(RECTA_POS).map(([color, posiciones]) =>
        posiciones.map((p, i) => (
          <circle key={`rf-${color}-${i}`} cx={p.x} cy={p.y} r={8}
            fill={COLOR_MAP[color]} fillOpacity={0.15 + i * 0.08}
            stroke={COLOR_MAP[color]} strokeWidth="1" strokeOpacity="0.5" />
        ))
      )}

      {/* Fichas */}
      {fichas.map(({ data, x, y, key }) => {
        const movible = esMiTurno && fichasMovibles.has(data.id);
        const mov = movimientosLegales.find(m => m.ficha_id === data.id);
        return (
          <g key={key} style={{ cursor: movible ? "pointer" : "default" }}
            onClick={() => movible && mov && onFichaClick?.(data.id, mov.valor)}>
            {movible && (
              <circle cx={x} cy={y} r={14} fill="white" fillOpacity="0.3"
                className="animate-ping" style={{ animationDuration: "1s" }} />
            )}
            <circle cx={x} cy={y} r={10}
              fill={COLOR_MAP[data.color] || "#888"}
              stroke={movible ? "white" : "rgba(255,255,255,0.3)"}
              strokeWidth={movible ? 2.5 : 1}
              filter={movible ? "drop-shadow(0 0 6px white)" : undefined} />
            <text x={x} y={y + 4} textAnchor="middle" fill="white"
              fontSize="7" fontWeight="bold">{data.id % 10}</text>
          </g>
        );
      })}

      {/* Indicadores de números de casillas (solo algunos) */}
      {[1, 9, 17, 22, 26, 34, 39, 43, 51, 56, 60, 68].map(num => {
        const { x, y } = getCasillaPos(num);
        return (
          <text key={`n-${num}`} x={x} y={y - 12} textAnchor="middle"
            fill="rgba(255,255,255,0.3)" fontSize="7">{num}</text>
        );
      })}
    </svg>
  );
}
