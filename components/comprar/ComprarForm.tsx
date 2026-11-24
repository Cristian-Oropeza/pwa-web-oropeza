"use client";

/**
 * Flujo de compra end-to-end: valida datos del producto, muestra las cuentas
 * activas del usuario, dispara /api/v1/transacciones y maneja los 3 desenlaces
 * posibles del backend:
 *
 *   - 200 OK  -> APLICADA: exito, numAutorizacion > 0.
 *   - 202     -> EN_CONFIRMACION / PENDIENTE: polling a /transacciones/consulta
 *                hasta APLICADA, RECHAZADA, NO_ENVIADA, o timeout del cliente.
 *   - 409     -> idempotencia duplicada: devolvemos como exito la tx previa.
 *   - 422/4xx -> error de negocio (saldo, limites, reglas producto, etc).
 *
 * Reglas de seguridad / anti-abuso implementadas aqui:
 *
 *   1) idempotencyKey (UUID v4) se genera UNA sola vez al montar; se reusa en
 *      cada reintento de la MISMA intencion. El backend la usa para no cobrar
 *      dos veces aunque el cliente dispare N peticiones.
 *   2) El boton Confirmar queda deshabilitado durante submit o polling; el
 *      form entero se bloquea mientras la operacion vive. Doble-click imposible.
 *   3) Al llegar a un estado final (exito o error irrecuperable), regeneramos
 *      la idempotencyKey: una nueva compra es una nueva intencion.
 *   4) El polling usa AbortController para cancelarse si el user navega fuera.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import { apiPost } from "@/lib/api-client";
import { readUserInfoCookie } from "@/lib/cookies-client";
import { formatMoney } from "@/lib/format";
import { useCatalogoStore } from "@/lib/store/catalogo-store";
import { uuidv4 } from "@/lib/uuid";
import type {
  CatalogoConsultarRequest,
  CatalogoProducto,
  CuentaConsultaRequest,
  CuentaResponse,
  PageResponse,
  TransaccionConsultaRequest,
  TransaccionEjecutarRequest,
  TransaccionResponse,
} from "@/lib/types";

interface Props {
  productoId: number;
}

type FaseUI =
  | { tipo: "cargando" }
  | { tipo: "listo" }
  | { tipo: "enviando" }
  | { tipo: "confirmando"; referenciaOperacion: string; intentos: number }
  | { tipo: "exito"; transaccion: TransaccionResponse }
  | { tipo: "sinConfirmar"; referenciaOperacion: string }
  | { tipo: "error"; mensaje: string; detalles?: string[] };

const POLL_INTERVAL_MS = 2_500;
const POLL_MAX_INTENTOS = 12; // ~30s totales

export default function ComprarForm({ productoId }: Props) {
  const router = useRouter();

  // ----- identidad del usuario (clienteId necesario para request y filtrar cuentas)
  const [clienteId, setClienteId] = useState<number | null>(null);

  // ----- datos cargados
  const cachedProducto = useCatalogoStore((s) => s.getById(productoId));
  const upsertCatalogo = useCatalogoStore((s) => s.upsertMany);
  const [producto, setProducto] = useState<CatalogoProducto | null>(cachedProducto ?? null);
  const [cuentas, setCuentas] = useState<CuentaResponse[]>([]);

  // ----- inputs del form
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>("");
  const [montoInput, setMontoInput] = useState<string>("");
  const [telefono, setTelefono] = useState<string>("");
  const [referencia, setReferencia] = useState<string>("");

  // ----- fase de UI (loader, form, enviando, polling, resultado)
  const [fase, setFase] = useState<FaseUI>({ tipo: "cargando" });
  const [loadError, setLoadError] = useState<string | null>(null);

  // ----- idempotencia: UUID por intencion de compra. Se regenera tras un desenlace final.
  const idempotencyKeyRef = useRef<string>(uuidv4());

  // ----- polling cancellable
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortedRef = useRef<boolean>(false);

  // ================= Carga inicial: cliente + producto + cuentas =================
  useEffect(() => {
    const info = readUserInfoCookie();
    if (!info) {
      setLoadError("Tu sesion caduca. Vuelve a iniciar sesion.");
      setFase({ tipo: "error", mensaje: "Tu sesion caduca." });
      return;
    }
    setClienteId(info.clienteId);

    (async () => {
      // Producto
      let prod = cachedProducto ?? null;
      if (!prod) {
        const body: CatalogoConsultarRequest = {
          incluirInactivos: true,
          paginacion: { page: 0, size: 100, sort: "id,asc" },
        };
        const res = await apiPost<PageResponse<CatalogoProducto>>(
          "/api/v1/catalogo/consultar",
          body
        );
        if (res.ok && res.data) {
          upsertCatalogo(res.data.content);
          prod = res.data.content.find((p) => p.id === productoId) ?? null;
        }
      }
      if (!prod) {
        setFase({ tipo: "error", mensaje: "No encontramos el producto a comprar." });
        return;
      }
      if (!prod.activo) {
        setFase({ tipo: "error", mensaje: "Este producto no esta disponible." });
        setProducto(prod);
        return;
      }
      setProducto(prod);

      // Monto por defecto: si precio fijo, el precio del producto; si no, el minimo.
      if (prod.tipoFront === 1 && prod.precio != null) {
        setMontoInput(String(prod.precio));
      } else if (prod.montoMin != null) {
        setMontoInput(String(prod.montoMin));
      }

      // Cuentas activas del usuario
      const bodyC: CuentaConsultaRequest = {
        clienteId: info.clienteId,
        estatus: "ACTIVA",
        paginacion: { page: 0, size: 20, sort: "id,asc" },
      };
      const resC = await apiPost<PageResponse<CuentaResponse>>(
        "/api/v1/cuentas/consultar",
        bodyC
      );
      if (!resC.ok || !resC.data) {
        setFase({
          tipo: "error",
          mensaje: resC.error?.mensaje ?? "No se pudieron cargar tus cuentas.",
        });
        return;
      }
      const activas = resC.data.content.filter((c) => c.estatus === "ACTIVA");
      setCuentas(activas);
      if (activas.length === 1 && activas[0]) {
        setCuentaSeleccionada(activas[0].numeroCuenta);
      }
      setFase({ tipo: "listo" });
    })();
  }, [cachedProducto, productoId, upsertCatalogo]);

  // ================= Cleanup del polling =================
  useEffect(() => {
    return () => {
      abortedRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ================= Validacion cliente-side =================
  const esPrecioFijo = producto?.tipoFront === 1;
  const esMontoAbierto = producto?.tipoFront === 2;

  const validacion = useMemo<string | null>(() => {
    if (!producto) return null;
    if (!cuentaSeleccionada) return "Selecciona una cuenta.";

    // Monto
    const montoNum = Number(montoInput);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return "Ingresa un monto valido mayor a cero.";
    }
    if (esMontoAbierto) {
      const min = producto.montoMin != null ? Number(producto.montoMin) : null;
      const max = producto.montoMax != null ? Number(producto.montoMax) : null;
      if (min != null && montoNum < min) {
        return `El monto minimo es ${formatMoney(min, producto.moneda)}.`;
      }
      if (max != null && montoNum > max) {
        return `El monto maximo es ${formatMoney(max, producto.moneda)}.`;
      }
    } else if (esPrecioFijo && producto.precio != null) {
      // En precio fijo el monto deberia coincidir con el del catalogo.
      if (Math.abs(montoNum - Number(producto.precio)) > 0.001) {
        return "El monto no coincide con el precio del producto.";
      }
    }

    // Reglas por tipoFront segun backend.
    if (esPrecioFijo) {
      // Recargas: telefono 10 digitos o canjeable con #.
      const ok = /^[0-9]{10}$/.test(telefono) || /^#[0-9]{10}$/.test(telefono);
      if (!ok) return "Ingresa un telefono valido de 10 digitos.";
    } else if (esMontoAbierto) {
      const ref = referencia.trim();
      if (ref.length === 0) return "Ingresa la referencia del servicio.";
      if (ref.length > 80) return "La referencia es demasiado larga (max 80).";
    }

    return null;
  }, [
    producto,
    cuentaSeleccionada,
    montoInput,
    telefono,
    referencia,
    esPrecioFijo,
    esMontoAbierto,
  ]);

  // ================= Submit =================
  const regenerarIdempotency = useCallback(() => {
    idempotencyKeyRef.current = uuidv4();
  }, []);

  const consultarReferencia = useCallback(
    async (referenciaOperacion: string): Promise<TransaccionResponse | null> => {
      const body: TransaccionConsultaRequest = { referenciaOperacion };
      const res = await apiPost<TransaccionResponse>("/api/v1/transacciones/consulta", body);
      if (res.ok && res.data) return res.data;
      return null;
    },
    []
  );

  const procesarRespuesta = useCallback(
    (tx: TransaccionResponse, status: number) => {
      if (tx.estado === "APLICADA") {
        setFase({ tipo: "exito", transaccion: tx });
        regenerarIdempotency();
        return;
      }
      if (tx.estado === "RECHAZADA") {
        setFase({
          tipo: "error",
          mensaje: "La operacion fue rechazada por el proveedor. Tu saldo fue devuelto.",
          detalles: tx.textoProveedor ? [tx.textoProveedor] : undefined,
        });
        regenerarIdempotency();
        return;
      }
      if (tx.estado === "NO_ENVIADA") {
        setFase({
          tipo: "error",
          mensaje:
            "La operacion no pudo enviarse al proveedor. Intenta de nuevo mas tarde. Tu saldo fue devuelto.",
        });
        regenerarIdempotency();
        return;
      }
      // PENDIENTE o EN_CONFIRMACION: entrar/continuar polling.
      iniciarPolling(tx.referenciaOperacion);
      // status 202 esperado; si fuera 200 con PENDIENTE tambien aplica.
      void status;
    },
    // iniciarPolling se define abajo; evitamos el warning con useCallback deshabilitando el dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regenerarIdempotency]
  );

  const iniciarPolling = useCallback(
    (referenciaOperacion: string) => {
      setFase({ tipo: "confirmando", referenciaOperacion, intentos: 0 });

      const tick = async (intentoActual: number) => {
        if (abortedRef.current) return;
        if (intentoActual > POLL_MAX_INTENTOS) {
          setFase({ tipo: "sinConfirmar", referenciaOperacion });
          regenerarIdempotency();
          return;
        }
        const tx = await consultarReferencia(referenciaOperacion);
        if (abortedRef.current) return;
        if (tx) {
          if (tx.estado === "APLICADA") {
            setFase({ tipo: "exito", transaccion: tx });
            regenerarIdempotency();
            return;
          }
          if (tx.estado === "RECHAZADA") {
            setFase({
              tipo: "error",
              mensaje: "La operacion fue rechazada por el proveedor. Tu saldo fue devuelto.",
              detalles: tx.textoProveedor ? [tx.textoProveedor] : undefined,
            });
            regenerarIdempotency();
            return;
          }
          if (tx.estado === "NO_ENVIADA") {
            setFase({
              tipo: "error",
              mensaje:
                "La operacion no pudo enviarse. Tu saldo fue devuelto. Intenta de nuevo mas tarde.",
            });
            regenerarIdempotency();
            return;
          }
        }
        // Sigue sin resolver: re-agendar.
        setFase({ tipo: "confirmando", referenciaOperacion, intentos: intentoActual });
        pollTimerRef.current = setTimeout(() => void tick(intentoActual + 1), POLL_INTERVAL_MS);
      };

      pollTimerRef.current = setTimeout(() => void tick(1), POLL_INTERVAL_MS);
    },
    [consultarReferencia, regenerarIdempotency]
  );

  async function handleConfirmar() {
    if (!producto || !clienteId) return;
    if (validacion) return;
    if (fase.tipo === "enviando" || fase.tipo === "confirmando") return;

    setFase({ tipo: "enviando" });
    const body: TransaccionEjecutarRequest = {
      clienteId,
      idempotencyKey: idempotencyKeyRef.current,
      numeroCuenta: cuentaSeleccionada,
      idServicio: producto.idServicio,
      idProducto: producto.idProducto,
      monto: Number(montoInput),
      ...(esPrecioFijo ? { telefono } : {}),
      ...(esMontoAbierto ? { referencia: referencia.trim() } : {}),
    };

    const res = await apiPost<TransaccionResponse>("/api/v1/transacciones", body);

    // 200, 202 o 409 (duplicada -> tx previa) pueden traer TransaccionResponse util.
    if (res.ok && res.data) {
      procesarRespuesta(res.data, res.status);
      return;
    }
    if (res.status === 409 && res.data) {
      // Por como responde el backend, el 409 de idempotencia incluye la tx previa.
      procesarRespuesta(res.data, res.status);
      return;
    }
    // Error real
    const mensaje = res.error?.mensaje ?? "No se pudo procesar la compra.";
    const detalles = Array.isArray(res.error?.detalles)
      ? (res.error.detalles as string[])
      : undefined;
    setFase({ tipo: "error", mensaje, detalles });
    // Error no-idempotente: nueva intencion.
    regenerarIdempotency();
  }

  function volverAFormulario() {
    setFase({ tipo: "listo" });
  }

  // ================= Render =================

  if (fase.tipo === "cargando") {
    return (
      <Stack spacing={2}>
        <LinearProgress aria-label="Cargando datos de compra" />
        <Typography variant="body2" color="text.secondary">
          Preparando tu compra...
        </Typography>
      </Stack>
    );
  }

  if (loadError && !producto) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{loadError}</Alert>
        <Box>
          <Button component={Link} href="/dashboard/catalogo">
            Volver al catalogo
          </Button>
        </Box>
      </Stack>
    );
  }

  if (!producto) {
    // Caso de error en carga que ya puso un mensaje en la fase.
    const msg =
      fase.tipo === "error" ? fase.mensaje : "No pudimos preparar esta compra.";
    return (
      <Stack spacing={2}>
        <Alert severity="error">{msg}</Alert>
        <Box>
          <Button component={Link} href="/dashboard/catalogo">
            Volver al catalogo
          </Button>
        </Box>
      </Stack>
    );
  }

  const operando = fase.tipo === "enviando" || fase.tipo === "confirmando";
  const cuentaInfo = cuentas.find((c) => c.numeroCuenta === cuentaSeleccionada);

  return (
    <Stack spacing={3}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>
          Dashboard
        </Link>
        <Link href="/dashboard/catalogo" style={{ color: "inherit", textDecoration: "none" }}>
          Catalogo
        </Link>
        <Link
          href={`/dashboard/catalogo/${producto.id}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {producto.descripcion}
        </Link>
        <Typography color="text.primary">Comprar</Typography>
      </Breadcrumbs>

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
            <Chip label={producto.idServicio} color="primary" variant="outlined" />
            <Chip label={esPrecioFijo ? "Precio fijo" : "Monto abierto"} />
          </Stack>
          <Typography variant="h5" component="h1" fontWeight={700}>
            {producto.descripcion}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {producto.idProducto}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {cuentas.length === 0 ? (
            <Alert severity="warning">
              No tienes cuentas activas para hacer la compra. Contacta soporte.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Cuenta a cargar"
                  value={cuentaSeleccionada}
                  onChange={(e) => setCuentaSeleccionada(e.target.value)}
                  disabled={operando || cuentas.length === 1}
                  helperText={
                    cuentaInfo
                      ? `Saldo disponible: ${formatMoney(cuentaInfo.saldo, producto.moneda)}`
                      : "Selecciona una de tus cuentas activas"
                  }
                >
                  {cuentas.map((c) => (
                    <MenuItem key={c.numeroCuenta} value={c.numeroCuenta}>
                      {c.numeroCuenta}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {esPrecioFijo ? (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Monto"
                    value={formatMoney(montoInput, producto.moneda)}
                    InputProps={{ readOnly: true }}
                    helperText="Monto fijo del producto"
                  />
                </Grid>
              ) : (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Monto a pagar"
                    value={montoInput}
                    onChange={(e) => setMontoInput(e.target.value)}
                    disabled={operando}
                    inputProps={{
                      min: producto.montoMin ?? undefined,
                      max: producto.montoMax ?? undefined,
                      step: "0.01",
                      "aria-label": "Monto a pagar",
                    }}
                    helperText={`Entre ${formatMoney(
                      producto.montoMin,
                      producto.moneda
                    )} y ${formatMoney(producto.montoMax, producto.moneda)}`}
                  />
                </Grid>
              )}

              {esPrecioFijo && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Telefono"
                    placeholder="5512345678"
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(e.target.value.replace(/[^0-9#]/g, "").slice(0, 11))
                    }
                    disabled={operando}
                    inputProps={{ inputMode: "tel", "aria-label": "Numero de telefono de 10 digitos" }}
                    helperText="10 digitos del numero a recargar"
                  />
                </Grid>
              )}

              {esMontoAbierto && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Referencia"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value.slice(0, 80))}
                    disabled={operando}
                    inputProps={{ "aria-label": "Numero de referencia del servicio" }}
                    helperText="Referencia que viene en tu recibo"
                  />
                </Grid>
              )}
            </Grid>
          )}

          {fase.tipo === "error" && (
            <Alert severity="error" sx={{ mt: 2 }} role="alert">
              {fase.mensaje}
              {fase.detalles && fase.detalles.length > 0 && (
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {fase.detalles.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </Box>
              )}
            </Alert>
          )}

          {validacion && fase.tipo === "listo" && (
            <Alert severity="info" sx={{ mt: 2 }} variant="outlined">
              {validacion}
            </Alert>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
            <Button
              component={Link}
              href={`/dashboard/catalogo/${producto.id}`}
              variant="text"
              disabled={operando}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => void handleConfirmar()}
              disabled={
                operando ||
                cuentas.length === 0 ||
                !!validacion ||
                fase.tipo === "exito" ||
                fase.tipo === "sinConfirmar"
              }
              startIcon={operando ? <CircularProgress size={18} color="inherit" /> : undefined}
              aria-busy={operando}
            >
              {fase.tipo === "enviando"
                ? "Enviando..."
                : fase.tipo === "confirmando"
                ? "Confirmando..."
                : "Confirmar compra"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Dialog de "en confirmacion" (polling) */}
      <Dialog open={fase.tipo === "confirmando"} aria-labelledby="dlg-confirmando">
        <DialogTitle id="dlg-confirmando">
          <Stack direction="row" spacing={1} alignItems="center">
            <HourglassBottomIcon color="primary" />
            Confirmando con el proveedor...
          </Stack>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tu operacion se envio y estamos esperando la confirmacion. No cierres esta ventana.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Dialog de exito */}
      <Dialog open={fase.tipo === "exito"} aria-labelledby="dlg-exito">
        <DialogTitle id="dlg-exito">
          <Stack direction="row" spacing={1} alignItems="center">
            <CheckCircleIcon color="success" />
            Compra aplicada
          </Stack>
        </DialogTitle>
        {fase.tipo === "exito" && (
          <>
            <DialogContent>
              <DialogContentText component="div">
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {producto.descripcion} por{" "}
                  <strong>{formatMoney(fase.transaccion.monto, fase.transaccion.moneda)}</strong>.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Numero de autorizacion:{" "}
                  <strong>{fase.transaccion.numAutorizacion ?? "-"}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Referencia: {fase.transaccion.referenciaOperacion}
                </Typography>
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => router.push("/dashboard/catalogo")}>Seguir comprando</Button>
              <Button
                variant="contained"
                onClick={() => router.push("/dashboard/historial")}
              >
                Ver en historial
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de "sin confirmar" (timeout de polling) */}
      <Dialog open={fase.tipo === "sinConfirmar"} aria-labelledby="dlg-sinconf">
        <DialogTitle id="dlg-sinconf">Operacion en conciliacion</DialogTitle>
        {fase.tipo === "sinConfirmar" && (
          <>
            <DialogContent>
              <DialogContentText>
                Tu operacion sigue en confirmacion con el proveedor. Revisa tu historial en unos
                minutos para ver el estado final. Referencia: <strong>{fase.referenciaOperacion}</strong>.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={volverAFormulario}>Cerrar</Button>
              <Button variant="contained" onClick={() => router.push("/dashboard/historial")}>
                Ir al historial
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}
