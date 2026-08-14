"use client";

import { LANGS, type Lang } from "@/lib/i18n";

export default function LangSelector({
  value,
  onChange,
}: {
  value: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="lang-selector" role="group" aria-label="Idioma / Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={value === l.code ? "active" : ""}
          onClick={() => onChange(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
