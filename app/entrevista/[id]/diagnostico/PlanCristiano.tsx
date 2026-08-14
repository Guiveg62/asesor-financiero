"use client";

import { useState } from "react";

export default function PlanCristiano({ interviewId }: { interviewId: string }) {
  const [plan, setPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/interview/${interviewId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: "es" }),
      });
      const data = await r.json();
      if (data.error) setError(data.error);
      else setPlan(data.plan);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="plan-block">
      <h2>El plan, en lenguaje claro</h2>
      <p className="diag-note">
        Traducción del diagnóstico a lenguaje sencillo para el cliente. La genera{" "}
        <code>claude-opus-5</code> con los límites de las reglas (sin garantías, sin productos concretos).
      </p>

      {plan ? (
        <div className="plan-text">
          {plan.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <button className="plan-regen" onClick={generar} disabled={busy}>
            {busy ? "…" : "Regenerar"}
          </button>
        </div>
      ) : (
        <button className="plan-btn" onClick={generar} disabled={busy}>
          {busy ? "Generando…" : "Generar el plan en lenguaje claro"}
        </button>
      )}

      {error && <p className="plan-error">⚠️ {error}</p>}
    </div>
  );
}
