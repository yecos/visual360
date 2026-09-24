"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, Globe2, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok) {
        toast.error("Correo o contraseña incorrectos");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      toast.error("No fue posible iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-4 py-8 dark:bg-[#090909] sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[34px] border border-black/5 bg-white shadow-[0_35px_120px_-60px_rgba(0,0,0,.45)] dark:border-white/10 dark:bg-zinc-950 lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.14),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(211,181,133,.18),transparent_30%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-white text-zinc-950">
                <Globe2 className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Visual360</p>
                <p className="text-xs text-white/45">Immersive architecture studio</p>
              </div>
            </div>
          </div>

          <div className="relative max-w-xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Workspace profesional
            </p>
            <h1 className="text-5xl font-semibold leading-[1.03] tracking-[-0.04em]">
              Presenta espacios como si el cliente ya estuviera dentro.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/55">
              Crea recorridos 360, conecta planos y panoramas, aplica tu branding
              y comparte una experiencia inmersiva desde cualquier dispositivo.
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-white/40">
            <LockKeyhole className="size-3.5" />
            Proyectos privados por usuario
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="mb-6 grid size-10 place-items-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                <Globe2 className="size-5" />
              </div>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Bienvenido
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">
              Inicia sesión
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Accede a tus tours, panoramas y presentaciones.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@empresa.com"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-12 rounded-2xl"
                />
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
                    Entrar
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Aún no tienes cuenta?{" "}
              <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
