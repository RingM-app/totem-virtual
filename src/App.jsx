import React, { useRef } from "react";
import { useLiveKit } from "./hooks/useLiveKit";

function App() {
  const videoRef = useRef(null);
  const { status, connect, disconnect } = useLiveKit(videoRef);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="py-6 text-center">
        <h1 className="text-2xl font-semibold opacity-90">RingM — Portero</h1>
      </div>

      {/* Contenedor */}
      <div className="flex justify-center px-4">
        <div className="w-full max-w-5xl bg-white text-slate-900 rounded-2xl shadow-lg p-6 relative">
          <h2 className="text-xl font-semibold mb-4">Entrada 1</h2>

          {/* Video */}
          <div className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Overlay cuando no hay video */}
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/40 text-sm">
                  {isConnecting ? "Conectando…" : "Sin señal"}
                </span>
              </div>
            )}
          </div>

          {/* Botón conectar */}
          {!isConnected && !isConnecting && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={connect}
                style={{ backgroundColor: "#505cfc" }}
                className="px-6 py-3 rounded-xl font-medium text-white hover:opacity-90 transition shadow"
              >
                Ver cámara
              </button>
            </div>
          )}

          {/* Estado conectando */}
          {isConnecting && (
            <div className="mt-6 flex justify-center">
              <button
                disabled
                style={{ backgroundColor: "#505cfc" }}
                className="px-6 py-3 rounded-xl font-medium text-white opacity-50 cursor-not-allowed"
              >
                Conectando…
              </button>
            </div>
          )}

          {/* Botón desconectar */}
          {isConnected && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={disconnect}
                className="px-6 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition shadow"
              >
                Desconectar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fondo decorativo */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#090836]" />
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full blur-3xl opacity-20"
          style={{ background: "#4E58FD" }}
        />
      </div>
    </div>
  );
}

export default App;
