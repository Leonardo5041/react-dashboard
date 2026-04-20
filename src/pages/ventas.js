import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import {
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
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  Stack,
  SvgIcon,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import ShoppingCartIcon from '@heroicons/react/24/solid/ShoppingCartIcon';
import CurrencyDollarIcon from '@heroicons/react/24/solid/CurrencyDollarIcon';
import QrCodeIcon from '@heroicons/react/24/solid/QrCodeIcon';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL } from 'src/utils/get-initials';
import Swal from 'sweetalert2';

const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia'];

const fetchProducts = async () => {
  const { data, status } = await axios.get(`${PRODUCTS_URL}productos`);
  if (status !== 200) return [];
  return data?.productos || [];
};

const Page = () => {
  const queryClient = useQueryClient();
  const { isLoading, isError, data: products = [] } = useQuery(
    ['products-pos'],
    fetchProducts,
    { refetchOnWindowFocus: false }
  );

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [metodo, setMetodo] = useState('Efectivo');
  const [submitting, setSubmitting] = useState(false);
  const [scanNotFound, setScanNotFound] = useState(false);

  const scanBuffer = useRef('');
  const scanLastTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when user is typing in an input/select
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const now = Date.now();
      if (now - scanLastTime.current > 80) scanBuffer.current = '';
      scanLastTime.current = now;

      if (e.key === 'Enter') {
        const sku = scanBuffer.current.trim();
        scanBuffer.current = '';
        if (!sku) return;
        const found = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
        if (found) {
          handleOpenDialog(found);
        } else {
          setScanNotFound(true);
        }
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleOpenDialog = (product) => {
    if (product.stock <= 0) {
      Swal.fire({ icon: 'warning', title: 'Sin stock', text: `${product.nombre} no tiene unidades disponibles.`, confirmButtonColor: '#d33' });
      return;
    }
    setSelectedProduct(product);
    setMetodo('Efectivo');
  };

  const handleClose = () => setSelectedProduct(null);

  const handleVenta = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const { status, data } = await axios.post(`${PRODUCTS_URL}ventas`, {
        sku: selectedProduct.sku,
        metodo
      });
      if (status === 201) {
        handleClose();
        queryClient.invalidateQueries(['products-pos']);
        Swal.fire({
          icon: 'success',
          title: 'Venta registrada',
          text: `${data?.venta?.producto} — $${data?.venta?.monto} (${metodo})`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error al registrar la venta';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Punto de Venta | Pitbulls Gym</title>
      </Head>
      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">Punto de Venta</Typography>
              <Chip
                icon={<SvgIcon fontSize="small"><QrCodeIcon /></SvgIcon>}
                label="Lector de barras activo"
                color="success"
                variant="outlined"
                size="small"
              />
            </Stack>

            {isLoading && <LinearProgress color="secondary" />}
            {isError && <Typography color="error">Error al cargar los productos</Typography>}

            <Grid container spacing={3}>
              {products.map((product) => {
                const sinStock = product.stock <= 0;
                return (
                  <Grid xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <Card
                      onClick={() => handleOpenDialog(product)}
                      sx={{
                        cursor: sinStock ? 'not-allowed' : 'pointer',
                        opacity: sinStock ? 0.5 : 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow 0.2s',
                        '&:hover': { boxShadow: sinStock ? undefined : 6 }
                      }}
                    >
                      <CardContent sx={{ flex: 1, textAlign: 'center' }}>
                        <SvgIcon sx={{ fontSize: 40, mb: 1, color: sinStock ? 'text.disabled' : 'primary.main' }}>
                          <ShoppingCartIcon />
                        </SvgIcon>
                        <Typography variant="h6">{product.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">SKU: {product.sku}</Typography>
                      </CardContent>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Stock: {product.stock}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <SvgIcon fontSize="small" color="action"><CurrencyDollarIcon /></SvgIcon>
                          <Typography variant="body2" color="text.secondary">${product.precio} MXN</Typography>
                        </Stack>
                      </Stack>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Stack>
        </Container>
      </Box>

      <Snackbar
        open={scanNotFound}
        autoHideDuration={3000}
        onClose={() => setScanNotFound(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setScanNotFound(false)}>
          SKU no encontrado en el catálogo
        </Alert>
      </Snackbar>

      <Dialog open={!!selectedProduct} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar Venta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body1">
              <strong>{selectedProduct?.nombre}</strong> — ${selectedProduct?.precio} MXN
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Método de pago</InputLabel>
              <Select value={metodo} label="Método de pago" onChange={(e) => setMetodo(e.target.value)}>
                {METODOS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button
            onClick={handleVenta}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            Cobrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
