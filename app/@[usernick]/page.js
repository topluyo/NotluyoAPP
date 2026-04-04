import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import styles from "./profile.module.css";

export async function generateMetadata({ params }) {
  const { usernick } = await params;
  return {
    title: `@${usernick} | Nightbord`,
    description: `${usernick}'in Nightbord profili`,
  };
}

export default async function ProfilePage({ params }) {
  const { usernick } = await params;
  const sql = getDb();

  const users = await sql`
    SELECT id, nick, name, avatar_url, created_at
    FROM users WHERE nick = ${usernick}
  `;

  if (users.length === 0) {
    notFound();
  }

  const user = users[0];

  const bords = await sql`
    SELECT id, slug, name, description, visible, created_at, updated_at
    FROM saved_bords 
    WHERE user_id = ${user.id} AND visible = 1
    ORDER BY updated_at DESC
  `;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.brand}>Nightbord</a>
      </header>

      <main className={styles.main}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.nick} />
            ) : (
              <span>{user.nick[0].toUpperCase()}</span>
            )}
          </div>
          <h1 className={styles.name}>{user.name || user.nick}</h1>
          <p className={styles.nick}>@{user.nick}</p>
        </div>

        <section className={styles.bordList}>
          <h2>Bordlar</h2>
          {bords.length === 0 ? (
            <p className={styles.empty}>Henüz paylaşılan bord yok</p>
          ) : (
            <div className={styles.grid}>
              {bords.map((bord) => (
                <a
                  key={bord.id}
                  href={`/@${user.nick}/${bord.slug}`}
                  className={`card ${styles.bordCard}`}
                >
                  <h3>{bord.name}</h3>
                  {bord.description && (
                    <p className={styles.desc}>{bord.description}</p>
                  )}
                  <span className={styles.date}>
                    {new Date(bord.updated_at).toLocaleDateString("tr")}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
