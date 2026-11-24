"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { apiPost } from "@/lib/api-client";
import { Totp2FASetupResponse } from "@/lib/types";
import ScratchCodesPanel from "./ScratchCodesPanel";
import TotpActivateForm from "./TotpActivateForm";
import TotpDeactivateDialog from "./TotpDeactivateDialog";

/**
 * Orquesta los 3 estados posibles del 2FA desde la UI:
 *  - IDLE: no se ha iniciado setup (muestra boton "Configurar" + "Ya tengo 2FA")
 *  - SETUP: setup iniciado, muestra QR + scratch codes + input de confirmacion
 *  - ACTIVO: confirmado, muestra estado + boton de desactivar
 *
 * El backend no expone un endpoint de "status", asi que la UI empieza en IDLE
 * y se adapta segun la respuesta (409 TOTP_YA_ACTIVADO = ya esta activo).
 */
type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "setup"; data: Totp2FASetupResponse }
  | { kind: "activo"; mensaje?: string }
  | { kind: "error"; mensaje: string };

export default function TotpSetupFlow() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  async function handleStartSetup() {
    setState({ kind: "loading" });
    const res = await apiPost<Totp2FASetupResponse>("/api/v1/auth/2fa/setup");
    if (!res.ok) {
      // Si el backend dice TOTP_YA_ACTIVADO, el usuario ya tiene 2FA; ajustamos UI.
      if (res.status === 409) {
        setState({ kind: "activo", mensaje: "El 2FA ya estaba activado en tu cuenta." });
        return;
      }
      setState({
        kind: "error",
        mensaje: res.error?.mensaje ?? "No se pudo iniciar el setup de 2FA",
      });
      return;
    }
    setState({ kind: "setup", data: res.data! });
  }

  function handleActivated() {
    setState({ kind: "activo", mensaje: "2FA activado correctamente. La proxima vez que inicies sesion te pedira el codigo." });
  }

  function handleDeactivated() {
    setDeactivateOpen(false);
    setState({ kind: "idle" });
  }

  if (state.kind === "loading") {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={24} />
            <Typography>Generando QR y codigos de respaldo...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (state.kind === "idle" || state.kind === "error") {
    return (
      <Card>
        <CardContent>
          <Stack spacing={3}>
            {state.kind === "error" && <Alert severity="error">{state.mensaje}</Alert>}

            <Stack direction="row" spacing={2} alignItems="center">
              <LockOpenIcon color="warning" />
              <Typography variant="h6">2FA desactivado</Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Activa el 2FA para que al iniciar sesion ademas de tu contrasenia
              se te pida un codigo de 6 digitos que cambia cada 30 segundos.
              Necesitaras una app autenticadora en tu celular como Google
              Authenticator, Microsoft Authenticator o Authy.
            </Typography>

            <div>
              <Button variant="contained" size="large" onClick={handleStartSetup}>
                Configurar 2FA
              </Button>
            </div>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (state.kind === "setup") {
    return (
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={600}>
                Paso 1 — Escanea este codigo QR
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Abre tu app autenticadora y escanea el codigo. Se agregara una
                entrada con el nombre <b>{state.data.issuer}</b>.
              </Typography>
              <div style={{ textAlign: "center" }}>
                <img
                  src={state.data.qrImageDataUri}
                  alt="QR de configuracion 2FA"
                  style={{
                    width: 280,
                    height: 280,
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: 12,
                    background: "#fff",
                  }}
                />
              </div>
            </Stack>
          </CardContent>
        </Card>

        <ScratchCodesPanel codes={state.data.scratchCodes} correo={state.data.label} />

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Paso 2 — Confirma con un codigo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresa el codigo de 6 digitos que te muestra la app para
                terminar la activacion. El 2FA no quedara activo hasta que
                confirmes aqui.
              </Typography>
              <TotpActivateForm onActivated={handleActivated} />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  // state.kind === "activo"
  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Alert severity="success">{state.mensaje}</Alert>
            <Stack direction="row" spacing={2} alignItems="center">
              <LockIcon color="success" />
              <Typography variant="h6">2FA activado</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Tu cuenta esta protegida. En cada login tendras que ingresar el
              codigo de 6 digitos que genera tu app autenticadora.
            </Typography>
            <div>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeactivateOpen(true)}
              >
                Desactivar 2FA
              </Button>
            </div>
          </Stack>
        </CardContent>
      </Card>

      <TotpDeactivateDialog
        open={deactivateOpen}
        onCancel={() => setDeactivateOpen(false)}
        onSuccess={handleDeactivated}
      />
    </>
  );
}
