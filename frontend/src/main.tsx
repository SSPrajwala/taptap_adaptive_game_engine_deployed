import { StrictMode, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// ── Global error boundary — prevents blank white screen on any render error ──
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error("[TapTap] Render error:", e, info)
  }
  render() {
    if (this.state.error) {
      const e = this.state.error as Error
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#06030F", color: "#E8E0FF",
          fontFamily: "Exo 2, sans-serif", padding: "32px", textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontFamily: "Orbitron, monospace", color: "#FF2D78", marginBottom: "12px" }}>
            Something went wrong
          </h2>
          <p style={{ color: "rgba(232,224,255,0.6)", maxWidth: "480px", marginBottom: "24px" }}>
            {e.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "linear-gradient(135deg,#A855F7,#3B82F6)",
              border: "none", borderRadius: "10px", padding: "12px 28px",
              color: "#fff", fontFamily: "Exo 2, sans-serif", fontWeight: 700,
              fontSize: "0.9rem", cursor: "pointer",
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: "24px", color: "rgba(232,224,255,0.3)", fontSize: "0.75rem", maxWidth: "560px" }}>
            <summary style={{ cursor: "pointer" }}>Technical details</summary>
            <pre style={{ textAlign: "left", marginTop: "8px", overflowX: "auto" }}>{e.stack}</pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
