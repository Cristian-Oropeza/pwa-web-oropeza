"use client";

/**
 * Historial de compras APLICADAS del usuario autenticado. El backend ya ignora
 * cualquier clienteId que mandemos: lo toma del JWT. Aqui solo paginamos y
 * mostramos. Si mas adelante queremos filtros de fecha, van en este mismo
 * componente usando desde/hasta del request.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import RefreshIcon from "@mui/icons-material/Refresh";
import { apiPost } from "@/lib/api-client";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { MiCompraResponse, MisComprasRequest, PageResponse } from "@/lib/types";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;

export default function HistorialLista() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<PageResponse<MiCompraResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Evita que una peticion vieja sobrescriba una nueva.
  const reqIdRef = useRef(0);

  const fetchHistorial = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    setErrorMsg(null);
    const body: MisComprasRequest = {
      paginacion: { page, size, sort: "fechaConfirmacion,desc" },
    };
    const res = await apiPost<PageResponse<MiCompraResponse>>(
      "/api/v1/transacciones/mis-compras",
      body
    );
    if (reqId !== reqIdRef.current) return;
    if (res.ok && res.data) {
      setData(res.data);
    } else {
      setData(null);
      setErrorMsg(res.error?.mensaje ?? "No se pudo cargar el historial.");
    }
    setLoading(false);
  }, [page, size]);

  useEffect(() => {
    void fetchHistorial();
  }, [fetchHistorial]);

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const currentPageUi = (data?.number ?? page) + 1;
  const items = data?.content ?? [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Historial de compras
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Solo se muestran las compras aplicadas con numero de autorizacion.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
        >
          <TextField
            label="Por pagina"
            select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void fetchHistorial()}
            disabled={loading}
          >
            Recargar
          </Button>
        </Stack>
      </Paper>

      {loading && <LinearProgress aria-label="Cargando historial" />}

      {errorMsg && (
        <Alert severity="error" role="alert">
          {errorMsg}
        </Alert>
      )}

      {!loading && !errorMsg && items.length === 0 && (
        <Alert severity="info">Aun no tienes compras aplicadas.</Alert>
      )}

      {items.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            Mostrando {items.length} de {total} compras.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Tabla de historial de compras">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Telefono / Ref.</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Autorizacion</TableCell>
                  <TableCell>Referencia operacion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>{formatDateTime(c.fechaConfirmacion)}</TableCell>
                    <TableCell>
                      <Chip label={c.idServicio} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{c.idProducto}</TableCell>
                    <TableCell>{c.telefono ?? "-"}</TableCell>
                    <TableCell align="right">
                      {formatMoney(c.monto, c.moneda)}
                    </TableCell>
                    <TableCell>{c.numAutorizacion ?? "-"}</TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {c.referenciaOperacion}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ pt: 1 }}>
              <Pagination
                page={currentPageUi}
                count={totalPages}
                color="primary"
                shape="rounded"
                onChange={(_, uiPage) => {
                  setPage(uiPage - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={loading}
                aria-label="Paginacion del historial"
              />
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
