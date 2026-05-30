import React, { useEffect, useRef } from "react";
import { useLiveKit } from "../hooks/useLiveKit";

export function CameraCard({ camera, jwt, autoConnect = true, onExpand, onAuthError }) {
  const videoRef = useRef(null);
  const { status, micOn, camOn, connect, disconnect, toggleMic, toggleCam } = useLiveKit(videoRef, jwt, camera.room_id, onAuthError);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
  }, []);

  return (
    <div className="bg-white text-slate-900 rounded-2xl shadow-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{camera.name}</h2>
          {camera.location && (
            <p className="text-xs text-slate-400 mt-0.5">{camera.location}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isConnected ? "bg-green-100 text-green-600"
            : isConnecting ? "bg-yellow-100 text-yellow-600"
            : "bg-slate-100 text-slate-400"
          }`}>
            {isConnected ? "En vivo" : isConnecting ? "Conectando…" : "Sin señal"}
          </span>
          {onExpand && (
            <button onClick={onExpand} className="text-slate-400 hover:text-slate-600 transition" title="Ver en pantalla completa">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden cursor-pointer" onClick={onExpand} title="Click para ampliar">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/40 text-sm">{isConnecting ? "Conectando…" : "Sin señal"}</span>
          </div>
        )}
        {/* Indicadores activos sobre el video */}
        {(micOn || camOn) && (
          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            {micOn && (
              <span className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs">Mic</span>
              </span>
            )}
            {camOn && (
              <span className="flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-white text-xs">Cám</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-center gap-2">
        {!isConnected && !isConnecting && (
          <button onClick={connect} style={{ backgroundColor: "#505cfc" }} className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition shadow">
            Reconectar
          </button>
        )}
        {isConnecting && (
          <button disabled style={{ backgroundColor: "#505cfc" }} className="px-5 py-2 rounded-xl text-sm font-medium text-white opacity-50 cursor-not-allowed">
            Conectando…
          </button>
        )}
        {isConnected && (
          <>
            {/* Toggle micrófono */}
            <button
              onClick={toggleMic}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition shadow ${micOn ? "bg-red-500 hover:bg-red-600" : "bg-slate-600 hover:bg-slate-700"}`}
              title={micOn ? "Silenciar" : "Activar micrófono"}
            >
              {micOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="2" y1="2" x2="22" y2="22" />
                  <path strokeLinecap="round" d="M18.89 13.23A7 7 0 0112 19a7 7 0 01-7-7M12 19v3m-3 0h6" />
                  <path strokeLinecap="round" d="M9 9v3a3 3 0 005.12 2.12" />
                  <path strokeLinecap="round" d="M15 9.34V6a3 3 0 00-5.94-.6" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path strokeLinecap="round" d="M19 11a7 7 0 01-14 0M12 19v3m-3 0h6" />
                </svg>
              )}
              {micOn ? "Silenciar" : "Hablar"}
            </button>

            {/* Toggle cámara */}
            <button
              onClick={toggleCam}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition shadow ${camOn ? "bg-blue-500 hover:bg-blue-600" : "bg-slate-600 hover:bg-slate-700"}`}
              title={camOn ? "Apagar cámara" : "Activar cámara"}
            >
              {camOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="2" y1="2" x2="22" y2="22" />
                  <path strokeLinecap="round" d="M16 16H4a2 2 0 01-2-2V8a2 2 0 012-2h1m4 0h7a2 2 0 012 2v2.5l4-2.5v10l-4-2.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M15 10l4.553-2.276A1 1 0 0121 8.656v6.688a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              )}
              {camOn ? "Sin cámara" : "Cámara"}
            </button>

            <button onClick={disconnect} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition">
              Desconectar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
