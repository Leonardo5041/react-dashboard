import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Collapse,
  Container,
  IconButton,
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
import ChevronDownIcon from '@heroicons/react/24/solid/ChevronDownIcon';
import ChevronUpIcon from '@heroicons/react/24/solid/ChevronUpIcon';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL, formatDateTime } from 'src/utils/get-initials';
import { useMemo, useState } from 'react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const METODO_COLOR = { Efectivo: 'success', Tarjeta: 'info', Transferencia: 'warning' };

const fetchReporteSemanal = async () => {
  const { data, status } = await axios.get(`${PRODUCTS_URL}corte/semanal`);
  if (status !== 200) return null;
  return data;
};

const SummaryCard = ({ label, value, highlight }) => (
  <Card sx={highlight ? { bgcolor: 'primary.main', color: 'primary.contrastText' } : {}}>
    <CardContent>
      <Typography variant="overline" sx={{ opacity: highlight ? 0.8 : undefined }} color={highlight ? undefined : 'text.secondary'}>
        {label}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </CardContent>
  </Card>
);

const DiaRow = ({ dia }) => {
  const [open, setOpen] = useState(false);
  const hasVentas = dia.numVentas > 0;

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          {hasVentas && (
            <IconButton size="small" onClick={() => setOpen((v) => !v)}>
              {open
                ? <ChevronUpIcon style={{ width: 16, height: 16 }} />
                : <ChevronDownIcon style={{ width: 16, height: 16 }} />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={hasVentas ? 600 : 400}>
            {dia.dia}
          </Typography>
          <Typography variant="caption" color="text.secondary">{dia.fecha}</Typography>
        </TableCell>
        <TableCell align="right">${dia.totalEfectivo?.toFixed(2)}</TableCell>
        <TableCell align="right">${dia.totalTarjeta?.toFixed(2)}</TableCell>
        <TableCell align="right">${dia.totalTransferencia?.toFixed(2)}</TableCell>
        <TableCell align="right">
          <Typography variant="body2" fontWeight={600}>
            ${dia.total?.toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Chip label={dia.numVentas} size="small" color={hasVentas ? 'primary' : 'default'} />
        </TableCell>
      </TableRow>

      {hasVentas && (
        <TableRow>
          <TableCell colSpan={7} sx={{ py: 0, bgcolor: 'action.hover' }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ px: 4, py: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Método</TableCell>
                      <TableCell>Fecha</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(dia.ventas || []).map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell>{venta.id}</TableCell>
                        <TableCell>{venta.producto}</TableCell>
                        <TableCell>${venta.monto} MXN</TableCell>
                        <TableCell>
                          <Chip label={venta.metodo} color={METODO_COLOR[venta.metodo] || 'default'} size="small" />
                        </TableCell>
                        <TableCell>{formatDateTime(venta.fecha)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const Page = () => {
  const { isLoading, isError, data: reporte } = useQuery(
    ['reporte-semanal'],
    fetchReporteSemanal,
    { refetchOnWindowFocus: false }
  );

  const dias = reporte?.dias || [];

  const chartSeries = useMemo(() => [
    { name: 'Efectivo', data: dias.map((d) => Number(d.totalEfectivo) || 0) },
    { name: 'Tarjeta', data: dias.map((d) => Number(d.totalTarjeta) || 0) },
    { name: 'Transferencia', data: dias.map((d) => Number(d.totalTransferencia) || 0) }
  ], [dias]);

  const chartOptions = useMemo(() => ({
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: dias.map((d) => String(d.dia || '')) },
    yaxis: { labels: { formatter: (v) => `$${Number(v) || 0}` } },
    legend: { position: 'top' },
    colors: ['#4CAF50', '#2196F3', '#FF9800'],
    tooltip: { y: { formatter: (v) => `$${(Number(v) || 0).toFixed(2)} MXN` } }
  }), [dias]);

  return (
    <>
      <Head>
        <title>Reporte Semanal | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">Reporte Semanal</Typography>
              {reporte?.semana && (
                <Typography variant="body2" color="text.secondary">
                  {reporte.semana}
                </Typography>
              )}
            </Stack>

            {isLoading && <LinearProgress color="secondary" />}
            {isError && <Typography color="error">Error al cargar el reporte semanal</Typography>}

            <Grid container spacing={3}>
              <Grid xs={12} sm={6} md={3}>
                <SummaryCard label="Efectivo" value={`$${reporte?.totalEfectivo?.toFixed(2) ?? '0.00'} MXN`} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <SummaryCard label="Tarjeta" value={`$${reporte?.totalTarjeta?.toFixed(2) ?? '0.00'} MXN`} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <SummaryCard label="Transferencia" value={`$${reporte?.totalTransferencia?.toFixed(2) ?? '0.00'} MXN`} />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <SummaryCard
                  label="Total de la semana"
                  value={`$${reporte?.total?.toFixed(2) ?? '0.00'} MXN`}
                  highlight
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Ventas registradas</Typography>
                    <Typography variant="h5">{reporte?.numVentas ?? 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {dias.length > 0 && (
              <Card>
                <CardHeader title="Ingresos por día y método de pago" />
                <CardContent>
                  <Chart
                    key={dias.length}
                    type="bar"
                    height={300}
                    options={chartOptions}
                    series={chartSeries}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader title="Desglose por día" />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={48} />
                    <TableCell>Día</TableCell>
                    <TableCell align="right">Efectivo</TableCell>
                    <TableCell align="right">Tarjeta</TableCell>
                    <TableCell align="right">Transferencia</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Ventas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dias.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">Sin datos para esta semana</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {dias.map((dia) => (
                    <DiaRow key={dia.dia} dia={dia} />
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
