"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { totpActivarSchema, TotpActivarFormValues } from "@/lib/auth/schemas";
import { apiPost } from "@/lib/api-client";
import { GenericResponse } from "@/lib/types";

interface Props {
  onActivated: () => void;
}

export default function TotpActivateForm({ onActivated }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TotpActivarFormValues>({ resolver: zodResolver(totpActivarSchema) });

  async function onSubmit(values: TotpActivarFormValues) {
    setServerError(null);
    const res = await apiPost<GenericResponse>("/api/v1/auth/2fa/activar", {
      codigo: values.codigo,
    });
    if (!res.ok) {
      setServerError(res.error?.mensaje ?? "No se pudo activar el 2FA");
      return;
    }
    onActivated();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <TextField
          label="Codigo de 6 digitos"
          placeholder="123456"
          autoFocus
          autoComplete="one-time-code"
          inputProps={{ inputMode: "numeric", maxLength: 6 }}
          {...register("codigo")}
          error={Boolean(errors.codigo)}
          helperText={errors.codigo?.message}
        />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? "Activando..." : "Activar 2FA"}
        </Button>
      </Stack>
    </form>
  );
}
