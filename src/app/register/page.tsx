"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Globe2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(payload?.error ?? "No fue posible crear la cuenta");
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok) {
        router.replace("/login");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      toast.error("No fue posible crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-8 dark:bg-[#090909] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center rounded-[34px] border border-black/5 bg-white p-6 shadow-[0_35px_120px_-60px_rgba(0,0,0,.45)] dark:border-white/10 dark:bg-zinc-950 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 grid size-11 place-items-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
            <Globe2 className="size-5" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Visual360
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
            Crea tu espacio de trabajo
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tus proyectos quedarán asociados a tu cuenta y disponibles desde cualquier equipo.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre o estudio"
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="h-12 rounded-2xl"
              />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
