// ─────────────────────────────────────────────────────────────────────────────
// MultiplayerService.ts
//
// Thin wrapper around socket.io-client.
// One singleton connection shared by the whole app.
//
// Persistent player identity:
//   Each browser tab generates a UUID stored in sessionStorage.
//   This is sent as socket auth so the server can restore room membership
//   after a socket reconnect (page refresh, brief network drop, etc.).
//   sessionStorage survives page refresh but is cleared when the tab is closed.
// ─────────────────────────────────────────────────────────────────────────────

import { io, type Socket } from "socket.io-client"

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://localhost:3001"

// ── Persistent player ID (survives page refresh within same tab) ──────────────

function getOrCreatePlayerId(): string {
  const KEY = "taptap_player_id"
  let id = sessionStorage.getItem(KEY)
  if (!id) {
    id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    sessionStorage.setItem(KEY, id)
  }
  return id
}

export const MY_PLAYER_ID = getOrCreatePlayerId()

// ── Socket singleton ──────────────────────────────────────────────────────────

let _socket: Socket | null = null

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(BACKEND_URL, {
      autoConnect:          false,
      transports:           ["websocket", "polling"],
      reconnection:         true,
      reconnectionAttempts: 8,
      reconnectionDelay:    1000,
      reconnectionDelayMax: 4000,
      // Pass persistent player ID so the server can restore room membership on reconnect
      auth: { playerId: MY_PLAYER_ID },
    })
  }
  return _socket
}

export function connectSocket(): void {
  const s = getSocket()
  if (!s.connected) s.connect()
}

/** Full disconnect — clears singleton so next connect() gets a fresh socket.
 *  Call when the user explicitly leaves multiplayer. */
export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect()
    _socket = null
    // Clear persistent player ID so returning later gets a fresh identity
    sessionStorage.removeItem("taptap_player_id")
  }
}
