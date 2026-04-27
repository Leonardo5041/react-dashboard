import { useState } from 'react';
import Head from 'next/head';
import { PinGuard } from 'src/components/pin-guard';
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL, confirmAlert, formatDateTime } from 'src/utils/get-initials';
import Swal from 'sweetalert2';
import { DatePicker } from '@mui/x-date-pickers';
import * as moment from 'moment-timezone';

const METODO_COLOR = {
  Efectivo: 'success',
  Tarjeta: 'info',
  Transferencia: 'warning'
};

const nowMX = () => moment.tz('America/Mexico_City');
const todayMX = () => nowMX().toDate();

const QUICK_FILTERS = [
  {
    label: 'Hoy',
    range: () => { const d = nowMX(); return [d.toDate(), d.toDate()]; }
  },
  {
    label: 'Esta semana',
    range: () => {
      const d = nowMX();
      return [d.clone().startOf('isoWeek').toDate(), d.clone().endOf('isoWeek').toDate()];
    }
  },
  {
    label: 'Semana anterior',
    range: () => {
      const d = nowMX().subtract(1, 'week');
      return [d.clone().startOf('isoWeek').toDate(), d.clone().endOf('isoWeek').toDate()];
    }
  },
  {
    label: 'Este mes',
    range: () => {
      const d = nowMX();
      return [d.clone().startOf('month').toDate(), d.clone().endOf('month').toDate()];
    }
  }
];

const fetchHistorial = async (desde, hasta) => {
  const { data, status } = await axios.get(
    `${PRODUCTS_URL}ventas/historial?desde=${desde}&hasta=${hasta}`
  );
  if (status !== 200) return { ventas: [], desde, hasta, total: 0 };
  return data;
};

const Page = () => {
  const queryClient = useQueryClient();
  const [fechaDesde, setFechaDesde] = useState(todayMX());
  const [fechaHasta, setFechaHasta] = useState(todayMX());
  const [activeFilter, setActiveFilter] = useState('Hoy');

  const applyQuickFilter = (filter) => {
    const [desde, hasta] = filter.range();
    setFechaDesde(desde);
    setFechaHasta(hasta);
    setActiveFilter(filter.label);
  };

  const desde = moment(fechaDesde).format('YYYY-MM-DD');
  const hasta = moment(fechaHasta).format('YYYY-MM-DD');

  const { isLoading, isError, data = {}, refetch } = useQuery(
    ['ventas-historial', desde, hasta],
    () => fetchHistorial(desde, hasta),
    { refetchOnWindowFocus: false }
  );

  const ventas = data.ventas || [];
  const numVentas = data.numVentas ?? ventas.length;
  const totalEfectivo = data.totalEfectivo ?? 0;
  const totalTarjeta = data.totalTarjeta ?? 0;
  const totalTransferencia = data.totalTransferencia ?? 0;
  const total = data.total ?? 0;

  const handleBuscar = () => {
    setActiveFilter(null);
    refetch();
  };

  const itemsLabel = (venta) =>
    (venta.items || []).map((i) => i.cantidad > 1 ? `${i.producto} ×${i.cantidad}` : i.producto).join(', ');

  const handleAnular = async (venta) => {
    const result = await confirmAlert(`¿Anular la venta #${venta.id} (${itemsLabel(venta)})?`);
    if (!result.isConfirmed) return;
    try {
      const { status } = await axios.delete(`${PRODUCTS_URL}ventas/${venta.id}`);
      if (status === 204) {
        queryClient.invalidateQueries(['ventas-historial']);
        Swal.fire({ icon: 'success', title: 'Venta anulada', timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.error || 'No se pudo anular' });
    }
  };

  return (
    <PinGuard>
      <Head>
        <title>Historial de Ventas | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Typography variant="h4">Historial de Ventas</Typography>

            <ButtonGroup variant="outlined" size="small">
              {QUICK_FILTERS.map((f) => (
                <Button
                  key={f.label}
                  variant={activeFilter === f.label ? 'contained' : 'outlined'}
                  onClick={() => applyQuickFilter(f)}
                >
                  {f.label}
                </Button>
              ))}
            </ButtonGroup>

            <Stack direction="row" spacing={2} alignItems="center">
              <DatePicker
                disableMaskedInput={true}
                label="Desde"
                value={fechaDesde}
                onChange={(newValue) => setFechaDesde(newValue)}
                inputFormat="dd/MMM/yyyy"
                renderInput={(params) => <TextField variant="outlined" {...params} />}
              />
              <DatePicker
                disableMaskedInput={true}
                label="Hasta"
                value={fechaHasta}
                onChange={(newValue) => setFechaHasta(newValue)}
                inputFormat="dd/MMM/yyyy"
                renderInput={(params) => <TextField variant="outlined" {...params} />}
              />
              <Button variant="contained" onClick={handleBuscar}>
                Buscar
              </Button>
            </Stack>

            {isLoading && <LinearProgress color="secondary" />}
            {isError && <Typography color="error">Error al cargar el historial</Typography>}

            {!isLoading && !isError && (
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} sm={3}>
                      <Typography variant="overline" color="text.secondary">Ventas</Typography>
                      <Typography variant="h6">{numVentas}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="overline" color="text.secondary">Efectivo</Typography>
                      <Typography variant="h6" color="success.main">${Number(totalEfectivo).toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="overline" color="text.secondary">Tarjeta</Typography>
                      <Typography variant="h6" color="info.main">${Number(totalTarjeta).toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="overline" color="text.secondary">Transferencia</Typography>
                      <Typography variant="h6" color="warning.main">${Number(totalTransferencia).toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="flex-end">
                    <Typography variant="overline" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                      Total general
                    </Typography>
                    <Typography variant="h5">${Number(total).toFixed(2)} MXN</Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Productos</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Anular</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventas.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">Sin ventas registradas</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {ventas.map((venta) => (
                    <TableRow key={venta.id} hover>
                      <TableCell>{venta.id}</TableCell>
                      <TableCell>{itemsLabel(venta)}</TableCell>
                      <TableCell>${Number(venta.total).toFixed(2)} MXN</TableCell>
                      <TableCell>
                        <Chip
                          label={venta.metodo}
                          color={METODO_COLOR[venta.metodo] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(venta.fecha)}</TableCell>
                      <TableCell align="right">
                        <IconButton color="error" size="small" onClick={() => handleAnular(venta)}>
                          <SvgIcon fontSize="small"><TrashIcon /></SvgIcon>
                        </IconButton>
                      </TableCell>
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
