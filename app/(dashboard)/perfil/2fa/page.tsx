import TotpSetupFlow from "@/components/perfil/TotpSetupFlow";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import NextLink from "next/link";

export default function TotpAdminPage() {
  return (
    <Stack spacing={3}>
      <Breadcrumbs>
        <Link component={NextLink} href="/dashboard" underline="hover">
          Dashboard
        </Link>
        <Link component={NextLink} href="/perfil" underline="hover">
          Perfil
        </Link>
        <Typography color="text.primary">2FA</Typography>
      </Breadcrumbs>

      <Typography variant="h4" component="h1" fontWeight={700}>
        Autenticacion en dos pasos
      </Typography>

      <TotpSetupFlow />
    </Stack>
  );
}
