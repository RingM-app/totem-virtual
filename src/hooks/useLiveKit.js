import { useCallback, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { BACKEND_URL, LIVEKIT_URL } from "../config";

export function useLiveKit(videoRef, jwt, roomName) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const [callStatus, setCallStatus] = useState("idle"); // idle | calling | incall
  const roomRef = useRef(null);
  const audioElRef = useRef(null);

  const getOrCreateAudioEl = useCallback(() => {
    if (!audioElRef.current) {
      const el = document.createElement("audio");
      el.autoplay = true;
      document.body.appendChild(el);
      audioElRef.current = el;
    }
    return audioElRef.current;
  }, []);

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
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          setStatus("connected");
        }
        if (track.kind === Track.Kind.Audio) {
          track.attach(getOrCreateAudioEl());
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      room.on(RoomEvent.Disconnected, () => {
        setStatus("idle");
        setCallStatus("idle");
        roomRef.current = null;
      });

      await room.connect(LIVEKIT_URL, token);

      room.remoteParticipants.forEach((participant) => {
        participant.tracks.forEach((pub) => {
          if (pub.track?.kind === Track.Kind.Video && videoRef.current) {
            pub.track.attach(videoRef.current);
            setStatus("connected");
          }
          if (pub.track?.kind === Track.Kind.Audio) {
            pub.track.attach(getOrCreateAudioEl());
          }
        });
      });
    } catch (err) {
      console.error("LiveKit error:", err);
      setStatus("error");
      roomRef.current = null;
    }
  }, [videoRef, jwt, roomName, getOrCreateAudioEl]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.localParticipant?.setMicrophoneEnabled(false).catch(() => {});
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioElRef.current) {
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    setStatus("idle");
    setCallStatus("idle");
  }, [videoRef]);

  const startCall = useCallback(async () => {
    if (!roomRef.current || callStatus !== "idle") return;
    setCallStatus("calling");
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(true);
      setCallStatus("incall");
    } catch (err) {
      console.error("Call error:", err);
      setCallStatus("idle");
    }
  }, [callStatus]);

  const endCall = useCallback(async () => {
    if (!roomRef.current) return;
    await roomRef.current.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    setCallStatus("idle");
  }, []);

  return { status, callStatus, connect, disconnect, startCall, endCall };
}
