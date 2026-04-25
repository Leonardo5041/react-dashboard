import { useState } from 'react';
import Head from 'next/head';
import { PinGuard } from 'src/components/pin-guard';
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
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

const todayMX = () => moment.tz('America/Mexico_City').toDate();

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

  const desde = moment(fechaDesde).format('YYYY-MM-DD');
  const hasta = moment(fechaHasta).format('YYYY-MM-DD');

  const { isLoading, isError, data = {}, refetch } = useQuery(
    ['ventas-historial', desde, hasta],
    () => fetchHistorial(desde, hasta),
    { refetchOnWindowFocus: false }
  );

  const ventas = data.ventas || [];

  const handleBuscar = () => refetch();

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
