import Head from 'next/head';
import { useState } from 'react';
import { PinGuard } from 'src/components/pin-guard';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
const VisibilityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const VisibilityOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL, formatTime } from 'src/utils/get-initials';

const METODO_COLOR = {
  Efectivo: 'success',
  Tarjeta: 'info',
  Transferencia: 'warning',
  Gasto: 'error'
};

const fetchCorte = async () => {
  const { data, status } = await axios.get(`${PRODUCTS_URL}corte/caja`);
  if (status !== 200) return null;
  return data;
};

const fmt = (v) => `$${Number(v).toFixed(2)} MXN`;

const DesgloseFila = ({ label, value, show, bold, highlight, color, action }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75, px: 1 }}>
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography
        variant={bold ? 'subtitle1' : 'body2'}
        fontWeight={bold ? 700 : 400}
        color={highlight ? 'primary.main' : color || 'text.secondary'}
      >
        {label}
      </Typography>
      {action}
    </Stack>
    <Typography
      variant={bold ? 'subtitle1' : 'body2'}
      fontWeight={bold ? 700 : 400}
      color={highlight ? 'primary.main' : color || 'text.primary'}
    >
      {show ? fmt(value) : '••••••'}
    </Typography>
  </Stack>
);

const Page = () => {
  const queryClient = useQueryClient();
  const [showTotals, setShowTotals] = useState(true);
  const [fondoDialog, setFondoDialog] = useState(false);
  const [fondoInput, setFondoInput] = useState('');
  const [savingFondo, setSavingFondo] = useState(false);

  const { isLoading, isError, data: corte } = useQuery(
    ['corte-caja'],
    fetchCorte,
    { refetchOnWindowFocus: false }
  );

  const ventas = corte?.ventas || [];
  const fondoInicial = corte?.fondoInicial ?? 0;
  const totalGastos = corte?.totalGastos ?? 0;
  const totalEfectivo = corte?.totalEfectivo ?? 0;
  const totalTarjeta = corte?.totalTarjeta ?? 0;
  const totalTransferencia = corte?.totalTransferencia ?? 0;
  const total = corte?.total ?? 0;
  // ventas en efectivo puras: lo que el backend ya calculó descontando fondo y gastos al revés
  const ventasEfectivo = totalEfectivo - fondoInicial + totalGastos;

  const openFondoDialog = () => {
    setFondoInput(corte?.fondoInicial ? String(corte.fondoInicial) : '');
    setFondoDialog(true);
  };

  const handleGuardarFondo = async () => {
    const monto = parseFloat(fondoInput);
    if (!monto || monto < 0) return;
    setSavingFondo(true);
    try {
      await axios.post(`${PRODUCTS_URL}corte/fondo`, { monto });
      queryClient.invalidateQueries(['corte-caja']);
      setFondoDialog(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFondo(false);
    }
  };

  return (
    <PinGuard>
      <Head>
        <title>Corte de Caja | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">Corte de Caja</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                {corte?.fecha && (
                  <Typography variant="body2" color="text.secondary">
                    Fecha: {corte.fecha}
                  </Typography>
                )}
                <Tooltip title={showTotals ? 'Ocultar totales' : 'Mostrar totales'}>
                  <IconButton onClick={() => setShowTotals((prev) => !prev)} size="small">
                    {showTotals ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {isLoading && <LinearProgress color="secondary" />}
            {isError && <Typography color="error">Error al cargar el corte de caja</Typography>}

            <Card>
              <CardContent>
                <Grid container spacing={0}>
                  {/* Columna efectivo */}
                  <Grid xs={12} md={6}>
                    <Stack spacing={0}>
                      <DesgloseFila
                        label="Fondo inicial"
                        value={fondoInicial}
                        show={showTotals}
                        action={
                          <Tooltip title={fondoInicial ? 'Editar fondo' : 'Registrar fondo'}>
                            <IconButton size="small" onClick={openFondoDialog} disabled={isLoading}>
                              <PencilIcon />
                            </IconButton>
                          </Tooltip>
                        }
                      />
                      <DesgloseFila label="Ventas efectivo" value={ventasEfectivo} show={showTotals} />
                      {totalGastos > 0 && (
                        <DesgloseFila label="Gastos internos" value={-totalGastos} show={showTotals} color="error.main" />
                      )}
                      <Divider sx={{ my: 1 }} />
                      <DesgloseFila label="Total efectivo" value={totalEfectivo} show={showTotals} bold />
                    </Stack>
                  </Grid>

                  {/* Separador vertical en md+ */}
                  <Grid xs={12} md="auto" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'stretch', px: 2 }}>
                    <Divider orientation="vertical" flexItem />
                  </Grid>
                  <Divider sx={{ display: { xs: 'block', md: 'none' }, my: 2 }} />

                  {/* Columna totales */}
                  <Grid xs={12} md>
                    <Stack spacing={0}>
                      <DesgloseFila label="Tarjeta" value={totalTarjeta} show={showTotals} />
                      <DesgloseFila label="Transferencia" value={totalTransferencia} show={showTotals} />
                      <Divider sx={{ my: 1 }} />
                      <DesgloseFila label="Total del día" value={total} show={showTotals} bold highlight />
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="h6">Ventas del día</Typography>

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Productos</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Hora</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventas.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Sin ventas registradas hoy
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {ventas.map((venta) => (
                    <TableRow key={venta.id} hover>
                      <TableCell>{venta.id}</TableCell>
                      <TableCell>
                        {venta.descripcion
                          ? venta.descripcion
                          : (venta.items || []).map((i) =>
                              i.cantidad > 1 ? `${i.producto} ×${i.cantidad}` : i.producto
                            ).join(', ')}
                      </TableCell>
                      <TableCell>
                        {showTotals ? `$${Number(venta.total).toFixed(2)} MXN` : '••••••'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={venta.metodo}
                          color={METODO_COLOR[venta.metodo] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatTime(venta.fecha)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Stack>
        </Container>
      </Box>
      <Dialog open={fondoDialog} onClose={() => setFondoDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Fondo inicial de caja</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Monto"
            type="number"
            value={fondoInput}
            onChange={(e) => setFondoInput(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            inputProps={{ min: 0, step: '0.01' }}
            sx={{ mt: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && handleGuardarFondo()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFondoDialog(false)} disabled={savingFondo}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarFondo}
            disabled={savingFondo || !parseFloat(fondoInput) || parseFloat(fondoInput) < 0}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </PinGuard>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
