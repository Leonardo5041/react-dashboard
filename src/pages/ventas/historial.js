import Head from 'next/head';
import {
  Box,
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
  Typography
} from '@mui/material';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL, confirmAlert, formatDateTime } from 'src/utils/get-initials';
import Swal from 'sweetalert2';

const METODO_COLOR = {
  Efectivo: 'success',
  Tarjeta: 'info',
  Transferencia: 'warning'
};

const fetchHistorial = async () => {
  const { data, status } = await axios.get(`${PRODUCTS_URL}ventas/historial`);
  if (status !== 200) return [];
  return data?.ventas || [];
};

const Page = () => {
  const queryClient = useQueryClient();
  const { isLoading, isError, data: ventas = [] } = useQuery(
    ['ventas-historial'],
    fetchHistorial,
    { refetchOnWindowFocus: false }
  );

  const handleAnular = async (venta) => {
    const result = await confirmAlert(`¿Anular la venta de "${venta.producto}"?`);
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
    <>
      <Head>
        <title>Historial de Ventas | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Typography variant="h4">Historial de Ventas</Typography>

            {isLoading && <LinearProgress color="secondary" />}
            {isError && <Typography color="error">Error al cargar el historial</Typography>}

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Monto</TableCell>
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
                      <TableCell>{venta.producto}</TableCell>
                      <TableCell>${venta.monto} MXN</TableCell>
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
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
