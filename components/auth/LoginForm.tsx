"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { loginSchema, LoginFormValues } from "@/lib/auth/schemas";
import { apiPost } from "@/lib/api-client";
import { LoginResponse, SesionDuplicadaBody } from "@/lib/types";
import { useAuthStore } from "@/lib/store/auth-store";
import SessionDuplicateDialog from "./SessionDuplicateDialog";

/**
 * Login etapa 1: correo + password. Dependiendo de si el usuario tiene 2FA:
 *  - sin 2FA: setea cookie via proxy, redirect a /dashboard
 *  - con 2FA: setea cookie preAuthToken via proxy, redirect a /2fa/verificar
 * Maneja 409 (sesion duplicada) con dialog para reintentar con X-Force-Login.
 */
export default function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setRequiere2FA = useAuthStore((s) => s.setRequiere2FA);
  const [serverError, setServerError] = useState<string | null>(null);
  const [duplicada, setDuplicada] = useState<SesionDuplicadaBody | null>(null);
  const [credentialsForRetry, setCredentialsForRetry] = useState<LoginFormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function doLogin(values: LoginFormValues, forceLogin = false) {
    setServerError(null);
    const extra = forceLogin ? { "X-Force-Login": "true" } : undefined;
    const res = await apiPost<LoginResponse>("/api/v1/auth/login", values, extra);

    if (!res.ok) {
      // 409 = sesion duplicada
      if (res.status === 409 && res.error) {
        setCredentialsForRetry(values);
        setDuplicada(res.error as unknown as SesionDuplicadaBody);
        return;
      }
      // 401, 423, 429 u otros
      setServerError(res.error?.mensaje ?? "Error al iniciar sesion");
      return;
    }

    const body = res.data!;
    setUser({ correo: body.correo, clienteId: body.clienteId });
    if (body.requiere2FA) {
      setRequiere2FA(true);
      router.push("/2fa/verificar");
    } else {
      setRequiere2FA(false);
      router.push("/dashboard");
    }
    router.refresh();
  }

  async function handleConfirmForce() {
    if (!credentialsForRetry) return;
    setDuplicada(null);
    await doLogin(credentialsForRetry, true);
  }

  return (
    <>
      <form onSubmit={handleSubmit((v) => doLogin(v, false))} noValidate>
        <Stack spacing={2}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <TextField
            label="Correo"
            type="email"
            autoComplete="email"
            autoFocus
            {...register("correo")}
            error={Boolean(errors.correo)}
            helperText={errors.correo?.message}
          />
          <TextField
            label="Contrasenia"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Verificando..." : "Entrar"}
          </Button>
        </Stack>
      </form>

      <SessionDuplicateDialog
        open={Boolean(duplicada)}
        detalles={duplicada?.detalles ?? []}
        onCancel={() => setDuplicada(null)}
        onConfirm={handleConfirmForce}
      />
    </>
  );
}
