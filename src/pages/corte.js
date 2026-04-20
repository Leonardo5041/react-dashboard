import Head from 'next/head';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL, formatDateTime } from 'src/utils/get-initials';

const METODO_COLOR = {
  Efectivo: 'success',
  Tarjeta: 'info',
  Transferencia: 'warning'
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
  const { isLoading, isError, data: corte } = useQuery(
    ['corte-caja'],
    fetchCorte,
    { refetchOnWindowFocus: false }
  );

  const ventas = corte?.ventas || [];

  return (
    <>
      <Head>
        <title>Corte de Caja | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">Corte de Caja</Typography>
              {corte?.fecha && (
                <Typography variant="body2" color="text.secondary">
                  Fecha: {corte.fecha}
                </Typography>
              )}
            </Stack>

            {isLoading && <LinearProgress color="secondary" />}
            {isError && <Typography color="error">Error al cargar el corte de caja</Typography>}

            <Grid container spacing={3}>
              <Grid xs={12} sm={6} md={3}>
                <SummaryCard label="Efectivo" value={corte?.totalEfectivo} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <SummaryCard label="Tarjeta" value={corte?.totalTarjeta} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <SummaryCard label="Transferencia" value={corte?.totalTransferencia} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>Total del día</Typography>
                    <Typography variant="h5">${corte?.total?.toFixed(2) ?? '0.00'} MXN</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6">Ventas del día</Typography>

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Monto</TableCell>
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
