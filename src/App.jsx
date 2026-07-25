import React, { useEffect, useRef, useState } from "react";
import { Login } from "./components/Login";
import { CameraCard } from "./components/CameraCard";
import { AdminPanel } from "./components/AdminPanel";
import { BACKEND_URL } from "./config";
import { getStoredTokens, storeTokens, clearStoredTokens } from "./auth";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[#090836]" />
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full blur-3xl opacity-20"
        style={{ background: "#4E58FD" }}
      />
    </div>
  );
}

function FullscreenModal({ camera, videoRef, onClose }) {
  const modalRef = useRef(null);
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Reusar el MediaStream del <video> de la tarjeta (el track de LiveKit ya está
  // pegado ahí). Se sincroniza con un intervalo, no una sola copia al montar:
  // si la cámara todavía estaba "Conectando…" cuando se abrió el modal, el
  // srcObject de la tarjeta llega recién después (evento TrackSubscribed) y el
  // modal se quedaba negro para siempre. También cubre reconexiones, donde
  // LiveKit reasigna el srcObject de la tarjeta más adelante.
  useEffect(() => {
    const sync = () => {
      const source = videoRef?.current;
      const target = modalRef.current;
      if (source && target && target.srcObject !== source.srcObject) {
        target.srcObject = source.srcObject;
      }
    };
    sync();
    const id = setInterval(sync, 500);
    return () => clearInterval(id);
  }, [videoRef]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={onClose}>
      <div className="w-full max-w-6xl px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold text-lg">{camera.name}</h2>
            {camera.location && <p className="text-white/40 text-sm">{camera.location}</p>}
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-sm">✕ Cerrar (Esc)</button>
        </div>
        <div className="w-full aspect-[16/9] bg-black rounded-2xl overflow-hidden">
          <video ref={modalRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function Viewer({ jwt, onLogout, isAdmin = false, onSwitchToAdmin }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCamera, setExpandedCamera] = useState(null);
  const [connectAll, setConnectAll] = useState(true);

  useEffect(() => {
    async function fetchCameras() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cameras`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.status === 401) { onLogout(); return; }
        if (!res.ok) throw new Error("Error al obtener cámaras");
        const data = await res.json();
        setCameras(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCameras();
  }, [jwt]);

  return (
    <div className="min-h-screen text-white">
      <Background />

      <div className="py-6 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold opacity-90">
          Portero Virtual <span className="text-sm font-normal opacity-50">by RingM</span>
        </h1>
        <div className="flex items-center gap-4">
          {cameras.length > 1 && (
            <button
              onClick={() => setConnectAll((v) => !v)}
              className="text-sm text-white/60 hover:text-white transition border border-white/20 px-3 py-1.5 rounded-lg"
            >
              {connectAll ? "Desconectar todas" : "Conectar todas"}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onSwitchToAdmin}
              style={{ backgroundColor: "#505cfc" }}
              className="text-sm text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
            >
              Panel admin
            </button>
          )}
          <button
            onClick={onLogout}
            className="text-sm text-white/50 hover:text-white/80 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="px-6 pb-10 max-w-7xl mx-auto">
        {loading && (
          <p className="text-white/50 text-center mt-20">Cargando cámaras…</p>
        )}
        {!loading && error && (
          <p className="text-red-400 text-center mt-20">{error}</p>
        )}
        {!loading && !error && cameras.length === 0 && (
          <p className="text-white/50 text-center mt-20">
            No tienes cámaras asignadas.
          </p>
        )}
        {!loading && !error && cameras.length > 0 && (
          <div
            className={`grid gap-6 ${
              cameras.length === 1
                ? "grid-cols-1 max-w-2xl mx-auto"
                : cameras.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {cameras.map((camera) => (
              <CameraCard
                key={`${camera.id}-${connectAll}`}
                camera={camera}
                jwt={jwt}
                autoConnect={connectAll}
                onExpand={(ref) => setExpandedCamera({ camera, videoRef: ref })}
                onAuthError={onLogout}
              />
            ))}
          </div>
        )}
      </div>

      {expandedCamera && (
        <FullscreenModal
          camera={expandedCamera.camera}
          videoRef={expandedCamera.videoRef}
          onClose={() => setExpandedCamera(null)}
        />
      )}
    </div>
  );
}

function App() {
  const [jwt, setJwt] = useState(() => getStoredTokens()?.access_token || null);
  const [adminView, setAdminView] = useState("monitor");

  // Refresca el access_token: UNA vez al montar (por si el guardado ya venció —
  // antes solo refrescaba cada 10min, así que volver con el token vencido te
  // deslogueaba en vez de refrescar) y luego cada 10 minutos. Deps [] para correr
  // solo al montar (doRefresh usa getStoredTokens() fresco + setJwt estable).
  useEffect(() => {
    const doRefresh = async () => {
      const stored = getStoredTokens();
      if (!stored?.refresh_token) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: stored.refresh_token }),
        });
        if (res.ok) {
          const data = await res.json();
          // El backend rota el refresh_token — guardar el nuevo si viene
          storeTokens({
            access_token: data.access_token,
            refresh_token: data.refresh_token ?? stored.refresh_token,
          });
          setJwt(data.access_token);
        } else if (res.status === 401) {
          handleLogout();   // refresh inválido/vencido → cerrar sesión (un 500 NO desloguea)
        }
      } catch { /* error de red — reintenta en el próximo ciclo */ }
    };
    doRefresh();                                    // inmediato al cargar
    const id = setInterval(doRefresh, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogin(tokens) {
    storeTokens(tokens);
    setJwt(tokens.access_token);
  }

  function handleLogout() {
    const stored = getStoredTokens();
    if (stored?.refresh_token) {
      fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: stored.refresh_token }),
      }).catch(() => {});
    }
    clearStoredTokens();
    setJwt(null);
  }

  if (!jwt) {
    return (
      <>
        <Background />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  const { role } = parseJwt(jwt);

  if (role === "admin") {
    return (
      <>
        <Background />
        {adminView === "admin" ? (
          <AdminPanel
            jwt={jwt}
            onLogout={handleLogout}
            onSwitchToMonitor={() => setAdminView("monitor")}
          />
        ) : (
          <Viewer
            jwt={jwt}
            onLogout={handleLogout}
            isAdmin
            onSwitchToAdmin={() => setAdminView("admin")}
          />
        )}
      </>
    );
  }

  return <Viewer jwt={jwt} onLogout={handleLogout} />;
}

export default App;
