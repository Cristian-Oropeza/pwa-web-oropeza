import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SecurityIcon from "@mui/icons-material/Security";

export default function PerfilPage() {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1" fontWeight={700}>
        Mi perfil
      </Typography>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <SecurityIcon color="primary" fontSize="large" />
            <div>
              <Typography variant="h6" fontWeight={600}>
                Autenticacion en dos pasos (2FA)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Protege tu cuenta exigiendo un codigo de 6 digitos al iniciar sesion.
              </Typography>
            </div>
          </Stack>
        </CardContent>
        <CardActions>
          <Button
            component={Link}
            href="/perfil/2fa"
            variant="contained"
            size="medium"
          >
            Administrar 2FA
          </Button>
        </CardActions>
      </Card>
    </Stack>
  );
}
