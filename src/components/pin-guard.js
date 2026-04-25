import { useState, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/router';
import { PRODUCTS_URL } from 'src/utils/get-initials';


export const PinGuard = ({ children }) => {
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleVerify = async () => {
    if (!pin) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${PRODUCTS_URL}admin/pin/verificar`, { pin });
      setVerified(true);
    } catch {
      setError('PIN incorrecto. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (verified) return children;

  return (
    <Dialog open maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>Acceso restringido</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ingresa el PIN de administrador para continuar.
        </Typography>
        <TextField
          fullWidth
          label="PIN"
          type="password"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          error={!!error}
          helperText={error}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => router.push('/')}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={loading || !pin}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Verificar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
