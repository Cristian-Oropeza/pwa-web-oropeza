import Link from "next/link";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HistoryIcon from "@mui/icons-material/History";
import DevicesIcon from "@mui/icons-material/Devices";

export default function DashboardHomePage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1" fontWeight={700}>
        Bienvenido
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Elige a donde quieres ir. Las secciones nuevas se habilitan conforme
        avanza la implementacion.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <StorefrontIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Catalogo
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Consulta los servicios disponibles y abre el detalle del que te interese.
              </Typography>
            </CardContent>
            <CardActions>
              <Button component={Link} href="/dashboard/catalogo" variant="contained">
                Ver catalogo
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", opacity: 0.6 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <HistoryIcon />
                <Typography variant="h6" fontWeight={600}>
                  Historial
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Tus compras aplicadas aparecen aqui. Se habilita en la siguiente fase.
              </Typography>
            </CardContent>
            <CardActions>
              <Button disabled>Proximamente</Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column", opacity: 0.6 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <DevicesIcon />
                <Typography variant="h6" fontWeight={600}>
                  Sesiones activas
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Administra desde donde esta abierta tu cuenta. Se habilita en la siguiente fase.
              </Typography>
            </CardContent>
            <CardActions>
              <Button disabled>Proximamente</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
