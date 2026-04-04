"use client";

import { useState, useEffect } from "react";
import styles from "./dashboard.module.css";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function createDefaultBord(name) {
  return {
    about: { title: name, description: "", authors: [], keywords: [] },
    options: { theme: "black", color: 1, stroke: 12, version: "1.1.0" },
    camera: { s: 10, x: 0, y: 0 },
    layers: {
      space: [{ name: "Main", drawings: [], medias: [], id: 1 }],
      bord: [{ name: "Main", drawings: [], id: 1 }],
    },
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [storage, setStorage] = useState(null);
  const [savedBords, setSavedBords] = useState([]);
  const [tempBords, setTempBords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewSaved, setShowNewSaved] = useState(false);
  const [newBordName, setNewBordName] = useState("");
  const [newBordSlug, setNewBordSlug] = useState("");

  useEffect(() => {
    loadUser();
    loadTempBords();
    loadSavedBords();
  }, []);

  async function loadUser() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStorage(data.storage);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function loadTempBords() {
    try {
      const stored = JSON.parse(localStorage.getItem("nightbord_temp") || "[]");
      setTempBords(stored);
    } catch {
      setTempBords([]);
    }
  }

  function saveTempBords(bords) {
    localStorage.setItem("nightbord_temp", JSON.stringify(bords));
    setTempBords(bords);
  }

  async function loadSavedBords() {
    try {
      const res = await fetch("/api/bords");
      if (res.ok) {
        const data = await res.json();
        setSavedBords(data.bords || []);
        if (data.storage) setStorage(data.storage);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function createTempBord() {
    const name = `Board ${tempBords.length + 1}`;
    const bord = {
      id: Date.now().toString(),
      name,
      data: createDefaultBord(name),
      createdAt: new Date().toISOString(),
      shared: null,
    };
    saveTempBords([bord, ...tempBords]);
  }

  function deleteTempBord(id) {
    saveTempBords(tempBords.filter((b) => b.id !== id));
  }

  async function shareTempBord(bord) {
    try {
      const res = await fetch("/api/temp/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: bord.name, data: bord.data }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = tempBords.map((b) =>
          b.id === bord.id ? { ...b, shared: data.shared, shareUrl: data.shareUrl } : b
        );
        saveTempBords(updated);
        if (data.storage) setStorage(data.storage);
        alert(`Paylaşım linki: ${data.shareUrl}`);
      } else {
        const err = await res.json();
        alert(err.error || "Paylaşım başarısız");
      }
    } catch (e) {
      alert("Hata: " + e.message);
    }
  }

  async function createSavedBord() {
    if (!newBordName.trim()) return;
    const slug = newBordSlug.trim() || newBordName.toLowerCase().replace(/\W+/g, "-");

    try {
      const res = await fetch("/api/bords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBordName, slug }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedBords([data.bord, ...savedBords]);
        if (data.storage) setStorage(data.storage);
        setShowNewSaved(false);
        setNewBordName("");
        setNewBordSlug("");
      } else {
        const err = await res.json();
        alert(err.error || "Oluşturulamadı");
      }
    } catch (e) {
      alert("Hata: " + e.message);
    }
  }

  async function deleteSavedBord(id) {
    if (!confirm("Bu bordu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/bords/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setSavedBords(savedBords.filter((b) => b.id !== id));
        if (data.storage) setStorage(data.storage);
      }
    } catch (e) {
      alert("Hata: " + e.message);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const storagePercent = storage ? (storage.total / storage.limit) * 100 : 0;
  const storageColor = storage?.isExceeded
    ? "var(--danger)"
    : storage?.isWarning
      ? "var(--warning)"
      : "var(--success)";

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.brand}>Nightbord</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.username}>@{user?.nick}</span>
          <a href="/api/auth/logout" className="btn btn-secondary btn-sm">
            Çıkış
          </a>
        </div>
      </header>

      <main className={styles.main}>
        {/* Storage indicator */}
        {storage && (
          <div className={`card ${styles.storageCard}`}>
            <div className={styles.storageHeader}>
              <span>Depolama</span>
              <span className={styles.storageText}>
                {formatBytes(storage.total)} / {formatBytes(storage.limit)}
              </span>
            </div>
            <div className="storage-bar">
              <div
                className="storage-bar-fill"
                style={{ width: `${Math.min(storagePercent, 100)}%`, background: storageColor }}
              />
            </div>
            {storage.isWarning && !storage.isExceeded && (
              <p className={styles.storageWarn}>⚠️ Depolama alanınız dolmak üzere</p>
            )}
            {storage.isExceeded && (
              <p className={styles.storageError}>🚫 Depolama limiti aşıldı. Bazı bordları silin.</p>
            )}
          </div>
        )}

        {/* Temp Bords */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📝 Geçici Bordlar</h2>
            <button onClick={createTempBord} className="btn btn-primary btn-sm">
              + Yeni Temp
            </button>
          </div>
          <p className={styles.sectionDesc}>
            Tarayıcınızda saklanır. Paylaşıldığında 7 gün boyunca erişilebilir.
          </p>

          {tempBords.length === 0 ? (
            <div className={styles.empty}>Henüz geçici bord yok</div>
          ) : (
            <div className={styles.grid}>
              {tempBords.map((bord) => (
                <div key={bord.id} className="card">
                  <div className={styles.cardTop}>
                    <h3>{bord.name}</h3>
                    <span className={styles.badge}>temp</span>
                  </div>
                  {bord.shared && (
                    <p className={styles.shareInfo}>
                      🔗 Paylaşıldı · Son: {new Date(bord.shared.expires_at).toLocaleDateString("tr")}
                    </p>
                  )}
                  <div className={styles.cardActions}>
                    <button onClick={() => shareTempBord(bord)} className="btn btn-secondary btn-sm">
                      Paylaş
                    </button>
                    <button onClick={() => deleteTempBord(bord.id)} className="btn btn-danger btn-sm">
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Saved Bords */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>💾 Kayıtlı Bordlar</h2>
            <button onClick={() => setShowNewSaved(!showNewSaved)} className="btn btn-primary btn-sm">
              + Yeni Bord
            </button>
          </div>
          <p className={styles.sectionDesc}>
            Veritabanında kalıcı olarak saklanır.
          </p>

          {showNewSaved && (
            <div className={`card ${styles.newBordForm}`}>
              <input
                type="text"
                placeholder="Bord adı"
                value={newBordName}
                onChange={(e) => {
                  setNewBordName(e.target.value);
                  if (!newBordSlug || newBordSlug === newBordName.toLowerCase().replace(/\W+/g, "-")) {
                    setNewBordSlug(e.target.value.toLowerCase().replace(/\W+/g, "-"));
                  }
                }}
                className={styles.input}
              />
              <input
                type="text"
                placeholder="bord-link (slug)"
                value={newBordSlug}
                onChange={(e) => setNewBordSlug(e.target.value)}
                className={styles.input}
              />
              <div className={styles.formActions}>
                <button onClick={() => setShowNewSaved(false)} className="btn btn-secondary btn-sm">
                  İptal
                </button>
                <button onClick={createSavedBord} className="btn btn-primary btn-sm">
                  Oluştur
                </button>
              </div>
            </div>
          )}

          {savedBords.length === 0 ? (
            <div className={styles.empty}>Henüz kayıtlı bord yok</div>
          ) : (
            <div className={styles.grid}>
              {savedBords.map((bord) => (
                <div key={bord.id} className="card">
                  <div className={styles.cardTop}>
                    <h3>{bord.name}</h3>
                    <span className={`${styles.badge} ${styles.badgeSaved}`}>saved</span>
                  </div>
                  <p className={styles.slug}>/{bord.slug}</p>
                  {bord.data_size && (
                    <p className={styles.sizeInfo}>{formatBytes(parseInt(bord.data_size))}</p>
                  )}
                  <div className={styles.cardActions}>
                    <a href={`/u/${user?.nick}/${bord.slug}`} className="btn btn-secondary btn-sm">
                      Aç
                    </a>
                    <button onClick={() => deleteSavedBord(bord.id)} className="btn btn-danger btn-sm">
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
