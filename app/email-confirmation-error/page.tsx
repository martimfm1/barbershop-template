import Link from 'next/link';
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react';

export default function EmailConfirmationErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100">
      <section
        aria-labelledby="confirmation-error-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl sm:p-8"
      >
        <div
          className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400"
          aria-hidden="true"
        >
          <AlertCircle className="h-6 w-6" />
        </div>

        <h1
          id="confirmation-error-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Não foi possível confirmar o teu e-mail
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          O link de confirmação pode ter expirado, já ter sido utilizado ou não
          ser válido. Pede um novo e-mail de confirmação e tenta novamente.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao login
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Criar conta
          </Link>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
          Se continuares com problemas, verifica se estás a utilizar o e-mail de
          confirmação mais recente.
        </p>
      </section>
    </main>
  );
}
