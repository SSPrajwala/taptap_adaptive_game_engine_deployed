/**
 * socketHandlers.js — Socket.io event handlers
 *
 * Reconnect recovery:
 *   On every connection we check socket.handshake.auth.playerId.
 *   If a player with that persistent ID is already in a room, we restore them
 *   (update their socketId, clear disconnected flag, re-join the Socket.io room).
 *   This handles browser refresh, brief network drops, and auto-reconnect.
 *
 * Event contract (client → server):
 *   room:create    { playerName }
 *   room:join      { code, playerName }
 *   room:ready     { ready: boolean }
 *   room:selectGame{ gameId, gameTitle, questionCount }
 *   room:start     {}
 *   room:sync      {}                       ← request current room state
 *   game:answer    { roomCode, correct, pointsAwarded }
 *   room:leave     {}
 *
 * Event contract (server → client):
 *   room:created   { room }                 → only to creator
 *   room:joined    { room }                 → only to joiner
 *   room:updated   { room }                 → broadcast to ALL in room
 *   room:error     { message }              → only to sender
 *   room:restored  { room }                 → sent to reconnecting player only
 *   game:countdown { seconds }              → broadcast, fires 3-2-1
 *   game:start     { room }                 → broadcast, game begins
 *   game:question  { index }                → broadcast, advance question
 *   game:scoreUpdate { leaderboard }        → broadcast after each answer
 *   game:end       { leaderboard }          → broadcast, game over
 *   player:joined  { name }                 → broadcast when player enters lobby
 *   player:left    { name, disconnected }   → broadcast when player leaves
 */

const rm = require("./roomManager")

const COUNTDOWN_SECONDS = 3

