import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSocket } from "./SocketContext";
import { useAuth }   from "./AuthContext";
import { buildIceServers, getMediaStream, stopStream } from "../utils/webrtc";

const CallContext = createContext(null);
export const useCall = () => useContext(CallContext);

/**
 * Gère tout le cycle de vie d'un appel 1-1 (audio ou vidéo) :
 *   - startCall(peer, type)
 *   - answerCall() / rejectCall()
 *   - endCall()
 *
 * Expose les streams local et distant pour que l'UI les peigne dans
 * <video>.srcObject.
 */
export function CallProvider({ children }) {
  const { socket } = useSocket();
  const { user }   = useAuth();

  const [call, setCall] = useState(null);
  /**
   * call = {
   *   id, type: 'audio'|'video', direction: 'outgoing'|'incoming',
   *   state: 'ringing'|'ongoing'|'ended',
   *   peer: { id, username, display_name, avatar_url },
   *   conversation_id,
   * }
   */
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const pcRef       = useRef(null);
  const offerRef    = useRef(null);    // SDP offer reçu en entrant
  const startedAt   = useRef(null);
  const localRef    = useRef(null);    // local stream (pour cleanup)
  const iceQueueRef = useRef([]);      // ICE reçus avant que la PC n'existe

  const cleanup = useCallback(() => {
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    stopStream(localRef.current);
    stopStream(remoteStream);
    localRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCall(null);
    offerRef.current = null;
    startedAt.current = null;
  }, [remoteStream]);

  const createPeer = useCallback((peerUserId) => {
    const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit("call:ice", { to_user_id: peerUserId, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        setCall((c) => (c ? { ...c, state: "ended" } : c));
      }
    };
    pcRef.current = pc;
    return pc;
  }, [socket]);

  async function drainIceQueue() {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    while (iceQueueRef.current.length) {
      const c = iceQueueRef.current.shift();
      try { await pc.addIceCandidate(c); } catch (err) { console.error(err); }
    }
  }

  // -------- Actions publiques --------
  const startCall = useCallback(async (peer, conversation_id, type = "audio") => {
    if (!socket) return;
    try {
      const stream = await getMediaStream(type === "video");
      localRef.current = stream;
      setLocalStream(stream);

      const pc = createPeer(peer.id);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setCall({
        id: null,
        type,
        direction: "outgoing",
        state: "ringing",
        peer,
        conversation_id,
      });

      socket.emit("call:invite", {
        conversation_id,
        to_user_id: peer.id,
        type,
        sdp_offer: offer,
      });
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'accéder à la caméra/micro");
      cleanup();
    }
  }, [socket, createPeer, cleanup]);

  const answerCall = useCallback(async () => {
    if (!socket || !call || call.direction !== "incoming") return;
    try {
      const stream = await getMediaStream(call.type === "video");
      localRef.current = stream;
      setLocalStream(stream);

      const pc = createPeer(call.peer.id);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(offerRef.current);
      await drainIceQueue();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:accept", {
        call_id: call.id,
        to_user_id: call.peer.id,
        sdp_answer: answer,
      });
      startedAt.current = Date.now();
      setCall((c) => ({ ...c, state: "ongoing" }));
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'accepter l'appel");
      cleanup();
    }
  }, [socket, call, createPeer, cleanup]);

  const rejectCall = useCallback(() => {
    if (!socket || !call) return;
    socket.emit("call:reject", { call_id: call.id, to_user_id: call.peer.id });
    cleanup();
  }, [socket, call, cleanup]);

  const endCall = useCallback(() => {
    if (!socket) return cleanup();
    const duration = startedAt.current
      ? Math.round((Date.now() - startedAt.current) / 1000)
      : 0;
    if (call) {
      socket.emit("call:end", {
        call_id: call.id,
        to_user_id: call.peer.id,
        duration,
      });
    }
    cleanup();
  }, [socket, call, cleanup]);

  // -------- Réception des events socket --------
  useEffect(() => {
    if (!socket) return;

    const onIncoming = ({ call_id, conversation_id, type, from, sdp_offer }) => {
      if (call) return; // un autre appel est déjà en cours
      offerRef.current = sdp_offer;
      setCall({
        id: call_id,
        type,
        direction: "incoming",
        state: "ringing",
        peer: from,
        conversation_id,
      });
      toast(`📞 Appel ${type === "video" ? "vidéo" : "audio"} de ${from.display_name || from.username}`);
    };

    const onCreated = ({ call_id }) => {
      setCall((c) => (c ? { ...c, id: call_id } : c));
    };

    const onAccepted = async ({ sdp_answer }) => {
      try {
        await pcRef.current?.setRemoteDescription(sdp_answer);
        await drainIceQueue();
        startedAt.current = Date.now();
        setCall((c) => (c ? { ...c, state: "ongoing" } : c));
      } catch (err) {
        console.error(err);
      }
    };

    const onRejected = () => {
      toast("Appel refusé");
      cleanup();
    };

    const onIce = async ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        try { await pcRef.current.addIceCandidate(candidate); } catch (err) { console.error(err); }
      } else {
        iceQueueRef.current.push(candidate);
      }
    };

    const onEnded = () => {
      cleanup();
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:created",  onCreated);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:ice",      onIce);
    socket.on("call:ended",    onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:created",  onCreated);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:ice",      onIce);
      socket.off("call:ended",    onEnded);
    };
  }, [socket, call, cleanup]);

  // Nettoyage si l'utilisateur se déconnecte
  useEffect(() => { if (!user) cleanup(); }, [user, cleanup]);

  const value = {
    call, localStream, remoteStream,
    startCall, answerCall, rejectCall, endCall,
  };
  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
