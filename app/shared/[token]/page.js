import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({ params }) {
  const { token } = await params;
  const sql = getDb();

  const bords = await sql`
    SELECT name FROM shared_temp_bords
    WHERE share_token = ${token} AND expires_at > NOW()
  `;

  return {
    title: bords.length > 0 ? `${bords[0].name} (Shared) | Nightbord` : "Not Found | Nightbord",
  };
}

export default async function SharedBordPage({ params }) {
  const { token } = await params;
  const sql = getDb();

  const bords = await sql`
    SELECT stb.*, u.nick as user_nick, u.name as user_name
    FROM shared_temp_bords stb
    JOIN users u ON u.id = stb.user_id
    WHERE stb.share_token = ${token} AND stb.expires_at > NOW()
  `;

  if (bords.length === 0) {
    notFound();
  }

  const bord = bords[0];
  const user = await getCurrentUser();
  const isOwner = user && user.id === bord.user_id;
  const mode = isOwner ? "edit" : "view";

  const info = {
    id: bord.id,
    shareToken: bord.share_token,
    name: bord.name,
    mode,
    isOwner,
    isSharedTemp: true,
    expiresAt: bord.expires_at,
    user: {
      nick: bord.user_nick,
      name: bord.user_name,
    },
    currentUser: user
      ? { id: user.id, nick: user.nick, name: user.name }
      : null,
    apiBase: "/api",
    websocket: false,
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{bord.name} - Nightbord</title>
        <link rel="stylesheet" href="/build/app.css" />
      </head>
      <body style={{ margin: 0, padding: 0, background: "#000", overflow: "hidden" }}>
        <div id="app"></div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.info = ${JSON.stringify(info)};
              window.bord = ${JSON.stringify(bord.data)};
            `,
          }}
        />

        <script src="/vendor/fit-curve.min.js" defer></script>
        <script src="/build/app.html.js" defer></script>
        <script src="/build/app.js" defer></script>
        <script src={`/build/app.${mode}.html.js`} defer></script>
        <script src={`/build/app.${mode}.js`} defer></script>
      </body>
    </html>
  );
}
