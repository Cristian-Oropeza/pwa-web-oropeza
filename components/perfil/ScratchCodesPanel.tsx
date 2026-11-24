"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import DownloadIcon from "@mui/icons-material/Download";
import { downloadText } from "@/lib/download";

interface Props {
  codes: string[];
  correo: string;
}

/**
 * Panel de codigos de respaldo. Se muestran UNA sola vez durante el setup;
 * el backend solo persiste sus hashes BCrypt. Botones para copiar o descargar
 * como .txt para guardar offline.
 */
export default function ScratchCodesPanel({ codes, correo }: Props) {
  function handleDownload() {
    const header = [
      "# Codigos de respaldo 2FA - GestoPago Comercio PWA Oropeza",
      `# Cuenta: ${correo}`,
      `# Generados: ${new Date().toISOString()}`,
      "",
      "# Cada codigo sirve UNA SOLA VEZ. Guardalos en un lugar seguro.",
      "# Los puedes usar en lugar del codigo TOTP si pierdes acceso a tu app autenticadora.",
      "",
    ].join("\n");
    const content = header + codes.join("\n") + "\n";
    downloadText(`scratch-codes-${correo}.txt`, content);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(codes.join("\n"));
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={600}>
            Codigos de respaldo
          </Typography>
          <Alert severity="warning">
            Estos codigos solo se muestran UNA VEZ. Guardalos ahora en un lugar
            seguro: te sirven si pierdes el acceso a tu app autenticadora. Cada
            uno se puede usar una sola vez.
          </Alert>

          <Grid container spacing={1}>
            {codes.map((c) => (
              <Grid key={c} size={{ xs: 6, sm: 4 }}>
                <Typography
                  variant="body1"
                  fontFamily="monospace"
                  sx={{
                    p: 1,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                    textAlign: "center",
                    letterSpacing: 1,
                  }}
                >
                  {c}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Descargar como .txt
            </Button>
            <Button variant="outlined" onClick={handleCopy}>
              Copiar al portapapeles
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
