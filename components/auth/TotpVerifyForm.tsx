"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { totpCodeSchema, TotpCodeFormValues } from "@/lib/auth/schemas";
import { apiPost } from "@/lib/api-client";
import { LoginResponse, SesionDuplicadaBody } from "@/lib/types";
import SessionDuplicateDialog from "./SessionDuplicateDialog";

/**
 * Etapa 2: escribe el codigo TOTP (o scratch). El preAuthToken ya esta en
 * cookie httpOnly; el proxy server-side lo inyecta en el body. Al success
 * setea la cookie del token real y redirect a /dashboard.
 */
export default function TotpVerifyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [duplicada, setDuplicada] = useState<SesionDuplicadaBody | null>(null);
  const [codeForRetry, setCodeForRetry] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpCodeFormValues>({ resolver: zodResolver(totpCodeSchema) });

  async function doVerify(codigo: string, forceLogin = false) {
    setServerError(null);
    const extra = forceLogin ? { "X-Force-Login": "true" } : undefined;
    // preAuthToken lo inyecta el proxy desde la cookie; enviamos solo codigo.
    const res = await apiPost<LoginResponse>(
      "/api/v1/auth/2fa/verificar",
      { preAuthToken: "", codigo },
      extra
    );
    if (!res.ok) {
      if (res.status === 409 && res.error) {
        setCodeForRetry(codigo);
        setDuplicada(res.error as unknown as SesionDuplicadaBody);
        return;
      }
      setServerError(res.error?.mensaje ?? "Codigo invalido");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleConfirmForce() {
    if (!codeForRetry) return;
    setDuplicada(null);
    await doVerify(codeForRetry, true);
  }

  return (
    <>
      <form onSubmit={handleSubmit(({ codigo }) => doVerify(codigo, false))} noValidate>
        <Stack spacing={2}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <TextField
            label="Codigo"
            placeholder="123456 o codigo de respaldo"
            autoComplete="one-time-code"
            autoFocus
            inputProps={{ inputMode: "text", maxLength: 10 }}
            {...register("codigo")}
            error={Boolean(errors.codigo)}
            helperText={errors.codigo?.message ?? "6 digitos o 10 caracteres (scratch)"}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Verificando..." : "Confirmar"}
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
