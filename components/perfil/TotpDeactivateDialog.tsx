"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { totpDesactivarSchema, TotpDesactivarFormValues } from "@/lib/auth/schemas";
import { apiPost } from "@/lib/api-client";
import { GenericResponse } from "@/lib/types";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * Para desactivar 2FA exigimos la contrasenia como re-auth defensivo: evita que
 * alguien que robo un token temporalmente pueda bajar la proteccion sin saber
 * el password del dueno.
 */
export default function TotpDeactivateDialog({ open, onCancel, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TotpDesactivarFormValues>({ resolver: zodResolver(totpDesactivarSchema) });

  async function onSubmit(values: TotpDesactivarFormValues) {
    setServerError(null);
    const res = await apiPost<GenericResponse>("/api/v1/auth/2fa/desactivar", values);
    if (!res.ok) {
      setServerError(res.error?.mensaje ?? "No se pudo desactivar");
      return;
    }
    reset();
    onSuccess();
  }

  function handleClose() {
    setServerError(null);
    reset();
    onCancel();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Desactivar 2FA</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2}>
            <DialogContentText>
              Esto quitara el segundo factor de tu cuenta. Al iniciar sesion
              solo se te pedira la contrasenia. Confirma con tu contrasenia
              actual para continuar.
            </DialogContentText>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <TextField
              label="Contrasenia actual"
              type="password"
              autoComplete="current-password"
              autoFocus
              {...register("password")}
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="error" disabled={isSubmitting}>
            {isSubmitting ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
