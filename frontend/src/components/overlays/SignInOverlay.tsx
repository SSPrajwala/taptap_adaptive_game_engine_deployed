import React, { useState } from "react"
import { SideOverlay } from "../ui/SideOverlay"
import { useAuth } from "../../context/AuthContext"

interface Props {
  open:    boolean
  onClose: () => void
}

type Tab = "signin" | "signup"

const inputStyle: React.CSSProperties = {
  width:        "100%",
  background:   "rgba(168,85,247,0.07)",
  border:       "1px solid rgba(168,85,247,0.22)",
  borderRadius: "10px",
  padding:      "11px 14px",
  color:        "#E8E0FF",
  fontFamily:   "Exo 2, sans-serif",
  fontSize:     "0.88rem",
  outline:      "none",
  boxSizing:    "border-box",
  transition:   "border-color 0.2s, box-shadow 0.2s",
}

const labelStyle: React.CSSProperties = {
  display:     "block",
  fontFamily:  "Exo 2, sans-serif",
  fontSize:    "0.75rem",
  fontWeight:  600,
  color:       "rgba(232,224,255,0.55)",
  marginBottom:"6px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
}

const Field: React.FC<{
  label:       string
  type?:       string
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
  required?:   boolean
}> = ({ label, type = "text", value, onChange, placeholder, required }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={labelStyle}>{label}{required && <span style={{ color: "#FF2D78", marginLeft: "3px" }}>*</span>}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={e => {
        e.currentTarget.style.borderColor = "rgba(168,85,247,0.6)"
        e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(168,85,247,0.12)"
      }}
      onBlur={e => {
        e.currentTarget.style.borderColor = "rgba(168,85,247,0.22)"
        e.currentTarget.style.boxShadow   = "none"
      }}
    />
  </div>
)

const PrimaryBtn: React.FC<{
  onClick: () => void
  loading?: boolean
  children: React.ReactNode
}> = ({ onClick, loading, children }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      width:        "100%",
      padding:      "12px",
      background:   loading ? "rgba(168,85,247,0.3)" : "linear-gradient(135deg,#A855F7,#3B82F6)",
      border:       "none",
      borderRadius: "10px",
      color:        "#fff",
      fontFamily:   "Exo 2, sans-serif",
      fontWeight:   700,
      fontSize:     "0.9rem",
      cursor:       loading ? "not-allowed" : "pointer",
      boxShadow:    loading ? "none" : "0 0 20px rgba(168,85,247,0.4)",
      transition:   "all 0.2s",
      marginTop:    "4px",
    }}
  >
    {loading ? "Please wait…" : children}
  </button>
)

