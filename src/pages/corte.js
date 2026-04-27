import Head from 'next/head';
import { useState } from 'react';
import { PinGuard } from 'src/components/pin-guard';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
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

const SummaryCard = ({ label, value }) => (
  <Card>
    <CardContent>
      <Typography variant="overline" color="text.secondary">{label}</Typography>
      <Typography variant="h5">${value?.toFixed(2) ?? '0.00'} MXN</Typography>
    </CardContent>
  </Card>
);

const Page = () => {
  const [showTotals, setShowTotals] = useState(true);
  const { isLoading, isError, data: corte } = useQuery(
    ['corte-caja'],
    fetchCorte,
    { refetchOnWindowFocus: false }
  );

  const ventas = corte?.ventas || [];

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

            <Grid container spacing={3}>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Efectivo</Typography>
                    <Typography variant="h5">
                      {showTotals ? `$${corte?.totalEfectivo?.toFixed(2) ?? '0.00'} MXN` : '••••••'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Tarjeta</Typography>
                    <Typography variant="h5">
                      {showTotals ? `$${corte?.totalTarjeta?.toFixed(2) ?? '0.00'} MXN` : '••••••'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Transferencia</Typography>
                    <Typography variant="h5">
                      {showTotals ? `$${corte?.totalTransferencia?.toFixed(2) ?? '0.00'} MXN` : '••••••'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>Total del día</Typography>
                    <Typography variant="h5">
                      {showTotals ? `$${corte?.total?.toFixed(2) ?? '0.00'} MXN` : '••••••'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {(corte?.totalGastos ?? 0) > 0 && (
                <Grid xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
                    <CardContent>
                      <Typography variant="overline" sx={{ opacity: 0.8 }}>Gastos internos</Typography>
                      <Typography variant="h5">
                        {showTotals ? `$${corte?.totalGastos?.toFixed(2) ?? '0.00'} MXN` : '••••••'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

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
                        {(venta.items || []).map((i) =>
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
    </PinGuard>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
