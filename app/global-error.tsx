"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[LockInTalks global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(180deg,#0797f2,#b8f0ff 60%,#071b3b)", color: "white", padding: 24 }}>
          <section style={{ maxWidth: 640, border: "1px solid rgba(255,215,101,.55)", borderRadius: 8, padding: 32, textAlign: "center", background: "rgba(7,27,59,.9)", boxShadow: "0 24px 70px rgba(7,27,59,.25)" }}>
            <p style={{ color: "#ffd765", letterSpacing: ".2em", textTransform: "uppercase", fontSize: 12, fontWeight: 800 }}>LockInTalks</p>
            <h1>We hit a temporary issue.</h1>
            <p style={{ color: "rgba(255,255,255,.7)", lineHeight: 1.7 }}>Refresh the page or return home. The platform is protected from white-screen crashes during beta.</p>
            {error.digest && <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12 }}>Error digest: {error.digest}</p>}
            <Link href="/" style={{ color: "#d4af37", fontWeight: 800 }}>Back Home</Link>
          </section>
        </main>
      </body>
    </html>
  );
}
