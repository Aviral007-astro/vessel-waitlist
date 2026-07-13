import { useMemo, useState } from "react";
import { buildSeal } from "@/lib/signature";

// Replace this with your real Formspark form action URL — find it in your
// Formspark dashboard under the form's Setup section. It looks like
// https://submit-form.com/abcXYZ123
const FORMSPARK_ACTION_URL = "https://submit-form.com/XpgvFM7GA";

// A real, representative typing rhythm (deliberate opening, one correction,
// a quicker middle passage) — the hero seal is genuinely generated from
// this, not a static illustration standing in for the mechanic.
const SAMPLE_RHYTHM: number[][] = [
  [0, 0], [1, 210], [2, 250], [3, 300], [-1, 380], [4, 220], [5, 160],
  [6, 100], [7, 70], [8, 50], [9, 340], [10, 260], [11, 150], [-1, 410],
  [12, 230], [13, 110], [14, 80], [15, 60], [16, 270], [17, 190], [18, 140],
  [19, 90], [20, 310], [-1, 360], [21, 200], [22, 130],
];

function HeroSeal() {
  const seal = useMemo(() => buildSeal(SAMPLE_RHYTHM, 260), []);
  return (
    <svg
      viewBox="0 0 260 260"
      className="w-64 h-64 md:w-80 md:h-80"
      role="img"
      aria-label="A seal generated from real typing rhythm"
    >
      <path
        d={seal.ringPath}
        fill="none"
        stroke="#7A2E2E"
        strokeWidth={1.6}
        opacity={0.55}
        style={{ strokeDasharray: 2000, strokeDashoffset: 2000, animation: "draw-seal 2.6s ease-out forwards" }}
      />
      <path
        d={seal.strokePath}
        fill="none"
        stroke="#7A2E2E"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.88}
        style={{
          strokeDasharray: 1400,
          strokeDashoffset: 1400,
          animation: "draw-seal 2s ease-out forwards",
          animationDelay: "0.4s",
        }}
      />
      {seal.markers.map((m, i) => (
        <circle
          key={i}
          cx={m.x}
          cy={m.y}
          r={3.2}
          fill="#A88A4E"
          opacity={0}
          style={{ animation: "draw-seal 0.4s ease-out forwards", animationDelay: `${2 + i * 0.15}s`, animationFillMode: "forwards" }}
        />
      ))}
    </svg>
  );
}

type JoinState = "idle" | "loading" | "joined" | "error";

export default function App() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<JoinState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const res = await fetch(FORMSPARK_ACTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("joined");
    } catch {
      setErrorMsg("Couldn't submit right now. Try again in a moment.");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="max-w-5xl mx-auto w-full px-6 pt-10">
        <p className="font-display text-2xl tracking-tight text-ink">
          Vess<span className="text-oxblood">el</span>
        </p>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto w-full px-6 py-16 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="font-mono text-xs tracking-[0.3em] uppercase text-oxblood mb-4">
              Coming soon
            </p>
            <h1 className="font-display text-5xl md:text-6xl font-medium tracking-tight text-ink text-balance leading-[1.05]">
              A home for the things
              <br />
              you've never said <span className="text-oxblood">out loud.</span>
            </h1>
            <p className="font-body text-xl text-ink-soft mt-6 max-w-md leading-relaxed">
              Write anonymously. No followers, no DMs, no score — just a pen
              name and a blank page. What you write is sealed by the rhythm
              of how you actually typed it: proof a person wrote it, never
              proof of who.
            </p>

            <form onSubmit={submit} className="mt-10 max-w-md">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={state === "loading" || state === "joined"}
                  className="flex-1 bg-paper border border-ink/25 px-4 py-3 font-body text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-oxblood disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={state === "loading" || state === "joined"}
                  className="font-mono text-xs uppercase tracking-widest px-6 py-3 bg-ink text-paper hover:bg-oxblood transition-colors disabled:opacity-60 disabled:hover:bg-ink whitespace-nowrap"
                >
                  {state === "loading" ? "Joining…" : "Join waitlist"}
                </button>
              </div>

              {state === "joined" && (
                <p className="font-body text-oxblood mt-4">
                  You're on the list — we'll let you know the moment it opens.
                </p>
              )}
              {state === "error" && <p className="font-mono text-xs text-oxblood mt-4">{errorMsg}</p>}

              {state !== "joined" && (
                <p className="font-mono text-xs text-ink-soft mt-4">
                  No spam. One email, when it opens.
                </p>
              )}
            </form>
          </div>

          <div className="flex justify-center">
            <div className="border border-ink/15 bg-paper-dim/50 px-10 py-12 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-ink-soft mb-6">
                Writing as
              </p>
              <p className="font-display text-2xl italic text-oxblood mb-8">
                The Quiet Cartographer
              </p>
              <HeroSeal />
              <p className="font-mono text-[10px] text-ink-soft mt-8 uppercase tracking-widest">
                A real seal, generated from a real typing rhythm
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto w-full px-6 py-10 flex items-center justify-between font-mono text-xs text-ink-soft uppercase tracking-wide">
        <span>Vessel — a home for true stories</span>
        <span>Est. 2026</span>
      </footer>
    </div>
  );
}
