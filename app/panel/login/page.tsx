import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="panel-login">
      <p className="phase">Panel del asesor</p>
      <h1>Entrar</h1>
      <form action={login} className="login-form">
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          autoFocus
          required
        />
        <button type="submit">Entrar</button>
      </form>
      {error && <p className="plan-error">Contraseña incorrecta.</p>}
    </main>
  );
}