export const SignInOverlay: React.FC<Props> = ({ open, onClose }) => {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<Tab>("signin")

  // Sign In state
  const [siEmail,    setSiEmail]    = useState("")
  const [siPassword, setSiPassword] = useState("")

  // Sign Up state
  const [suName,     setSuName]     = useState("")
  const [suEmail,    setSuEmail]    = useState("")
  const [suPassword, setSuPassword] = useState("")
  const [suCollege,  setSuCollege]  = useState("")

  const [error,   setError]   = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const reset = () => {
    setError(""); setSuccess(""); setLoading(false)
  }

  const handleSignIn = async () => {
    reset()
    if (!siEmail || !siPassword) { setError("Email and password are required."); return }
    setLoading(true)
    const result = await login(siEmail, siPassword)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setSuccess("Welcome back! 🎉")
    setTimeout(onClose, 1200)
  }

  const handleSignUp = async () => {
    reset()
    if (!suName || !suEmail || !suPassword) { setError("Name, email and password are required."); return }
    if (suPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    setLoading(true)
    const result = await register(suName, suEmail, suPassword, suCollege)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setSuccess("Account created! Welcome to TapTap 🚀")
    setTimeout(onClose, 1400)
  }

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => { setTab(t); reset() }}
      style={{
        flex:       1,
        padding:    "9px",
        background: tab === t ? "rgba(168,85,247,0.18)" : "transparent",
        border:     tab === t ? "1px solid rgba(168,85,247,0.35)" : "1px solid transparent",
        borderRadius:"8px",
        color:      tab === t ? "#E8E0FF" : "rgba(232,224,255,0.4)",
        fontFamily: "Exo 2, sans-serif",
        fontWeight: 700,
        fontSize:   "0.82rem",
        cursor:     "pointer",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  )

  return (
    <SideOverlay
      open={open}
      onClose={() => { reset(); onClose() }}
      title={tab === "signin" ? "Sign In" : "Create Account"}
      subtitle="TapTap Game Engine"
      width={420}
    >
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        {tabBtn("signin", "Sign In")}
        {tabBtn("signup", "Sign Up")}
      </div>

      {/* Error / Success messages */}
      {error && (
        <div style={{
          background:   "rgba(255,45,120,0.1)",
          border:       "1px solid rgba(255,45,120,0.3)",
          borderRadius: "10px",
          padding:      "10px 14px",
          color:        "#FF6090",
          fontFamily:   "Exo 2, sans-serif",
          fontSize:     "0.83rem",
          marginBottom: "16px",
        }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{
          background:   "rgba(34,255,170,0.1)",
          border:       "1px solid rgba(34,255,170,0.3)",
          borderRadius: "10px",
          padding:      "10px 14px",
          color:        "#22FFAA",
          fontFamily:   "Exo 2, sans-serif",
          fontSize:     "0.83rem",
          marginBottom: "16px",
        }}>
          {success}
        </div>
      )}

      {/* ── SIGN IN FORM ──────────────────────────────────────────────────── */}
      {tab === "signin" && (
        <>
          <Field label="Email"    type="email"    value={siEmail}    onChange={setSiEmail}    placeholder="you@college.edu" required />
          <Field label="Password" type="password" value={siPassword} onChange={setSiPassword} placeholder="••••••••" required />
          <PrimaryBtn onClick={handleSignIn} loading={loading}>Sign In →</PrimaryBtn>
          <div style={{ textAlign: "center", marginTop: "18px", color: "rgba(232,224,255,0.35)", fontFamily: "Exo 2, sans-serif", fontSize: "0.78rem" }}>
            New here?{" "}
            <button onClick={() => { setTab("signup"); reset() }} style={{ background: "none", border: "none", color: "#A855F7", cursor: "pointer", fontFamily: "Exo 2, sans-serif", fontSize: "0.78rem", fontWeight: 700 }}>
              Create an account
            </button>
          </div>
        </>
      )}

      {/* ── SIGN UP FORM ──────────────────────────────────────────────────── */}
      {tab === "signup" && (
        <>
          <Field label="Full Name"   value={suName}     onChange={setSuName}     placeholder="Your name" required />
          <Field label="Email"       type="email"       value={suEmail}    onChange={setSuEmail}    placeholder="you@college.edu" required />
          <Field label="Password"    type="password"    value={suPassword} onChange={setSuPassword} placeholder="Min 6 characters" required />
          <Field label="College (optional)" value={suCollege}  onChange={setSuCollege}  placeholder="e.g. IIT Bombay" />
          <PrimaryBtn onClick={handleSignUp} loading={loading}>Create Account →</PrimaryBtn>
          <div style={{ textAlign: "center", marginTop: "18px", color: "rgba(232,224,255,0.35)", fontFamily: "Exo 2, sans-serif", fontSize: "0.78rem" }}>
            Already registered?{" "}
            <button onClick={() => { setTab("signin"); reset() }} style={{ background: "none", border: "none", color: "#A855F7", cursor: "pointer", fontFamily: "Exo 2, sans-serif", fontSize: "0.78rem", fontWeight: 700 }}>
              Sign In
            </button>
          </div>
        </>
      )}

      {/* Backend note */}
      <div style={{
        marginTop:    "28px",
        padding:      "12px",
        background:   "rgba(168,85,247,0.04)",
        border:       "1px solid rgba(168,85,247,0.1)",
        borderRadius: "8px",
        color:        "rgba(232,224,255,0.3)",
        fontFamily:   "Exo 2, sans-serif",
        fontSize:     "0.72rem",
        lineHeight:   1.5,
      }}>
        🔐 Your data is stored locally on the TapTap backend.<br />
        Make sure the backend is running: <code style={{ color: "rgba(168,85,247,0.5)" }}>cd backend &amp;&amp; npm start</code>
      </div>
    </SideOverlay>
  )
}
