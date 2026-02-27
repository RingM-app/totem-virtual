import { useCallback, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";

const BACKEND_URL = "http://18.190.159.57:3000";
const LIVEKIT_URL = "ws://18.190.159.57:7880";
const ROOM_NAME = "sala_1";

export function useLiveKit(videoRef) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const roomRef = useRef(null);

  const connect = useCallback(async () => {
    if (roomRef.current) return;
    setStatus("connecting");

    try {
      // 1. Login
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "test", password: "1234" }),
      });
      if (!loginRes.ok) throw new Error("Login fallido");
      const { token: jwt } = await loginRes.json();

      // 2. Obtener token LiveKit
      const tokenRes = await fetch(`${BACKEND_URL}/api/livekit/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ room_name: ROOM_NAME }),
      });
      if (!tokenRes.ok) throw new Error("No se pudo obtener token");
      const { token } = await tokenRes.json();

      // 3. Conectar a la sala
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "video" && videoRef.current) {
          track.attach(videoRef.current);
          setStatus("connected");
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setStatus("idle");
        roomRef.current = null;
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      await room.connect(LIVEKIT_URL, token);
      setStatus("connecting"); // esperando el track de video

      // Si ya hay participantes con tracks publicados al conectar
      room.participants.forEach((participant) => {
        participant.tracks.forEach((publication) => {
          if (publication.track?.kind === "video" && videoRef.current) {
            publication.track.attach(videoRef.current);
            setStatus("connected");
          }
        });
      });
    } catch (err) {
      console.error("LiveKit error:", err);
      setStatus("error");
      roomRef.current = null;
    }
  }, [videoRef]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, [videoRef]);

  return { status, connect, disconnect };
}
