"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CatalogoProducto } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface Props {
  producto: CatalogoProducto;
}

/**
 * Card compacta para el grid del catalogo. El precio se muestra solo si
 * el producto es de precio fijo (tipoFront=1); los de referencia (tipo=2)
 * muestran el rango permitido en lugar de un precio unico.
 */
export default function ProductoCard({ producto }: Props) {
  const esPrecioFijo = producto.tipoFront === 1;
  const hrefDetalle = `/dashboard/catalogo/${producto.id}`;

  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Chip
            label={producto.idServicio}
            size="small"
            color="primary"
            variant="outlined"
          />
          {!producto.activo && (
            <Chip label="Inactivo" size="small" color="warning" />
          )}
          {esPrecioFijo ? (
            <Chip label="Precio fijo" size="small" />
          ) : (
            <Chip label="Monto abierto" size="small" />
          )}
        </Stack>

        <Typography variant="h6" component="h2" fontWeight={600} sx={{ mb: 0.5 }}>
          {producto.descripcion}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {producto.idProducto}
        </Typography>

        <Box sx={{ mt: 2 }}>
          {esPrecioFijo ? (
            <Typography variant="h5" component="p" color="primary" fontWeight={700}>
              {formatMoney(producto.precio, producto.moneda)}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              De {formatMoney(producto.montoMin, producto.moneda)} a{" "}
              {formatMoney(producto.montoMax, producto.moneda)}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions>
        <Button
          component={Link}
          href={hrefDetalle}
          size="small"
          variant="text"
          aria-label={`Ver detalle de ${producto.descripcion}`}
        >
          Ver detalle
        </Button>
      </CardActions>
    </Card>
  );
}
