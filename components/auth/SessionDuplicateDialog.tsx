"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { SesionActivaDto } from "@/lib/types";

interface Props {
  open: boolean;
  detalles: SesionActivaDto[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal que aparece cuando el backend responde 409 SESION_DUPLICADA.
 * Ofrece "Cerrar sesion anterior y continuar" (reintenta con X-Force-Login: true).
 */
export default function SessionDuplicateDialog({ open, detalles, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Ya tienes una sesion activa</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Detectamos sesiones activas en otros dispositivos. ¿Quieres cerrarlas
          y continuar aqui? La otra sesion se cerrara inmediatamente.
        </DialogContentText>
        <List dense>
          {detalles.map((s) => (
            <ListItem key={s.sesionId}>
              <ListItemText
                primary={s.dispositivo ?? "Dispositivo desconocido"}
                secondary={`Ultima actividad: ${new Date(s.ultimaActividad).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Cerrar otra y continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
