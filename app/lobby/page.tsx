"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { wsClient } from "../../lib/ws-client";
import { useGameStore, Color } from "../../store/gameStore";

const COLORES: Color[] = ["rojo", "azul", "verde", "amarillo"];
const COLOR_STYLES: Record<Color, string> = {
  rojo: "bg-red-600 border-red-400",
  azul: "bg-blue-600 border-blue-400",
  verde: "bg-green-600 border-green-400",
  amarillo: "bg-yellow-500 border-yellow-400",
};
const COLOR_EMOJI: Record<Color, string> = {
  rojo: "🔴", azul: "🔵", verde: "🟢", amarillo: "🟡",
};

export default function LobbyPage() {
  const router = useRouter();
  const { token, username, usuarioId, pin, nombreSala, jugadores, miColor,
    setSala, setJugadores, setColor, setListo, miListo, resetTodo } = useGameStore();

  const [vista, setVista] = useState<"menu" | "crear" | "unirse" | "sala">("menu");
  const [nombreInput, setNombreInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [salas, setSalas] = useState<unknown[]>([]);
  const [error, setError] = useState("");
  const [conectado, setConectado] = useState(false);
  const [salandoBots, setSalandoBots] = useState(false);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    wsClient.connect(token).then(() => {
      setConectado(true);
      wsClient.send("LISTAR_SALAS");
    }).catch(() => setError("No se pudo conectar al servidor"));

    const unsub = wsClient.onMessage((msg) => {
      switch (msg.type) {
        case "AUTH_OK": break;
        case "LISTA_SALAS":
          setSalas((msg.payload as { salas: unknown[] }).salas || []);
          break;
        case "SALA_CREADA":
          setSala(
            (msg.payload as { pin: string }).pin,
            (msg.payload as { nombre: string }).nombre
          );
          setVista("sala");
          break;
        case "SALA_ACTUALIZADA": {
          const p = msg.payload as { jugadores: unknown[]; colores_disponibles: string[] };
          setJugadores(p.jugadores as ReturnType<typeof useGameStore.getState>["jugadores"]);
          break;
        }
        case "PARTIDA_INICIADA":
          router.push("/juego");
          break;
        case "ERROR":
          setError((msg.payload as { mensaje: string }).mensaje || "Error");
          break;
      }
    });
    return unsub;
  }, [token]);

  const crearSala = () => {
    wsClient.send("CREAR_SALA", { nombre: nombreInput || `Sala de ${username}` });
    setNombreInput("");
  };

  const unirse = (p?: string) => {
    const pin_usar = p || pinInput.toUpperCase();
    wsClient.send("UNIRSE_SALA", { pin: pin_usar });
    setPinInput("");
  };

  const elegirColor = (c: Color) => {
    wsClient.send("ELEGIR_COLOR", { color: c });
    setColor(c);
  };

  const marcarListo = () => {
    if (!miColor) { setError("Elige un color primero"); return; }
    wsClient.send("MARCAR_LISTO", { listo: !miListo });
    setListo(!miListo);
  };

  const agregarBot = () => {
    wsClient.send("AGREGAR_BOT", { nombre: `BOT_${jugadores.length + 1}` });
  };

  const salir = () => {
    wsClient.send("SALIR_SALA");
    resetTodo();
    setVista("menu");
  };

  const coloresDisponibles = COLORES.filter(
    c => !jugadores.some(j => j.color === c && j.id !== usuarioId)
  );

  if (!conectado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Conectando al servidor...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white">🎲 Parqués</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">👤 {username}</span>
          <button onClick={() => router.push("/perfil")}
            className="text-gray-400 hover:text-white text-sm transition-colors">📊 Perfil</button>
          <button onClick={() => { wsClient.disconnect(); resetTodo(); router.push("/login"); }}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors">Salir</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl p-3 text-sm mb-4 flex justify-between">
            {error}
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-200">✕</button>
          </div>
        )}

        {vista === "menu" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setVista("crear")}
                className="bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 rounded-2xl p-8 text-left transition-all group">
                <div className="text-4xl mb-3">🏠</div>
                <div className="text-white font-semibold text-xl mb-1">Crear sala</div>
                <div className="text-gray-400 text-sm">Crea una sala nueva e invita a otros jugadores</div>
              </button>
              <button onClick={() => { setVista("unirse"); wsClient.send("LISTAR_SALAS"); }}
                className="bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 rounded-2xl p-8 text-left transition-all">
                <div className="text-4xl mb-3">🚪</div>
                <div className="text-white font-semibold text-xl mb-1">Unirse a sala</div>
                <div className="text-gray-400 text-sm">Entra a una sala existente con su PIN</div>
              </button>
            </div>
          </div>
        )}

        {vista === "crear" && (
          <div className="bg-white/10 rounded-2xl p-8 border border-white/20 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-white mb-6">🏠 Nueva sala</h2>
            <input value={nombreInput} onChange={e => setNombreInput(e.target.value)}
              placeholder={`Sala de ${username}`}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-purple-400"
              onKeyDown={e => e.key === "Enter" && crearSala()} />
            <div className="flex gap-3">
              <button onClick={crearSala} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl">Crear</button>
              <button onClick={() => setVista("menu")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Volver</button>
            </div>
          </div>
        )}

        {vista === "unirse" && (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-white mb-4">🚪 Unirse con PIN</h2>
              <div className="flex gap-3">
                <input value={pinInput} onChange={e => setPinInput(e.target.value.toUpperCase())}
                  placeholder="XXXXX" maxLength={5}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest focus:outline-none focus:border-purple-400"
                  onKeyDown={e => e.key === "Enter" && unirse()} />
                <button onClick={() => unirse()} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl">Unirse</button>
              </div>
            </div>

            {(salas as Array<{ pin: string; nombre: string; jugadores: number }>).length > 0 && (
              <div className="max-w-md mx-auto">
                <h3 className="text-gray-400 text-sm mb-3">Salas disponibles</h3>
                <div className="space-y-2">
                  {(salas as Array<{ pin: string; nombre: string; jugadores: number }>).map((s) => (
                    <button key={s.pin} onClick={() => unirse(s.pin)}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 text-left flex justify-between items-center transition-all">
                      <div>
                        <div className="text-white font-medium">{s.nombre}</div>
                        <div className="text-gray-400 text-sm font-mono">{s.pin}</div>
                      </div>
                      <div className="text-gray-400 text-sm">👥 {s.jugadores}/4</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center">
              <button onClick={() => setVista("menu")} className="text-gray-400 hover:text-white transition-colors">← Volver</button>
            </div>
          </div>
        )}

        {vista === "sala" && pin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{nombreSala}</h2>
                    <div className="text-gray-400 text-sm mt-1">
                      PIN: <span className="font-mono text-purple-400 text-lg tracking-widest">{pin}</span>
                    </div>
                  </div>
                  <button onClick={salir} className="text-gray-500 hover:text-red-400 text-sm">Salir</button>
                </div>

                <div className="space-y-2">
                  {jugadores.map((j) => (
                    <div key={j.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <div className={`w-4 h-4 rounded-full ${j.color ? `ficha-${j.color}` : "bg-gray-600"}`} />
                      <span className="text-white flex-1">{j.username} {j.es_bot && "🤖"}</span>
                      <span className="text-sm text-gray-400">{j.color || "sin color"}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${j.listo ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                        {j.listo ? "Listo ✓" : "Esperando"}
                      </span>
                    </div>
                  ))}
                  {jugadores.length < 4 && (
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-dashed border-white/10">
                      <div className="w-4 h-4 rounded-full bg-gray-700" />
                      <span className="text-gray-500 text-sm flex-1">Esperando jugador...</span>
                      <button onClick={agregarBot}
                        className="text-xs px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg transition-colors">
                        + Bot 🤖
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-4">Elige tu color</h3>
                <div className="grid grid-cols-2 gap-3">
                  {COLORES.map((c) => {
                    const disponible = coloresDisponibles.includes(c);
                    const seleccionado = miColor === c;
                    return (
                      <button key={c} onClick={() => disponible && elegirColor(c)} disabled={!disponible}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          seleccionado ? `${COLOR_STYLES[c]} scale-105 shadow-lg` :
                          disponible ? "bg-white/5 border-white/20 hover:border-white/40" :
                          "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                        }`}>
                        <span className="text-2xl">{COLOR_EMOJI[c]}</span>
                        <span className="text-white font-medium capitalize">{c}</span>
                        {!disponible && <span className="text-xs text-gray-500 ml-auto">Ocupado</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={marcarListo} disabled={!miColor}
                className={`w-full py-4 font-bold text-lg rounded-xl transition-all ${
                  miListo ? "bg-green-600 hover:bg-green-700 text-white" :
                  miColor ? "bg-purple-600 hover:bg-purple-500 text-white" :
                  "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}>
                {miListo ? "✓ Listo — Click para cancelar" : "Marcar como listo"}
              </button>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-sm text-gray-400">
                <p>• Mínimo 2 jugadores para iniciar</p>
                <p>• Todos deben marcar listo</p>
                <p>• Puedes agregar bots para completar</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
