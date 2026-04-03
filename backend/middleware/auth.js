/**
 * JWT middleware helpers
 */
const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "taptap_engine_jwt_secret_2024_production"

/**
 * requireAuth — blocks request if no valid JWT
 */
function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Authentication required." })
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token. Please log in again." })
  }
}

/**
 * optionalAuth — attaches user to req if token present, continues either way
 */
function optionalAuth(req, _res, next) {
  const auth = req.headers.authorization
  if (auth?.startsWith("Bearer ")) {
    try { req.user = jwt.verify(auth.slice(7), JWT_SECRET) } catch {}
  }
  next()
}

module.exports = { requireAuth, optionalAuth }
