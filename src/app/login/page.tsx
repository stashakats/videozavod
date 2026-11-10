import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
    setup?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (!process.env.ADMIN_PASSWORD) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">Вход в панель</h1>
        <p>Закрыто: задай ADMIN_PASSWORD в `.env.local`.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-5 px-6 py-16">
      <h1 className="text-2xl font-semibold">Вход в панель</h1>
      {params.error ? (
        <p className="text-sm text-red-700" role="alert">
          Пароль не подошёл. Попробуй ещё раз.
        </p>
      ) : null}
      {params.setup ? (
        <p className="text-sm text-neutral-600" role="alert">
          Сначала задай ADMIN_PASSWORD в `.env.local`.
        </p>
      ) : null}
      <form action={loginAction} className="flex flex-col gap-4">
        <input name="next" type="hidden" value={params.next ?? "/admin"} />
        <label className="flex flex-col gap-2 text-sm font-medium">
          Пароль администратора
          <input
            autoComplete="current-password"
            className="rounded-md border border-neutral-300 px-3 py-2 font-normal"
            name="password"
            required
            type="password"
          />
        </label>
        <button
          className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          type="submit"
        >
          Войти
        </button>
      </form>
    </main>
  );
}
