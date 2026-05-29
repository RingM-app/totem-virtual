import { useCallback, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { BACKEND_URL, LIVEKIT_URL } from "../config";

export function useLiveKit(videoRef, jwt, roomName) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const roomRef = useRef(null);

  const connect = useCallback(async () => {
    if (roomRef.current) return;
    setStatus("connecting");

    try {
      const tokenRes = await fetch(`${BACKEND_URL}/api/livekit/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ room_name: roomName }),
      });
      if (!tokenRes.ok) throw new Error("No se pudo obtener token LiveKit");
      const { token } = await tokenRes.json();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "video" && videoRef.current) {
          track.attach(videoRef.current);
          setStatus("connected");
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      room.on(RoomEvent.Disconnected, () => {
        setStatus("idle");
        roomRef.current = null;
      });

      await room.connect(LIVEKIT_URL, token);

      room.remoteParticipants.forEach((participant) => {
        participant.tracks.forEach((pub) => {
          if (pub.track?.kind === "video" && videoRef.current) {
            pub.track.attach(videoRef.current);
            setStatus("connected");
          }
        });
      });
    } catch (err) {
      console.error("LiveKit error:", err);
      setStatus("error");
      roomRef.current = null;
    }
  }, [videoRef, jwt, roomName]);

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
