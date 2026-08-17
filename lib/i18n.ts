export type Lang = "es" | "sv" | "en";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "ES" },
  { code: "sv", label: "SV" },
  { code: "en", label: "EN" },
];

export const NOMBRE_IDIOMA: Record<Lang, string> = {
  es: "español",
  sv: "sueco",
  en: "inglés",
};

type Paso = { title: string; body: string };

type Dict = {
  landing: {
    eyebrow: string;
    h1: string;
    lead: string;
    cta: string;
    steps: [Paso, Paso, Paso];
    fineprint: string;
  };
  entrevista: { eyebrow: string; h1: string };
  chat: {
    placeholder: string;
    busy: string;
    send: string;
    done: string;
    fichaTitle: string;
    fichaHint: string;
    reviewHint: string;
    confirm: string;
    emailPrompt: string;
    emailPlaceholder: string;
    emailSend: string;
    emailSending: string;
    emailSent: string;
    planTitle: string;
    planLoading: string;
  };
  labels: Record<string, string>; // etiquetas de chip
  vars: Record<string, string>; // nombres de las 13 variables
  disclaimer: string; // descargo de responsabilidad (finanzas)
};

export const T: Record<Lang, Dict> = {
  es: {
    landing: {
      eyebrow: "Diagnóstico financiero",
      h1: "Conoce dónde estás con tu dinero.",
      lead: "Una conversación de unas diez preguntas, sin papeles ni tecnicismos. Al terminar, tu asesor prepara tu primer diagnóstico con lo que nos cuentes.",
      cta: "Empezar mi diagnóstico →",
      steps: [
        { title: "Respondes", body: "Una pregunta a la vez, con lo que recuerdes. Sin prisa." },
        { title: "Se guarda tu ficha", body: "Cada dato queda anotado, distinguiendo lo seguro de lo aproximado." },
        { title: "Tu asesor prepara el diagnóstico", body: "Con tu cuadro completo delante, en vuestra reunión." },
      ],
      fineprint: "Tus respuestas son un borrador para tu asesor, no un consejo automático. Puedes hablar en español, sueco o inglés.",
    },
    entrevista: { eyebrow: "Diagnóstico financiero · Entrevista", h1: "Cuéntame tu situación" },
    chat: {
      placeholder: "Escribe tu respuesta…",
      busy: "Un momento…",
      send: "Enviar",
      done: "✓ Entrevista confirmada. El asesor preparará tu diagnóstico.",
      fichaTitle: "Tu ficha, en vivo",
      fichaHint: "Cada dato se guarda con su etiqueta.",
      reviewHint: "Ya está toda tu ficha. Revísala; si algo está mal, corrígelo en el chat. Cuando esté bien, confírmala.",
      confirm: "Confirmar y cerrar",
      emailPrompt: "¿Quieres recibir tu plan por email?",
      emailPlaceholder: "tu@correo.com",
      emailSend: "Enviármelo",
      emailSending: "Enviando…",
      emailSent: "✓ Te lo hemos enviado a tu correo.",
      planTitle: "Tu plan, en palabras claras",
      planLoading: "Preparando tu plan…",
    },
    labels: { confirmado: "confirmado", estimado: "estimado", pendiente: "pendiente" },
    vars: {
      edad: "Edad",
      empleo_contrato: "Empleo y contrato",
      tjanstepension: "Tjänstepension",
      akassa_inkomstforsakring: "A-kassa / inkomstförsäkring",
      ingresos_netos: "Ingresos netos/mes",
      capacidad_ahorro: "Capacidad de ahorro/mes",
      capital_actual: "Capital actual",
      patrimonio_inmobiliario: "Patrimonio inmobiliario",
      pension_proyectada: "Pensión proyectada",
      deudas: "Deudas",
      buffert: "Buffert",
      perfil_riesgo: "Perfil de riesgo",
      pareja: "Pareja",
      meta: "Meta",
    },
    disclaimer:
      "Herramienta orientativa. No constituye asesoramiento financiero regulado (en Suecia, la asesoría financiera está supervisada por Finansinspektionen). Las proyecciones son estimaciones, no garantías. Consulta a un asesor cualificado antes de tomar decisiones.",
  },

  sv: {
    landing: {
      eyebrow: "Ekonomisk kartläggning",
      h1: "Se var du står med din ekonomi.",
      lead: "Ett samtal på ett tiotal frågor, utan papper eller facktermer. När vi är klara förbereder din rådgivare din första kartläggning utifrån det du berättar.",
      cta: "Starta min kartläggning →",
      steps: [
        { title: "Du svarar", body: "En fråga i taget, med det du minns. Ingen brådska." },
        { title: "Din profil sparas", body: "Varje uppgift antecknas och vi skiljer på det säkra och det ungefärliga." },
        { title: "Din rådgivare förbereder kartläggningen", body: "Med hela din bild framför sig, på ert möte." },
      ],
      fineprint: "Dina svar är ett underlag för din rådgivare, inte ett automatiskt råd. Du kan prata spanska, svenska eller engelska.",
    },
    entrevista: { eyebrow: "Ekonomisk kartläggning · Intervju", h1: "Berätta om din situation" },
    chat: {
      placeholder: "Skriv ditt svar…",
      busy: "Ett ögonblick…",
      send: "Skicka",
      done: "✓ Intervjun är bekräftad. Rådgivaren förbereder din kartläggning.",
      fichaTitle: "Din profil, live",
      fichaHint: "Varje uppgift sparas med sin etikett.",
      reviewHint: "Nu är hela din profil ifylld. Gå igenom den; om något är fel, rätta det i chatten. Bekräfta när allt stämmer.",
      confirm: "Bekräfta och avsluta",
      emailPrompt: "Vill du få din plan via e-post?",
      emailPlaceholder: "du@epost.se",
      emailSend: "Skicka till mig",
      emailSending: "Skickar…",
      emailSent: "✓ Vi har skickat den till din e-post.",
      planTitle: "Din plan, i klartext",
      planLoading: "Förbereder din plan…",
    },
    labels: { confirmado: "bekräftad", estimado: "uppskattad", pendiente: "saknas" },
    vars: {
      edad: "Ålder",
      empleo_contrato: "Anställning och avtal",
      tjanstepension: "Tjänstepension",
      akassa_inkomstforsakring: "A-kassa / inkomstförsäkring",
      ingresos_netos: "Nettoinkomst/mån",
      capacidad_ahorro: "Sparförmåga/mån",
      capital_actual: "Nuvarande kapital",
      patrimonio_inmobiliario: "Fastigheter / bostad",
      pension_proyectada: "Prognostiserad pension",
      deudas: "Skulder",
      buffert: "Buffert",
      perfil_riesgo: "Riskprofil",
      pareja: "Partner",
      meta: "Mål",
    },
    disclaimer:
      "Vägledande verktyg. Utgör inte reglerad finansiell rådgivning (finansiell rådgivning står under Finansinspektionens tillsyn i Sverige). Prognoserna är uppskattningar, inte garantier. Rådgör med en kvalificerad rådgivare innan du fattar beslut.",
  },

  en: {
    landing: {
      eyebrow: "Financial check-up",
      h1: "See where you stand with your money.",
      lead: "A conversation of about ten questions, no paperwork and no jargon. When we're done, your advisor prepares your first diagnosis from what you tell us.",
      cta: "Start my check-up →",
      steps: [
        { title: "You answer", body: "One question at a time, with what you remember. No rush." },
        { title: "Your profile is saved", body: "Every detail is recorded, telling apart the certain from the approximate." },
        { title: "Your advisor prepares the diagnosis", body: "With your full picture in front of them, at your meeting." },
      ],
      fineprint: "Your answers are a draft for your advisor, not automated advice. You can talk in Spanish, Swedish or English.",
    },
    entrevista: { eyebrow: "Financial check-up · Interview", h1: "Tell me about your situation" },
    chat: {
      placeholder: "Type your answer…",
      busy: "One moment…",
      send: "Send",
      done: "✓ Interview confirmed. Your advisor will prepare your diagnosis.",
      fichaTitle: "Your profile, live",
      fichaHint: "Every detail is saved with its label.",
      reviewHint: "Your whole profile is filled in. Review it; if anything is wrong, fix it in the chat. Confirm when it looks right.",
      confirm: "Confirm and close",
      emailPrompt: "Want to get your plan by email?",
      emailPlaceholder: "you@email.com",
      emailSend: "Send it to me",
      emailSending: "Sending…",
      emailSent: "✓ We've sent it to your email.",
      planTitle: "Your plan, in plain words",
      planLoading: "Preparing your plan…",
    },
    labels: { confirmado: "confirmed", estimado: "estimated", pendiente: "pending" },
    vars: {
      edad: "Age",
      empleo_contrato: "Employment and contract",
      tjanstepension: "Occupational pension",
      akassa_inkomstforsakring: "Unemployment insurance",
      ingresos_netos: "Net income/month",
      capacidad_ahorro: "Saving capacity/month",
      capital_actual: "Current savings",
      patrimonio_inmobiliario: "Property / real estate",
      pension_proyectada: "Projected pension",
      deudas: "Debts",
      buffert: "Buffer",
      perfil_riesgo: "Risk profile",
      pareja: "Partner",
      meta: "Goal",
    },
    disclaimer:
      "Guidance tool only. Not regulated financial advice (in Sweden, financial advice is supervised by Finansinspektionen). Projections are estimates, not guarantees. Consult a qualified adviser before making decisions.",
  },
};

export function esLang(v: string | null | undefined): Lang {
  return v === "sv" || v === "en" ? v : "es";
}
