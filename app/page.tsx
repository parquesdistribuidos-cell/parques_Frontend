import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-red-400 to-purple-400 bg-clip-text text-transparent">
          🎲 Parqués
        </h1>
        <p className="text-xl text-gray-300 mb-2">Distribuido</p>
        <p className="text-gray-400 mb-10">Proyecto Final — Sistemas Distribuidos</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg">
            Iniciar Sesión
          </Link>
          <Link href="/register"
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg border border-slate-500">
            Registrarse
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { emoji: "👥", text: "2-4 jugadores" },
            { emoji: "🤖", text: "Bot inteligente" },
            { emoji: "💬", text: "Chat en vivo" },
            { emoji: "📊", text: "Estadísticas" },
          ].map((f) => (
            <div key={f.text} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-3xl mb-2">{f.emoji}</div>
              <div className="text-gray-300">{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
