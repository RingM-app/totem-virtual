import React, { useRef } from "react";
import { useLiveKit } from "../hooks/useLiveKit";

export function CameraCard({ camera, jwt }) {
  const videoRef = useRef(null);
  const { status, connect, disconnect } = useLiveKit(videoRef, jwt, camera.room_id);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="bg-white text-slate-900 rounded-2xl shadow-lg p-4 flex flex-col gap-3">
      {/* Nombre + ubicación */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{camera.name}</h2>
          {camera.location && (
            <p className="text-xs text-slate-400 mt-0.5">{camera.location}</p>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isConnected
              ? "bg-green-100 text-green-600"
              : isConnecting
              ? "bg-yellow-100 text-yellow-600"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {isConnected ? "En vivo" : isConnecting ? "Conectando…" : "Sin señal"}
        </span>
      </div>

      {/* Video */}
      <div className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/40 text-sm">
              {isConnecting ? "Conectando…" : "Sin señal"}
            </span>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-center">
        {!isConnected && !isConnecting && (
          <button
            onClick={connect}
            style={{ backgroundColor: "#505cfc" }}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition shadow"
          >
            Ver cámara
          </button>
        )}
        {isConnecting && (
          <button
            disabled
            style={{ backgroundColor: "#505cfc" }}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white opacity-50 cursor-not-allowed"
          >
            Conectando…
          </button>
        )}
        {isConnected && (
          <button
            onClick={disconnect}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition shadow"
          >
            Desconectar
          </button>
        )}
      </div>
    </div>
  );
}
