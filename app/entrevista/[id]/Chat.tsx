"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LangSelector from "../../LangSelector";
import { T, type Lang } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };
type Answer = {
  variable: string;
  value_text: string | null;
  value_numeric: number | null;
  label: "confirmado" | "estimado" | "pendiente";
};

export default function Chat({
  interviewId,
  initialLang,
}: {
  interviewId: string;
  initialLang: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const langRef = useRef(initialLang);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = T[lang];
  const totalVars = Object.keys(t.vars).length;
  const answered = new Set(answers.map((a) => a.variable)).size;
  const complete = answered >= totalVars;

  const refrescarFicha = useCallback(async () => {
    try {
      const r = await fetch(`/api/interview/${interviewId}/answers`);
      const data = await r.json();
      if (data.answers) setAnswers(data.answers);
      if (data.status === "confirmada") setDone(true);
    } catch {
      /* silencioso */
    }
  }, [interviewId]);

  const enviar = useCallback(
    async (history: Msg[]) => {
      setBusy(true);
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            messages: history,
            lang: langRef.current,
          }),
        });
        const data = await r.json();
        if (data.error) {
          setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${data.error}` }]);
        } else {
          setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
          refrescarFicha();
        }
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `⚠️ ${(e as Error).message}` },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [interviewId, refrescarFicha]
  );

  // Arranque: si ya está confirmada, no reabre el chat; si no, saluda.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const r = await fetch(`/api/interview/${interviewId}/answers`);
        const data = await r.json();
        if (data.answers) setAnswers(data.answers);
        if (data.status === "confirmada") {
          setDone(true);
          return;
        }
      } catch {
        /* sigue igualmente */
      }
      enviar([]);
    })();
  }, [enviar, interviewId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  function cambiarIdioma(l: Lang) {
    if (l === lang) return;
    setLang(l);
    langRef.current = l;
    localStorage.setItem("lang", l);
    // Si aún no has respondido nada, Claude vuelve a saludar en el nuevo idioma.
    const yaRespondio = messages.some((m) => m.role === "user");
    if (!done && !busy && !yaRespondio) {
      setMessages([]);
      enviar([]);
    }
  }

  async function confirmar() {
    setConfirming(true);
    try {
      const r = await fetch(`/api/interview/${interviewId}/confirm`, {
        method: "POST",
      });
      if (r.ok) setDone(true);
    } finally {
      setConfirming(false);
    }
  }

  // Al confirmar, genera y muestra el plan en lenguaje claro (en el idioma del cliente).
  useEffect(() => {
    if (!done || plan || loadingPlan || planError) return;
    let cancel = false;
    (async () => {
      setLoadingPlan(true);
      try {
        const r = await fetch(`/api/interview/${interviewId}/plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang: langRef.current }),
        });
        const data = await r.json();
        if (cancel) return;
        if (data.error) setPlanError(data.error);
        else setPlan(data.plan);
      } catch (err) {
        if (!cancel) setPlanError((err as Error).message);
      } finally {
        if (!cancel) setLoadingPlan(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [done, plan, loadingPlan, planError, interviewId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy || done) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    enviar(next);
  }

  return (
    <main className="entrevista-main">
      <header className="entrevista-head">
        <div className="entrevista-head-row">
          <p className="phase">{t.entrevista.eyebrow}</p>
          <LangSelector value={lang} onChange={cambiarIdioma} />
        </div>
        <h1>{t.entrevista.h1}</h1>
      </header>

      <div className="chat-layout">
        <section className="chat">
          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {busy && <div className="bubble assistant typing">·  ·  ·</div>}
          </div>

          {done ? (
            <div className="chat-done">
              <p style={{ margin: "0 0 14px" }}>{t.chat.done}</p>
              {loadingPlan && (
                <p className="plan-loading">{t.chat.planLoading}</p>
              )}
              {plan && (
                <div className="plan-text plan-cliente">
                  <p className="plan-title">{t.chat.planTitle}</p>
                  {plan.split(/\n\n+/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
              {planError && <p className="plan-error">⚠️ {planError}</p>}
            </div>
          ) : (
            <form className="chat-input" onSubmit={onSubmit}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={busy ? t.chat.busy : t.chat.placeholder}
                disabled={busy}
                autoFocus
              />
              <button type="submit" disabled={busy || !input.trim()}>
                {t.chat.send}
              </button>
            </form>
          )}
        </section>

        <aside className="ficha">
          <p className="phase">{t.chat.fichaTitle}</p>
          <p className="ficha-hint">{t.chat.fichaHint}</p>
          <ul>
            {Object.entries(t.vars).map(([key, nombre]) => {
              const a = answers.find((x) => x.variable === key);
              const valor = a
                ? a.value_text ??
                  (a.value_numeric != null ? String(a.value_numeric) : "")
                : "";
              return (
                <li key={key} className={a ? "hecho" : "vacio"}>
                  <div className="ficha-row-main">
                    <span className="ficha-var">{nombre}</span>
                    {a ? (
                      <span className={`chip ${a.label}`}>{t.labels[a.label]}</span>
                    ) : (
                      <span className="chip vacio">—</span>
                    )}
                  </div>
                  {valor && <span className="ficha-valor">{valor}</span>}
                </li>
              );
            })}
          </ul>

          {complete && !done && (
            <div className="ficha-confirm">
              <p className="ficha-review">{t.chat.reviewHint}</p>
              <button onClick={confirmar} disabled={confirming}>
                {confirming ? "…" : t.chat.confirm}
              </button>
            </div>
          )}
        </aside>
      </div>

      <p className="disclaimer disclaimer-footer">{t.disclaimer}</p>
    </main>
  );
}
