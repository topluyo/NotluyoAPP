"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setStatus("error");
      setError("Geçersiz oturum açma bağlantısı (kod eksik)");
      return;
    }

    handleCallback(code);
  }, [searchParams]);

  async function handleCallback(code) {
    try {
      setStatus("exchanging");

      // Kodu kendi server API'mize gönder — secret hiç tarayıcıya gelmiyor
      const res = await fetch("/api/auth/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Kimlik doğrulama başarısız");
      }

      setStatus("success");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("OAuth hatası:", err);
      setStatus("error");
      setError(err.message);
    }
  }

  if (status === "error") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>✕</div>
          <h2 style={styles.title}>Giriş Başarısız</h2>
          <p style={styles.errorText}>{error}</p>
          <a href="/login" style={styles.button}>Tekrar Dene</a>
        </div>
      </div>
    );
  }

  const messages = {
    processing: "İşleniyor...",
    exchanging: "Topluyo ile doğrulanıyor...",
    success: "Giriş başarılı! Yönlendiriliyorsunuz...",
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={styles.statusText}>{messages[status]}</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.spinner} />
            <p style={styles.statusText}>Yükleniyor...</p>
          </div>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#fff",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "2.5rem",
    borderRadius: "1rem",
    background: "rgba(26, 26, 26, 0.8)",
    border: "1px solid #2a2a2a",
    minWidth: "300px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #2a2a2a",
    borderTopColor: "#FFC107",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  statusText: {
    color: "#888",
    fontSize: "0.875rem",
  },
  errorIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(239, 68, 68, 0.15)",
    color: "#ef4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  title: {
    fontSize: "1.125rem",
    fontWeight: 600,
  },
  errorText: {
    color: "#888",
    fontSize: "0.8125rem",
    textAlign: "center",
    maxWidth: "280px",
    wordBreak: "break-word",
  },
  button: {
    padding: "0.625rem 1.5rem",
    background: "#FFC107",
    color: "#000",
    borderRadius: "0.5rem",
    fontWeight: 600,
    fontSize: "0.875rem",
    textDecoration: "none",
    marginTop: "0.5rem",
  },
};
