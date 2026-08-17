"use client";

import { useEffect, useState } from "react";
import { crearEntrevista } from "./actions";
import LangSelector from "./LangSelector";
import { T, esLang, type Lang } from "@/lib/i18n";

export default function Home() {
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    setLang(esLang(localStorage.getItem("lang")));
  }, []);

  function cambiar(l: Lang) {
    setLang(l);
    localStorage.setItem("lang", l);
  }

  const t = T[lang].landing;
  const disclaimer = T[lang].disclaimer;

  return (
    <main className="landing">
      <div className="landing-top">
        <LangSelector value={lang} onChange={cambiar} />
      </div>

      <p className="phase">{t.eyebrow}</p>
      <h1>{t.h1}</h1>
      <p className="lead">{t.lead}</p>

      <form action={crearEntrevista}>
        <input type="hidden" name="lang" value={lang} />
        <button type="submit" className="cta">
          {t.cta}
        </button>
      </form>

      <ol className="steps">
        {t.steps.map((p, i) => (
          <li key={i}>
            <span className="step-n">{i + 1}</span>
            <div>
              <strong>{p.title}</strong>
              <p>{p.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="fineprint">{t.fineprint}</p>
      <p className="disclaimer">{disclaimer}</p>
    </main>
  );
}
