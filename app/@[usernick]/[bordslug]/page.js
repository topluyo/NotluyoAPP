import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({ params }) {
  const { usernick, bordslug } = await params;
  const sql = getDb();

  const bords = await sql`
    SELECT b.name, b.description
    FROM saved_bords b
    JOIN users u ON u.id = b.user_id
    WHERE u.nick = ${usernick} AND b.slug = ${bordslug}
  `;

  if (bords.length === 0) {
    return { title: "Bord Not Found | Nightbord" };
  }

  return {
    title: `${bords[0].name} - @${usernick} | Nightbord`,
    description: bords[0].description || "A Nightbord drawing",
  };
}

export default async function BordPage({ params }) {
  const { usernick, bordslug } = await params;
  const sql = getDb();

  const bords = await sql`
    SELECT b.*, u.nick as user_nick, u.name as user_name
    FROM saved_bords b
    JOIN users u ON u.id = b.user_id
    WHERE u.nick = ${usernick} AND b.slug = ${bordslug}
  `;

  if (bords.length === 0) {
    notFound();
  }

  const bord = bords[0];
  const user = await getCurrentUser();
  const isOwner = user && user.id === bord.user_id;

  // Private bord check
  if (!isOwner && bord.visible === 0) {
    notFound();
  }

  const mode = isOwner ? "edit" : "view";

  // Build the info object that the existing JS app expects
  const info = {
    id: bord.id,
    slug: bord.slug,
    name: bord.name,
    description: bord.description,
    keywords: bord.keywords,
    mode,
    isOwner,
    user: {
      nick: bord.user_nick,
      name: bord.user_name,
    },
    currentUser: user
      ? { id: user.id, nick: user.nick, name: user.name }
      : null,
    apiBase: "/api",
    websocket: process.env.WEBSOCKET_ENABLED === "true",
    websocketUrl: process.env.WEBSOCKET_URL || "",
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

        {/* Load the existing Nightbord app scripts */}
        <script src="/vendor/fit-curve.min.js" defer></script>
        <script src="/build/app.html.js" defer></script>
        <script src="/build/app.js" defer></script>
        <script
          src={mode === "edit" ? "/build/app.edit.html.js" : "/build/app.view.html.js"}
          defer
        ></script>
        <script
          src={mode === "edit" ? "/build/app.edit.js" : "/build/app.view.js"}
          defer
        ></script>
      </body>
    </html>
  );
}
