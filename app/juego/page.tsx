"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { wsClient } from "../../lib/ws-client";
import { useGameStore, MovimientoLegal, Color } from "../../store/gameStore";
import Tablero from "../../components/Tablero";

const COLOR_EMOJI: Record<string, string> = {
  rojo: "🔴",
  azul: "🔵",
  verde: "🟢",
  amarillo: "🟡",
};
const COLOR_PREFIX: Record<string, string> = {
  rojo: "R",
  azul: "AZ",
  amarillo: "A",
  verde: "V",
};

type FichaData = { id: number; color: Color };

export default function JuegoPage() {
  const router = useRouter();
  const {
    token,
    usuarioId,
    username,
    jugadores,
    pin,
    miColor,
    tablero,
    turnoActual,
    dadoA,
    dadoB,
    esPar,
    movimientosLegales,
    accionRequerida,
    mensajes,
    recomendacion,
    notificacion,
    setTablero,
    setTurno,
    setDados,
    setMovimientos,
    setAccion,
    setEsperandoAccion,
    addMensaje,
    setRecomendacion,
    setNotificacion,
    setEnPartida,
    resetTodo,
    esperandoAccion,
    movimientoHover,
    setMovimientoHover,
  } = useGameStore();

  const [chatInput, setChatInput] = useState("");
  const [ganador, setGanador] = useState<null | {
    username: string;
    color: string;
  }>(null);
  const [log, setLog] = useState<string[]>([]);
  const [dadosAnimando, setDadosAnimando] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const esMiTurno = turnoActual === usuarioId;
  const jugadorActual = jugadores.find((j) => j.id === turnoActual);
  const fichaColorMapRef = useRef(new Map<number, Color>());
  const fichaColorMap = useMemo(() => {
    const map = new Map<number, Color>();
    if (!tablero) return map;
    const casillas =
      ((tablero as Record<string, unknown>).casillas as Record<
        string,
        FichaData[]
      >) || {};
    const carceles =
      ((tablero as Record<string, unknown>).carceles as Record<
        string,
        FichaData[]
      >) || {};
    const rectasFinales =
      ((tablero as Record<string, unknown>).rectas_finales as Record<
        string,
        Record<string, FichaData[]>
      >) || {};

    Object.values(casillas).forEach((fs) =>
      fs.forEach((f) => map.set(f.id, f.color)),
    );
    Object.values(carceles).forEach((fs) =>
      fs.forEach((f) => map.set(f.id, f.color)),
    );
    Object.values(rectasFinales).forEach((posiciones) => {
      Object.values(posiciones).forEach((fs) =>
        fs.forEach((f) => map.set(f.id, f.color)),
      );
    });

    return map;
  }, [tablero]);

  useEffect(() => {
    fichaColorMapRef.current = fichaColorMap;
  }, [fichaColorMap]);

  function etiquetaFichaCorta(fichaId: number | null) {
    if (!fichaId) return "";
    const color =
      fichaColorMapRef.current.get(fichaId) || fichaColorMap.get(fichaId);
    const numero = Math.abs(fichaId) % 10;
    if (!color) return String(numero);
    const prefijo = COLOR_PREFIX[color] || "";
    return `${prefijo}${numero}`;
  }

  function etiquetaFicha(fichaId: number) {
    return `Ficha ${etiquetaFichaCorta(fichaId)}`;
  }

  useEffect(() => {
    setHydrated(true);
  }, []);

  const jugadoresRef = useRef(jugadores);
  useEffect(() => {
    jugadoresRef.current = jugadores;
  }, [jugadores]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const unsub = wsClient.onMessage((msg) => {
      const p = msg.payload as Record<string, unknown>;

      switch (msg.type) {
        case "PARTIDA_INICIADA":
          setTablero(p.tablero as Record<string, unknown>);
          addLog(
            `🎮 Partida iniciada! Primer turno: jugador ${p.primer_turno}`,
          );
          break;

        case "TURNO_ASIGNADO": {
          setTurno(p.jugador_id as number);
          setMovimientos([]);
          setMovimientoHover(null);
          setDados(0, 0, false);
          if ((p.jugador_id as number) === usuarioId) setEsperandoAccion(true);
          if (p.fase !== "tirada_inicial") {
            const j = jugadoresRef.current.find((j) => j.id === p.jugador_id);
            addLog(`🎯 Turno de ${j?.username || p.jugador_id}`);
          }
          break;
        }

        case "DADOS_RESULTADO":
          setDadosAnimando(true);
          setTimeout(() => setDadosAnimando(false), 600);
          if (p.fase !== "tirada_inicial") {
            setDados(
              p.dado_a as number,
              p.dado_b as number,
              p.es_par as boolean,
            );
            addLog(
              `🎲 ${p.username} sacó ${p.dado_a} - ${p.dado_b}${p.es_par ? " ¡PAR!" : ""}`,
            );
          } else {
            addLog(`🎲 ${p.username} sacó ${p.suma} para el turno inicial`);
          }
          break;

        case "ACCION_REQUERIDA":
          setAccion(p.accion as string);
          setEsperandoAccion(false);
          if (p.accion === "MOVER_FICHA") {
            setMovimientos(p.movimientos_legales as unknown[]);
            setMovimientoHover(null);
          }
          break;

        case "ESTADO_TABLERO":
        case "FICHA_MOVIDA":
          if (p.tablero) setTablero(p.tablero as Record<string, unknown>);
          if (msg.type === "FICHA_MOVIDA") {
            addLog(
              `♟️ ${p.username} movió ${etiquetaFicha(p.ficha_id as number)}`,
            );
          }
          setMovimientos([]);
          setMovimientoHover(null);
          setAccion(null);
          break;

        case "FICHA_CAPTURADA":
          addLog(
            `💥 ${etiquetaFicha(p.ficha_capturada_id as number)} capturada por ${p.captor_username}!`,
          );
          setNotificacion(`¡${p.captor_username} capturó una ficha!`);
          setTimeout(() => setNotificacion(null), 3000);
          break;

        case "FICHA_SALIO_CARCEL":
          addLog(`🚀 ${p.username} sacó una ficha de la cárcel`);
          break;

        case "SIN_MOVIMIENTOS":
          addLog(`⏩ ${p.username} no tiene movimientos. Pasa el turno.`);
          break;

        case "TRES_PARES":
          addLog(
            `🔥 ${p.username} sacó 3 pares seguidos! Debe quemar una ficha.`,
          );
          setNotificacion(p.mensaje as string);
          break;

        case "FICHA_QUEMADA":
          addLog(
            `🔥 ${etiquetaFicha(p.ficha_id as number)} eliminada por 3 pares consecutivos`,
          );
          break;

        case "MENSAJE_CHAT":
          addMensaje({
            usuario_id: p.usuario_id as number,
            username: p.username as string,
            contenido: p.contenido as string,
            timestamp: p.timestamp as number,
          });
          break;

        case "RECOMENDACION":
          setRecomendacion({
            ficha_id: p.ficha_id as number | null,
            valor: p.valor as number,
            dado: p.dado as string,
            destino: p.destino as string,
            justificacion: p.justificacion as string,
          });
          break;

        case "PARTIDA_TERMINADA":
          setGanador({
            username: p.ganador_username as string,
            color: p.ganador_color as string,
          });
          addLog(`🏆 ¡${p.ganador_username} GANÓ LA PARTIDA!`);
          break;

        case "WS_CLOSED":
          addLog("⚠️ Conexión perdida con el servidor");
          break;
      }
    });

    return unsub;
  }, [token]);

  useEffect(() => {
    if (!autoScroll) return;
    requestAnimationFrame(() => {
      chatBottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [mensajes, autoScroll]);

  function handleChatScroll() {
    const el = chatRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }

  function addLog(msg: string) {
    setLog((prev) => [...prev.slice(-50), msg]);
  }

  function lanzarDados() {
    if (!esMiTurno || accionRequerida !== "LANZAR_DADOS" || esperandoAccion)
      return;
    wsClient.send("LANZAR_DADOS");
  }

  function moverFicha(fichaId: number, valor?: number) {
    if (!esMiTurno) return;
    const movs = (movimientosLegales as MovimientoLegal[]).filter(
      (m) => m.ficha_id === fichaId,
    );
    if (!movs.length) return;
    const mov = valor
      ? movs.find((m) => m.valor === valor) || movs[0]
      : movs[0];
    wsClient.send("MOVER_FICHA", { ficha_id: mov.ficha_id, valor: mov.valor });
  }

  function enviarChat() {
    if (!chatInput.trim()) return;
    wsClient.send("ENVIAR_CHAT", { contenido: chatInput.trim() });
    setChatInput("");
  }

  function pedirRecomendacion() {
    wsClient.send("SOLICITAR_RECOMENDACION");
  }

  function abandonarPartida() {
    if (!confirm("¿Abandonar la partida? No podrás volver a unirte.")) return;
    wsClient.send("SALIR_SALA");
    resetTodo();
    router.push("/lobby");
  }

  function getDadoEmoji(val: number) {
    return ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][val] || "🎲";
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Cargando...
      </div>
    );
  }

  if (ganador) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur rounded-3xl p-12 text-center border border-white/20 max-w-md">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            ¡{ganador.username} ganó!
          </h1>
          <p className="text-gray-400 mb-6">
            Color: {ganador.color} {COLOR_EMOJI[ganador.color]}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                resetTodo();
                router.push("/lobby");
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl"
            >
              Nueva partida
            </button>
            <button
              onClick={() => {
                resetTodo();
                router.push("/perfil");
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl"
            >
              Ver estadísticas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="text-white font-bold">🎲 Parqués — Sala {pin}</div>
          <button
            onClick={abandonarPartida}
            className="text-xs text-red-400 hover:text-red-300 border border-red-500/40 hover:border-red-400 px-2 py-1 rounded-lg transition-colors"
          >
            Abandonar
          </button>
        </div>
        <div className="flex items-center gap-4">
          {jugadores.map((j) => (
            <div
              key={j.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all ${
                j.id === turnoActual ? "bg-white/20 scale-105" : "opacity-60"
              }`}
            >
              <span>{COLOR_EMOJI[j.color] || "⬜"}</span>
              <span className="text-white">{j.username}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Notificación */}
      {notificacion && (
        <div className="bg-yellow-500/90 text-black text-sm font-medium py-2 px-6 text-center">
          {notificacion}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Panel izquierdo — Dados y acciones */}
        <div className="w-72 bg-black/20 border-r border-white/10 p-4 space-y-4 overflow-y-auto">
          {/* Turno actual */}
          <div
            className={`rounded-xl p-4 border ${esMiTurno ? "bg-green-500/20 border-green-500/50" : "bg-white/5 border-white/10"}`}
          >
            <div className="text-xs text-gray-400 mb-1">Turno actual</div>
            <div className="text-white font-semibold">
              {jugadorActual
                ? `${COLOR_EMOJI[jugadorActual.color]} ${jugadorActual.username}`
                : "..."}
            </div>
            {esMiTurno && (
              <div className="text-green-400 text-sm mt-1">¡Es tu turno!</div>
            )}
          </div>

          {/* Dados */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
            <div className="text-gray-400 text-xs mb-3">Dados</div>
            <div
              className={`flex justify-center gap-4 text-5xl mb-3 transition-all ${dadosAnimando ? "scale-125" : ""}`}
            >
              <span>{dadoA ? getDadoEmoji(dadoA) : "🎲"}</span>
              <span>{dadoB ? getDadoEmoji(dadoB) : "🎲"}</span>
            </div>
            {dadoA != null && dadoB != null && dadoA > 0 && dadoB > 0 && (
              <div
                className={`text-sm ${esPar ? "text-yellow-400 font-bold" : "text-gray-400"}`}
              >
                {dadoA} + {dadoB} = {dadoA + dadoB} {esPar && "⭐ PAR"}
              </div>
            )}
            {esMiTurno &&
              (accionRequerida === "LANZAR_DADOS" || esperandoAccion) && (
                <button
                  onClick={lanzarDados}
                  disabled={
                    esperandoAccion || accionRequerida !== "LANZAR_DADOS"
                  }
                  className={`mt-3 w-full py-2 font-semibold rounded-xl transition-all active:scale-95 ${
                    esperandoAccion
                      ? "bg-gray-600 text-gray-400 cursor-wait animate-pulse"
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  }`}
                >
                  {esperandoAccion
                    ? "⏳ Preparando turno..."
                    : "🎲 Lanzar dados"}
                </button>
              )}
          </div>

          {/* Movimientos disponibles */}
          {esMiTurno &&
            (movimientosLegales as MovimientoLegal[]).length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-gray-400 text-xs mb-3">
                  Movimientos posibles
                </div>
                <div className="space-y-2">
                  {(movimientosLegales as MovimientoLegal[])
                    .slice(0, 6)
                    .map((m, i) => (
                      <button
                        key={i}
                        onClick={() => moverFicha(m.ficha_id, m.valor)}
                        onMouseEnter={() => setMovimientoHover(m)}
                        onMouseLeave={() => setMovimientoHover(null)}
                        className="w-full text-left text-sm bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 px-3 py-2 rounded-lg transition-colors"
                      >
                        {etiquetaFichaCorta(m.ficha_id)} →{" "}
                        {m.destino_descripcion}
                      </button>
                    ))}
                </div>
              </div>
            )}

          {/* Recomendación */}
          {esMiTurno && (
            <div className="space-y-2">
              <button
                onClick={pedirRecomendacion}
                className="w-full py-2 bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 text-sm rounded-xl transition-colors"
              >
                💡 Pedir recomendación
              </button>
              {recomendacion && (
                <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-3">
                  <div className="text-blue-300 text-xs font-semibold mb-1">
                    💡 IA recomienda:
                  </div>
                  {recomendacion.ficha_id && (
                    <div className="text-white text-sm mb-1">
                      {etiquetaFichaCorta(recomendacion.ficha_id)} con dado{" "}
                      {recomendacion.dado?.toUpperCase()} ({recomendacion.valor}
                      )
                    </div>
                  )}
                  <div className="text-gray-400 text-xs">
                    {recomendacion.justificacion}
                  </div>
                  {recomendacion.destino && (
                    <div className="text-blue-200 text-xs mt-1">
                      → {recomendacion.destino}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Log de eventos */}
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-gray-400 text-xs mb-2">Registro</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {log
                .slice(-15)
                .reverse()
                .map((l, i) => (
                  <div key={i} className="text-gray-400 text-xs">
                    {l}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Tablero central */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
          <Tablero
            tablero={tablero}
            turnoActual={turnoActual}
            usuarioId={usuarioId}
            movimientosLegales={movimientosLegales as MovimientoLegal[]}
            hoveredMove={movimientoHover}
            onFichaClick={moverFicha}
          />
        </div>

        {/* Panel derecho — Chat */}
        <div className="w-72 bg-black/20 border-l border-white/10 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <div className="p-4 border-b border-white/10 flex-shrink-0">
            <h3 className="text-white font-semibold text-sm">💬 Chat</h3>
          </div>
          <div
            ref={chatRef}
            onScroll={handleChatScroll}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2"
          >
            {mensajes.length === 0 && (
              <p className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
                Los mensajes aparecerán aquí
              </p>
            )}
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-2 text-sm ${
                  m.usuario_id === usuarioId
                    ? "bg-purple-600/30 ml-4"
                    : "bg-white/5 mr-4"
                }`}
              >
                <div className="text-gray-400 text-xs mb-0.5">{m.username}</div>
                <div className="text-white">{m.contenido}</div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2 flex-shrink-0">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarChat()}
              placeholder="Escribe..."
              maxLength={200}
              className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 placeholder-gray-600"
            />
            <button
              onClick={enviarChat}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
