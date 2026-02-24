export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #111114)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px",
      padding: "40px 24px",
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: "28px",
        color: "var(--fg, #e8e6e1)",
        letterSpacing: "-0.5px",
      }}>
        ㅌㅌㄷ<span style={{ color: "var(--accent, #e8533e)" }}>.</span>
      </div>

      <div style={{
        width: "48px",
        height: "2px",
        background: "var(--divider, #2e2e35)",
        borderRadius: "2px",
      }} />

      <div style={{
        fontSize: "15px",
        fontWeight: 600,
        color: "var(--fg, #e8e6e1)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        점검중
      </div>

      <p style={{
        fontSize: "14px",
        color: "var(--muted, #7a7680)",
        lineHeight: 1.7,
        maxWidth: "360px",
      }}>
        현재 사이트 점검이 진행 중입니다.<br />
        잠시 후 다시 방문해 주세요.
      </p>
    </div>
  );
}
