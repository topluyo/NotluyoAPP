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
    const state = searchParams.get("state");

    if (!code || !state) {
      setStatus("error");
      setError("Missing code or state parameter");
      return;
    }

    handleCallback(code, state);
  }, [searchParams]);

  async function handleCallback(code, state) {
    try {
      setStatus("exchanging");

      // Step 1: Get exchange params from our server (validates state, returns form data)
      const prepRes = await fetch("/api/auth/prepare-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      });

      if (!prepRes.ok) {
        const data = await prepRes.json();
        throw new Error(data.error || "Prepare exchange failed");
      }

      const { formData } = await prepRes.json();

      // Step 2: Exchange code for user data FROM THE BROWSER
      // Browser has cf_clearance for topluyo.com, so Cloudflare won't block
      const tokenRes = await fetch("https://topluyo.com/!pass/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const tokenText = await tokenRes.text();
      let tokenData;
      try {
        tokenData = JSON.parse(tokenText);
      } catch {
        throw new Error("Invalid response from Topluyo: " + tokenText.substring(0, 200));
      }

      if (tokenData.status !== "success" || !tokenData.user) {
        throw new Error(tokenData.message || "Authentication failed");
      }

      setStatus("finalizing");

      // Step 3: Send user data to our server to create JWT session
      const finalRes = await fetch("/api/auth/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: tokenData.user }),
      });

      if (!finalRes.ok) {
        const data = await finalRes.json();
        throw new Error(data.error || "Failed to finalize login");
      }

      setStatus("success");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("OAuth error:", err);
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
    finalizing: "Oturum oluşturuluyor...",
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
