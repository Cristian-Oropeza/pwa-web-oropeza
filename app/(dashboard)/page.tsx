import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function DashboardHomePage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1" fontWeight={700}>
        Bienvenido
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Has iniciado sesion correctamente. Las secciones de catalogo,
            compras e historial se habilitan en las siguientes fases.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
