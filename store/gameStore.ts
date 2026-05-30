import { create } from "zustand";

export type Color = "rojo" | "azul" | "verde" | "amarillo";

export interface Ficha {
  id: number;
  color: Color;
  estado: string;
  posicion: number;
}
export interface JugadorInfo {
  id: number;
  username: string;
  color: Color;
  listo: boolean;
  es_bot: boolean;
  fichas?: Ficha[];
}
export interface ChatMsg {
  usuario_id: number;
  username: string;
  contenido: string;
  timestamp: number;
}
export interface Recomendacion {
  ficha_id: number | null;
  valor?: number;
  dado?: string;
  destino?: string;
  justificacion: string;
}

export interface MovimientoLegal {
  ficha_id: number;
  valor: number;
  dado: string;
  destino_descripcion: string;
}

interface GameStore {
  // Auth
  token: string | null;
  usuarioId: number | null;
  username: string | null;
  setAuth: (token: string, id: number, username: string) => void;
  logout: () => void;

  // Sala
  pin: string | null;
  nombreSala: string | null;
  jugadores: JugadorInfo[];
  miColor: Color | null;
  miListo: boolean;
  setSala: (pin: string, nombre: string) => void;
  setJugadores: (jugadores: JugadorInfo[]) => void;
  setColor: (c: Color) => void;
  setListo: (v: boolean) => void;

  // Partida
  enPartida: boolean;
  turnoActual: number | null;
  tablero: Record<string, unknown> | null;
  dadoA: number | null;
  dadoB: number | null;
  esPar: boolean;
  movimientosLegales: unknown[];
  movimientoHover: MovimientoLegal | null;
  accionRequerida: string | null;
  esperandoAccion: boolean;
  setEnPartida: (v: boolean) => void;
  setTurno: (id: number | null) => void;
  setTablero: (t: Record<string, unknown>) => void;
  setDados: (a: number, b: number, par: boolean) => void;
  setMovimientos: (movs: unknown[]) => void;
  setMovimientoHover: (m: MovimientoLegal | null) => void;
  setAccion: (a: string | null) => void;
  setEsperandoAccion: (v: boolean) => void;

  // Chat
  mensajes: ChatMsg[];
  addMensaje: (m: ChatMsg) => void;

  // Recomendación
  recomendacion: Recomendacion | null;
  setRecomendacion: (r: Recomendacion | null) => void;

  // Notificaciones
  notificacion: string | null;
  setNotificacion: (n: string | null) => void;

  // Reset
  resetPartida: () => void;
  resetTodo: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  usuarioId:
    typeof window !== "undefined"
      ? localStorage.getItem("usuarioId")
        ? Number(localStorage.getItem("usuarioId"))
        : null
      : null,
  username:
    typeof window !== "undefined" ? localStorage.getItem("username") : null,
  setAuth: (token, id, username) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    localStorage.setItem("usuarioId", String(id));
    set({ token, usuarioId: id, username });
  },
  logout: () => {
    localStorage.clear();
    set({ token: null, usuarioId: null, username: null });
  },

  pin: null,
  nombreSala: null,
  jugadores: [],
  miColor: null,
  miListo: false,
  setSala: (pin, nombreSala) => set({ pin, nombreSala }),
  setJugadores: (jugadores) => set({ jugadores }),
  setColor: (miColor) => set({ miColor }),
  setListo: (miListo) => set({ miListo }),

  enPartida: false,
  turnoActual: null,
  tablero: null,
  dadoA: null,
  dadoB: null,
  esPar: false,
  movimientosLegales: [],
  movimientoHover: null,
  accionRequerida: null,
  esperandoAccion: false,
  setEnPartida: (enPartida) => set({ enPartida }),
  setTurno: (turnoActual) => set({ turnoActual }),
  setTablero: (tablero) => set({ tablero }),
  setDados: (dadoA, dadoB, esPar) => set({ dadoA, dadoB, esPar }),
  setMovimientos: (movimientosLegales) => set({ movimientosLegales }),
  setMovimientoHover: (movimientoHover) => set({ movimientoHover }),
  setAccion: (accionRequerida) => set({ accionRequerida }),
  setEsperandoAccion: (esperandoAccion) => set({ esperandoAccion }),

  mensajes: [],
  addMensaje: (m) => set((s) => ({ mensajes: [...s.mensajes.slice(-100), m] })),

  recomendacion: null,
  setRecomendacion: (recomendacion) => set({ recomendacion }),

  notificacion: null,
  setNotificacion: (notificacion) => set({ notificacion }),

  resetPartida: () =>
    set({
      enPartida: false,
      turnoActual: null,
      tablero: null,
      dadoA: null,
      dadoB: null,
      esPar: false,
      movimientosLegales: [],
      movimientoHover: null,
      accionRequerida: null,
      esperandoAccion: false,
      mensajes: [],
      recomendacion: null,
    }),
  resetTodo: () =>
    set({
      pin: null,
      nombreSala: null,
      jugadores: [],
      miColor: null,
      miListo: false,
      enPartida: false,
      turnoActual: null,
      tablero: null,
      dadoA: null,
      dadoB: null,
      esPar: false,
      movimientosLegales: [],
      movimientoHover: null,
      accionRequerida: null,
      esperandoAccion: false,
      mensajes: [],
      recomendacion: null,
      notificacion: null,
    }),
}));
