import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography
} from '@mui/material';
import {
  bluetoothDisponible,
  conectarBluetooth,
  estadoBluetooth,
  guardarConfigImpresion,
  imprimirTicket,
  leerConfigImpresion,
  olvidarBluetooth,
  reconectarBluetooth,
  suscribirBluetooth,
  ticketDePrueba
} from 'src/utils/printing';

export const PrinterSettingsDialog = ({ open, onClose }) => {
  const [config, setConfig] = useState(leerConfigImpresion);
  const [error, setError] = useState('');
  const [bt, setBt] = useState({ disponible: false, conectada: false, emparejada: false, nombre: '' });
  const [conectando, setConectando] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);

  useEffect(() => suscribirBluetooth(setBt), []);

  useEffect(() => {
    if (!open) return;
    setConfig(leerConfigImpresion());
    setError('');
    setBt(estadoBluetooth());
    // Intenta reconectar en silencio a la impresora ya emparejada.
    reconectarBluetooth()
      .catch(() => false)
      .finally(() => setBt(estadoBluetooth()));
  }, [open]);

  const cambiar = (campo) => (e) => {
    const valor = campo === 'auto' || campo === 'logoBluetooth' ? e.target.checked : e.target.value;
    setConfig((prev) => ({ ...prev, [campo]: valor }));
  };

  const conectar = async () => {
    setError('');
    setConectando(true);
    try {
      await conectarBluetooth();
    } catch (e) {
      const msg = e?.message || '';
      // Cerrar el selector de Chrome no es un error.
      if (!/cancel|user/i.test(msg)) setError(msg || 'No se pudo conectar');
    } finally {
      setConectando(false);
      setBt(estadoBluetooth());
    }
  };

  const olvidar = () => {
    olvidarBluetooth();
    setBt(estadoBluetooth());
  };

  const imprimirPrueba = async () => {
    setError('');
    setImprimiendo(true);
    try {
      await imprimirTicket(ticketDePrueba(), { config });
    } catch (e) {
      setError(e?.message || 'No se pudo imprimir');
    } finally {
      setImprimiendo(false);
    }
  };

  const guardar = () => {
    guardarConfigImpresion(config);
    onClose();
  };

  const esBluetooth = config.adaptador === 'bluetooth';
  const soportaBt = bluetoothDisponible();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Impresora de tickets</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Conexión</InputLabel>
            <Select value={config.adaptador} label="Conexión" onChange={cambiar('adaptador')}>
              <MenuItem value="navegador">USB (impresora instalada en esta PC)</MenuItem>
              <MenuItem value="bluetooth" disabled={!soportaBt}>
                {soportaBt ? 'Bluetooth' : 'Bluetooth (no disponible en este navegador)'}
              </MenuItem>
            </Select>
          </FormControl>

          {esBluetooth && (
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  size="small"
                  color={bt.conectada ? 'success' : 'default'}
                  label={
                    bt.conectada
                      ? `Conectada${bt.nombre ? `: ${bt.nombre}` : ''}`
                      : bt.emparejada
                        ? `Desconectada${bt.nombre ? `: ${bt.nombre}` : ''}`
                        : 'Sin impresora'
                  }
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={conectar} disabled={conectando}>
                  {conectando ? 'Conectando…' : bt.emparejada ? 'Cambiar impresora' : 'Conectar impresora'}
                </Button>
                {bt.emparejada && (
                  <Button size="small" color="inherit" onClick={olvidar}>
                    Olvidar
                  </Button>
                )}
              </Stack>
              <FormControlLabel
                control={<Switch checked={config.logoBluetooth !== false} onChange={cambiar('logoBluetooth')} />}
                label="Imprimir logo (tarda 1–2 s más)"
              />
              <Typography variant="caption" color="text.secondary">
                Enciende la impresora y que esté cerca. Funciona en Chrome o Edge (PC o Android);
                no en iPhone. La impresora debe ser Bluetooth BLE (4.0 o superior).
              </Typography>
            </Stack>
          )}

          <FormControl fullWidth size="small">
            <InputLabel>Ancho de papel</InputLabel>
            <Select value={config.ancho} label="Ancho de papel" onChange={cambiar('ancho')}>
              <MenuItem value={58}>58 mm</MenuItem>
              <MenuItem value={80}>80 mm</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Copias</InputLabel>
            <Select value={config.copias} label="Copias" onChange={cambiar('copias')}>
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={Boolean(config.auto)} onChange={cambiar('auto')} />}
            label="Imprimir automáticamente al cobrar una membresía"
          />

          {!esBluetooth && (
            <Typography variant="caption" color="text.secondary">
              Para imprimir sin que aparezca el diálogo, abre Chrome con la opción
              --kiosk-printing y deja la impresora de tickets como predeterminada.
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary">
            Esta configuración se guarda solo en este equipo.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={imprimirPrueba} disabled={imprimiendo}>
          {imprimiendo ? 'Imprimiendo…' : 'Imprimir prueba'}
        </Button>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={guardar} variant="contained">Guardar</Button>
      </DialogActions>
    </Dialog>
  );
};

PrinterSettingsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
