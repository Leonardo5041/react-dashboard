import Head from 'next/head';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery } from '@tanstack/react-query';
import api from 'src/utils/api';
import { formatTime } from 'src/utils/get-initials';

const METODO_COLOR = {
  Efectivo: 'success',
  Tarjeta: 'info',
  Transferencia: 'warning',
  Gasto: 'error'
};

const fmt = (v) => `$${Number(v).toFixed(2)} MXN`;

const DesgloseFila = ({ label, value, show, bold, highlight, color }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75, px: 1 }}>
    <Typography
      variant={bold ? 'subtitle1' : 'body2'}
      fontWeight={bold ? 700 : 400}
      color={highlight ? 'primary.main' : color || 'text.secondary'}
    >
      {label}
    </Typography>
    <Typography
      variant={bold ? 'subtitle1' : 'body2'}
      fontWeight={bold ? 700 : 400}
      color={highlight ? 'primary.main' : color || 'text.primary'}
    >
      {show ? fmt(value) : '••••••'}
    </Typography>
  </Stack>
);

const fetchCorteAdmin = async () => {
  const { data, status } = await api.get('corte/caja/admin');
  if (status !== 200) return null;
  return data;
};

const fetchCiegoAdmin = async () => {
  const { data } = await api.get('corte/ciego/admin');
  return data || [];
};

const difColor = (v) => {
  if (v > 0) return 'success.main';
  if (v < 0) return 'error.main';
  return 'text.primary';
};

const Page = () => {
  const [showTotals, setShowTotals] = useState(true);

  const { isLoading, isError, data: corte } = useQuery(
    ['corte-caja-admin'],
    fetchCorteAdmin,
    { refetchOnWindowFocus: false }
  );

  const { data: ciegos = [] } = useQuery(
    ['corte-ciego-admin'],
    fetchCiegoAdmin,
    { refetchOnWindowFocus: false }
  );

  const ventas = corte?.ventas || [];
  const fondoInicial = corte?.fondoInicial ?? 0;
  const totalGastos = corte?.totalGastos ?? 0;
  const totalEfectivo = corte?.totalEfectivo ?? 0;
  const totalTarjeta = corte?.totalTarjeta ?? 0;
  const totalTransferencia = corte?.totalTransferencia ?? 0;
  const total = corte?.total ?? 0;
  const ventasEfectivo = totalEfectivo - fondoInicial + totalGastos;

  return (
    <>
      <Head>
        <title>Corte Admin | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack spacing={0.5}>
                <Typography variant="h4">Corte Global del Día</Typography>
                <Typography variant="body2" color="text.secondary">
                  Todas las ventas de todos los cajeros
                </Typography>
              </Stack>
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
            {isError && <Typography color="error">Error al cargar el corte global</Typography>}

            <Card>
              <CardContent>
                <Grid container spacing={0}>
                  <Grid xs={12} md={6}>
                    <Stack spacing={0}>
                      <DesgloseFila label="Fondo inicial" value={fondoInicial} show={showTotals} />
                      <DesgloseFila label="Ventas efectivo" value={ventasEfectivo} show={showTotals} />
                      {totalGastos > 0 && (
                        <DesgloseFila label="Gastos internos" value={-totalGastos} show={showTotals} color="error.main" />
                      )}
                      <Divider sx={{ my: 1 }} />
                      <DesgloseFila label="Total efectivo" value={totalEfectivo} show={showTotals} bold />
                    </Stack>
                  </Grid>

                  <Grid xs={12} md="auto" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'stretch', px: 2 }}>
                    <Divider orientation="vertical" flexItem />
                  </Grid>
                  <Divider sx={{ display: { xs: 'block', md: 'none' }, my: 2 }} />

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

            <Typography variant="h6">Todas las ventas del día</Typography>

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Productos</TableCell>
                    <TableCell>Cajero</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Hora</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventas.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
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
                        <Typography variant="body2" color="text.secondary">
                          {venta.cajeroNombre || '—'}
                        </Typography>
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

            <Typography variant="h6">Turnos del día</Typography>

            {ciegos.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Ningún cajero ha iniciado turno hoy.
              </Typography>
            ) : (
              <Card>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cajero</TableCell>
                      <TableCell>Inicio</TableCell>
                      <TableCell>Cierre</TableCell>
                      <TableCell align="right">Fondo confirmado</TableCell>
                      <TableCell align="right">Efectivo declarado</TableCell>
                      <TableCell align="right">Efectivo real</TableCell>
                      <TableCell align="right">Dif. efectivo</TableCell>
                      <TableCell align="right">Total declarado</TableCell>
                      <TableCell align="right">Total real</TableCell>
                      <TableCell align="right">Dif. total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ciegos.map((c) => (
                      <TableRow key={c.cajero_id} hover>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight={600}>{c.cajero_nombre}</Typography>
                            <Chip
                              label={c.turno_cerrado ? 'Cerrado' : 'En turno'}
                              color={c.turno_cerrado ? 'default' : 'success'}
                              size="small"
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{c.inicio_at || '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{c.fin_at || '—'}</Typography>
                        </TableCell>
                        <TableCell align="right">{showTotals ? `$${Number(c.fondo_confirmado).toFixed(2)}` : '••••••'}</TableCell>
                        <TableCell align="right">
                          {c.turno_cerrado ? (showTotals ? `$${Number(c.efectivo_declarado).toFixed(2)}` : '••••••') : '—'}
                        </TableCell>
                        <TableCell align="right">{showTotals ? `$${Number(c.efectivo_real).toFixed(2)}` : '••••••'}</TableCell>
                        <TableCell align="right">
                          {c.turno_cerrado ? (
                            <Typography variant="body2" color={difColor(c.dif_efectivo)} fontWeight={600}>
                              {showTotals ? `${c.dif_efectivo >= 0 ? '+' : ''}$${Number(c.dif_efectivo).toFixed(2)}` : '••••••'}
                            </Typography>
                          ) : '—'}
                        </TableCell>
                        <TableCell align="right">
                          {c.turno_cerrado ? (showTotals ? `$${Number(c.total_declarado).toFixed(2)}` : '••••••') : '—'}
                        </TableCell>
                        <TableCell align="right">{showTotals ? `$${Number(c.total_real).toFixed(2)}` : '••••••'}</TableCell>
                        <TableCell align="right">
                          {c.turno_cerrado ? (
                            <Typography variant="body2" color={difColor(c.dif_total)} fontWeight={700}>
                              {showTotals ? `${c.dif_total >= 0 ? '+' : ''}$${Number(c.dif_total).toFixed(2)}` : '••••••'}
                            </Typography>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
