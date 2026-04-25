import Head from 'next/head';
import { useState } from 'react';
import { PinGuard } from 'src/components/pin-guard';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL } from 'src/utils/get-initials';
import Swal from 'sweetalert2';

const fetchEstado = async () => {
  const { data, status } = await axios.get(`${PRODUCTS_URL}inventario/estado`);
  if (status !== 200) return null;
  return data;
};

const fetchAlertas = async () => {
  const { data, status } = await axios.get(`${PRODUCTS_URL}inventario/alertas`);
  if (status !== 200) return null;
  return data;
};

const Page = () => {
  const queryClient = useQueryClient();
  const { isLoading, data: estado } = useQuery(['inventario-estado'], fetchEstado, { refetchOnWindowFocus: false });
  const { data: alertasData } = useQuery(['inventario-alertas'], fetchAlertas, { refetchOnWindowFocus: false });

  const [editProduct, setEditProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenEdit = (product) => {
    setEditProduct(product);
    setNewStock(String(product.stock));
  };

  const handleCloseEdit = () => {
    setEditProduct(null);
    setNewStock('');
  };

  const handleUpdateStock = async () => {
    if (!editProduct) return;
    const stockVal = parseInt(newStock);
    if (isNaN(stockVal) || stockVal < 0) {
      Swal.fire({ icon: 'warning', title: 'Stock inválido', text: 'Ingresa un número válido mayor o igual a 0' });
      return;
    }
    setSubmitting(true);
    try {
      const { status } = await axios.put(`${PRODUCTS_URL}inventario/${editProduct.id}`, { stock: stockVal });
      if (status === 200) {
        queryClient.invalidateQueries(['inventario-estado']);
        queryClient.invalidateQueries(['inventario-alertas']);
        handleCloseEdit();
        Swal.fire({ icon: 'success', title: 'Stock actualizado', timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err?.response?.data?.error || 'No se pudo actualizar' });
    } finally {
      setSubmitting(false);
    }
  };

  const alertas = alertasData?.alertas || [];
  const hayAlertas = alertasData?.estado === 'ALERTA';
  const productos = estado?.productos || [];

  return (
    <PinGuard>
      <Head>
        <title>Inventario | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Typography variant="h4">Inventario</Typography>

            {isLoading && <LinearProgress color="secondary" />}

            <Grid container spacing={3}>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Total productos</Typography>
                    <Typography variant="h4">{estado?.totalProductos ?? '—'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Unidades en stock</Typography>
                    <Typography variant="h4">{estado?.totalStock ?? '—'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Alertas activas</Typography>
                    <Typography variant="h4" color={hayAlertas ? 'error' : 'success.main'}>
                      {alertasData?.cantidad ?? '—'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {hayAlertas && (
              <Alert severity="warning">
                <strong>Stock bajo en {alertasData.cantidad} producto(s):</strong>{' '}
                {alertas.map((a) => `${a.producto} (${a.stockActual}/${a.stockMinimo})`).join(', ')}
              </Alert>
            )}

            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Mínimo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Ajustar stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productos.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary">Sin productos</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {productos.map((p) => {
                    const bajo = p.stock <= p.minimo;
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell>{p.id}</TableCell>
                        <TableCell>{p.nombre}</TableCell>
                        <TableCell>{p.sku}</TableCell>
                        <TableCell>${p.precio} MXN</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell>{p.minimo}</TableCell>
                        <TableCell>
                          <Chip
                            label={bajo ? 'Stock bajo' : 'OK'}
                            color={bajo ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => handleOpenEdit(p)}>
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </Stack>
        </Container>
      </Box>

      <Dialog open={!!editProduct} onClose={handleCloseEdit} maxWidth="xs" fullWidth>
        <DialogTitle>Ajustar Stock — {editProduct?.nombre}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nuevo stock"
            type="number"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            sx={{ mt: 1 }}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={submitting}>Cancelar</Button>
          <Button
            onClick={handleUpdateStock}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
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
