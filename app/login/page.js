import styles from "./login.module.css";

export const metadata = {
  title: "Login | Nightbord",
  description: "Sign in to Nightbord with your Topluyo account",
};

export default function LoginPage({ searchParams }) {
  return (
    <div className={styles.container}>
      <div className={styles.backdrop}>
        <svg width="100%" height="100%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg"
          style={{ strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }}>
          <defs>
            <radialGradient id="bg">
              <stop offset="33%" stopColor="#171717" />
              <stop offset="66%" stopColor="#131313" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>
          </defs>
          <rect width="800" height="600" fill="url(#bg)" />
          {/* Animated drawing paths */}
          <g className={styles.drawGroup}>
            <path d="M100,300 C150,100 350,500 400,300 C450,100 650,500 700,300" stroke="#FFC107" strokeWidth="2" className={styles.drawPath} style={{ "--i": 0, "--len": "1200" }} />
            <path d="M50,200 Q200,50 400,200 T750,200" stroke="#ffffff33" strokeWidth="1.5" className={styles.drawPath} style={{ "--i": 1, "--len": "900" }} />
            <path d="M100,400 Q250,550 400,400 T700,400" stroke="#ffffff22" strokeWidth="1.5" className={styles.drawPath} style={{ "--i": 2, "--len": "800" }} />
            <path d="M200,100 L300,500 L500,150 L600,480" stroke="#4caf5044" strokeWidth="1" className={styles.drawPath} style={{ "--i": 3, "--len": "1000" }} />
            <path d="M150,250 C250,50 550,550 650,250" stroke="#FFC10733" strokeWidth="1" className={styles.drawPath} style={{ "--i": 4, "--len": "700" }} />
          </g>
        </svg>
      </div>

      <div className={styles.panel}>
        <div className={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="20" fill="#FFC107"/>
            <path d="M30 70 L50 30 L70 70" stroke="#000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="50" cy="25" r="4" fill="#000"/>
          </svg>
          <h1>Nightbord</h1>
        </div>
        <p className={styles.subtitle}>New Generation Black Board</p>

        <a href="/api/auth/login" className={`btn btn-primary ${styles.loginBtn}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Topluyo ile Giriş Yap
        </a>

        <p className={styles.hint}>
          Topluyo hesabınız ile güvenli giriş yapın
        </p>
      </div>
    </div>
  );
}