module.exports = function attachSocketHandlers(io) {

  io.on("connection", (socket) => {
    const playerId = socket.handshake.auth?.playerId || null
    console.log(`[Socket] connected: ${socket.id}  playerId: ${playerId ?? "none"}`)

    // ── Reconnect recovery ──────────────────────────────────────────────────
    // If this playerId is already in a room (e.g. after a refresh / auto-reconnect),
    // restore their membership immediately without requiring them to re-join.
    if (playerId) {
      const restored = rm.rejoinRoom(playerId, socket.id)
      if (restored) {
        const { room } = restored
        socket.join(room.code)
        // Tell the reconnecting client their room state
        socket.emit("room:restored", { room: rm.serializeRoom(room) })
        // Tell everyone else this player is back
        socket.to(room.code).emit("room:updated", { room: rm.serializeRoom(room) })
        console.log(`[Room] ${room.code} — player ${restored.player.name} reconnected`)
      }
    }

    // ── Create room ─────────────────────────────────────────────────────────
    socket.on("room:create", ({ playerName } = {}) => {
      if (!playerName?.trim()) {
        return socket.emit("room:error", { message: "Player name is required." })
      }
      const pid = playerId || socket.id
      const { room } = rm.createRoom(socket.id, pid, playerName)
      socket.join(room.code)
      socket.emit("room:created", { room: rm.serializeRoom(room) })
      console.log(`[Room] ${room.code} created by ${playerName}`)
    })

    // ── Join room ───────────────────────────────────────────────────────────
    socket.on("room:join", ({ code, playerName } = {}) => {
      if (!code?.trim() || !playerName?.trim()) {
        return socket.emit("room:error", { message: "Room code and name required." })
      }
      const pid    = playerId || socket.id
      const result = rm.joinRoom(code, socket.id, pid, playerName)
      if (result.error) {
        return socket.emit("room:error", { message: result.error })
      }
      const { room, player } = result
      socket.join(room.code)
      // Tell the joiner their room state
      socket.emit("room:joined", { room: rm.serializeRoom(room) })
      // Tell everyone in the room (including the joiner via broadcast) the update
      io.to(room.code).emit("room:updated", { room: rm.serializeRoom(room) })
      io.to(room.code).emit("player:joined", { name: player.name })
      console.log(`[Room] ${player.name} joined ${room.code}`)
    })

    // ── Ready toggle ────────────────────────────────────────────────────────
    socket.on("room:ready", ({ ready } = {}) => {
      const room = rm.setReady(socket.id, !!ready)
      if (!room) return
      io.to(room.code).emit("room:updated", { room: rm.serializeRoom(room) })
    })

    // ── Sync (force-request current room state) ─────────────────────────────
    socket.on("room:sync", () => {
      const room = rm.getRoomBySocket(socket.id)
      if (room) {
        socket.emit("room:updated", { room: rm.serializeRoom(room) })
      }
    })

    // ── Host selects game ───────────────────────────────────────────────────
    socket.on("room:selectGame", ({ gameId, gameTitle, questionCount } = {}) => {
      const room = rm.selectGame(socket.id, gameId, gameTitle, questionCount || 0)
      if (!room) return socket.emit("room:error", { message: "You are not the host." })
      io.to(room.code).emit("room:updated", { room: rm.serializeRoom(room) })
    })

    // ── Start game ──────────────────────────────────────────────────────────
    socket.on("room:start", () => {
      const result = rm.startGame(socket.id)
      if (result.error) {
        return socket.emit("room:error", { message: result.error })
      }
      const { room } = result
      // Broadcast updated room (status = countdown)
      io.to(room.code).emit("room:updated", { room: rm.serializeRoom(room) })

      // Countdown 3 … 2 … 1 … GO  then start first question
      let count = COUNTDOWN_SECONDS
      const tick = setInterval(() => {
        io.to(room.code).emit("game:countdown", { seconds: count })
        count--
        if (count < 0) {
          clearInterval(tick)
          // advanceQuestion sets index=1 and status="playing"
          const started = rm.advanceQuestion(room.code)
          if (!started) return
          // Reset index to 0 for first question
          started.currentQuestionIndex = 0
          started.status = "playing"
          io.to(room.code).emit("game:start",    { room: rm.serializeRoom(started) })
          io.to(room.code).emit("game:question", { index: 0 })
        }
      }, 1000)
    })

    // ── Player submits answer ───────────────────────────────────────────────
    socket.on("game:answer", ({ roomCode, correct, pointsAwarded } = {}) => {
      if (!roomCode) return
      const result = rm.submitAnswer(socket.id, roomCode, !!correct, pointsAwarded || 0)
      if (!result) return

      const { room, allAnswered } = result
      const lb = rm.getLeaderboard(roomCode)

      io.to(room.code).emit("game:scoreUpdate", { leaderboard: lb })

      if (allAnswered) {
        setTimeout(() => {
          const next = rm.advanceQuestion(room.code)
          if (!next) return

          if (next.status === "ended") {
            io.to(room.code).emit("game:end", { leaderboard: rm.getLeaderboard(roomCode) })
          } else {
            io.to(room.code).emit("game:question", { index: next.currentQuestionIndex })
          }
        }, 1500)
      }
    })

    // ── Explicit leave ──────────────────────────────────────────────────────
    socket.on("room:leave", () => handleLeave(socket, true))

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] disconnected: ${socket.id}  reason: ${reason}`)
      // Only handle as permanent leave for explicit close; transport errors may reconnect
      handleLeave(socket, false)
    })

    function handleLeave(socket, explicit) {
      const result = rm.leaveRoom(socket.id)
      if (!result) return
      const { code, room } = result

      if (explicit) {
        socket.leave(code)
        if (_socket) {
          // clean up singleton on explicit leave so re-opening the page gets a fresh socket
        }
      }

      if (room) {
        const player = [...room.players.values()].find(p => p.socketId === socket.id)
        io.to(code).emit("room:updated", { room: rm.serializeRoom(room) })
        if (player) {
          io.to(code).emit("player:left", {
            name:         player.name,
            disconnected: !explicit,   // true = may reconnect, false = left intentionally
          })
        }
      }
    }
  })
}

// (not used server-side but avoids lint warning in template)
const _socket = null
void _socket
