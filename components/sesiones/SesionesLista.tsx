"use client";

/**
 * Administracion de sesiones activas del usuario. El backend garantiza por
 * el filtro que solo puedes cerrar tus propias sesiones (clienteId sale del JWT).
 *
 * Reglas UX:
 *  - La sesion actual se marca con un chip y esta primero.
 *  - Cerrar la sesion ACTUAL cierra sesion y redirige a login.
 *  - Cerrar cualquier OTRA sesion la quita de la lista con confirmacion previa.
 *  - Mientras hay una operacion en vuelo todos los botones quedan deshabilitados
 *    (anti doble-click).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";
import { apiPost } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { useAuthStore } from "@/lib/store/auth-store";
import type { SesionActivaDto } from "@/lib/types";

export default function SesionesLista() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clear);

  const [sesiones, setSesiones] = useState<SesionActivaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cerrando, setCerrando] = useState<number | null>(null);
  const [dialogTarget, setDialogTarget] = useState<SesionActivaDto | null>(null);

  const fetchSesiones = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await apiPost<SesionActivaDto[]>("/api/v1/auth/sesiones/activas");
    if (res.ok && Array.isArray(res.data)) {
      const sorted = [...res.data].sort((a, b) => {
        if (a.esSesionActual !== b.esSesionActual) return a.esSesionActual ? -1 : 1;
        return (b.ultimaActividad ?? "").localeCompare(a.ultimaActividad ?? "");
      });
      setSesiones(sorted);
    } else {
      setSesiones([]);
      setErrorMsg(res.error?.mensaje ?? "No se pudieron cargar las sesiones.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchSesiones();
  }, [fetchSesiones]);

  async function confirmarCierre() {
    if (!dialogTarget) return;
    const target = dialogTarget;
    setDialogTarget(null);
    setCerrando(target.sesionId);

    if (target.esSesionActual) {
      const res = await apiPost("/api/v1/auth/logout");
      setCerrando(null);
      if (!res.ok) {
        setErrorMsg(res.error?.mensaje ?? "No se pudo cerrar tu sesion.");
        return;
      }
      clearAuth();
      router.push("/login");
      router.refresh();
      return;
    }

    const res = await apiPost("/api/v1/auth/sesiones/cerrar", { sesionId: target.sesionId });
    setCerrando(null);
    if (!res.ok) {
      setErrorMsg(res.error?.mensaje ?? "No se pudo cerrar la sesion.");
      return;
    }
    setSesiones((prev) => prev.filter((s) => s.sesionId !== target.sesionId));
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Sesiones activas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Administra desde donde esta abierta tu cuenta. Si ves una sesion que no
          reconoces, cierrala y cambia tu password.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void fetchSesiones()}
            disabled={loading}
          >
            Recargar
          </Button>
        </Stack>
      </Paper>

      {loading && <LinearProgress aria-label="Cargando sesiones" />}

      {errorMsg && (
        <Alert severity="error" role="alert">
          {errorMsg}
        </Alert>
      )}

      {!loading && !errorMsg && sesiones.length === 0 && (
        <Alert severity="info">No hay sesiones activas.</Alert>
      )}

      {sesiones.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Tabla de sesiones activas">
            <TableHead>
              <TableRow>
                <TableCell>Dispositivo</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Abierta</TableCell>
                <TableCell>Ultima actividad</TableCell>
                <TableCell align="right">Accion</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sesiones.map((s) => (
                <TableRow key={s.sesionId} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{s.dispositivo ?? "Desconocido"}</Typography>
                      {s.esSesionActual && (
                        <Chip label="Esta sesion" color="primary" size="small" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{s.ipAddress ?? "-"}</TableCell>
                  <TableCell>{formatDateTime(s.fechaCreacion)}</TableCell>
                  <TableCell>{formatDateTime(s.ultimaActividad)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={s.esSesionActual ? "Cerrar esta sesion (logout)" : "Cerrar sesion"}>
                      <span>
                        <IconButton
                          color={s.esSesionActual ? "warning" : "default"}
                          onClick={() => setDialogTarget(s)}
                          disabled={cerrando !== null}
                          aria-label={`Cerrar sesion ${s.sesionId}`}
                        >
                          {cerrando === s.sesionId ? (
                            <CircularProgress size={18} />
                          ) : (
                            <LogoutIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogTarget !== null} onClose={() => setDialogTarget(null)}>
        <DialogTitle>
          {dialogTarget?.esSesionActual ? "Cerrar esta sesion" : "Cerrar sesion remota"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogTarget?.esSesionActual
              ? "Vas a cerrar la sesion de este navegador y seras llevado al login. Confirmas?"
              : `Vas a cerrar la sesion ${dialogTarget?.dispositivo ?? "desconocida"} con IP ${
                  dialogTarget?.ipAddress ?? "desconocida"
                }. Esta accion no se puede deshacer.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={dialogTarget?.esSesionActual ? "warning" : "primary"}
            onClick={() => void confirmarCierre()}
          >
            Cerrar sesion
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
