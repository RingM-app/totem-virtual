// Defaults point at production over TLS. They used to be the old Ohio IP over plain
// HTTP: a build without .env sent the guards' passwords in clear to an address that
// is no longer ours.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://totem.ringm.cl";
export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "wss://livekit.totem.ringm.cl";
