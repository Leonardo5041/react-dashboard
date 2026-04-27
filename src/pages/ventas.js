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
  Divider,
  FormControl,
  IconButton,
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
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import MinusIcon from '@heroicons/react/24/solid/MinusIcon';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PRODUCTS_URL } from 'src/utils/get-initials';
import Swal from 'sweetalert2';

const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Gasto'];

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

  const [cart, setCart] = useState([]);
  const [metodo, setMetodo] = useState('Efectivo');
  const [submitting, setSubmitting] = useState(false);
  const [scanNotFound, setScanNotFound] = useState(false);

  const scanBuffer = useRef('');
  const scanLastTime = useRef(0);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      Swal.fire({ icon: 'warning', title: 'Sin stock', text: `${product.nombre} no tiene unidades disponibles.`, confirmButtonColor: '#d33' });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { product, cantidad: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter((i) => i.cantidad > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.precio * i.cantidad, 0);

  useEffect(() => {
    const handleKeyDown = (e) => {
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
          addToCart(found);
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

  const handleVenta = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const { status, data } = await axios.post(`${PRODUCTS_URL}ventas`, {
        metodo,
        items: cart.map((i) => ({ sku: i.product.sku, cantidad: i.cantidad }))
      });
      if (status === 201) {
        setCart([]);
        queryClient.invalidateQueries(['products-pos']);
        Swal.fire({
          icon: 'success',
          title: 'Venta registrada',
          text: `Total: $${data?.venta?.total} MXN (${metodo})`,
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
              <Grid xs={12} md={8}>
                <Grid container spacing={2}>
                  {products.map((product) => {
                    const sinStock = product.stock <= 0;
                    return (
                      <Grid xs={12} sm={6} lg={4} key={product.id}>
                        <Card
                          onClick={() => addToCart(product)}
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
              </Grid>

              <Grid xs={12} md={4}>
                <Card sx={{ position: { md: 'sticky' }, top: { md: 80 } }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <SvgIcon fontSize="small"><ShoppingCartIcon /></SvgIcon>
                        <Typography variant="h6">Carrito</Typography>
                        {cart.length > 0 && (
                          <Chip label={cart.length} size="small" color="primary" />
                        )}
                      </Stack>

                      {cart.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                          Selecciona o escanea un producto
                        </Typography>
                      ) : (
                        <Stack spacing={1} divider={<Divider />}>
                          {cart.map(({ product, cantidad }) => (
                            <Stack key={product.id} spacing={0.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Typography variant="body2" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
                                  {product.nombre}
                                </Typography>
                                <IconButton size="small" onClick={() => removeFromCart(product.id)}>
                                  <SvgIcon fontSize="small"><TrashIcon /></SvgIcon>
                                </IconButton>
                              </Stack>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <IconButton size="small" onClick={() => updateQuantity(product.id, -1)}>
                                    <SvgIcon fontSize="small"><MinusIcon /></SvgIcon>
                                  </IconButton>
                                  <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                                    {cantidad}
                                  </Typography>
                                  <IconButton size="small" onClick={() => updateQuantity(product.id, 1)}>
                                    <SvgIcon fontSize="small"><PlusIcon /></SvgIcon>
                                  </IconButton>
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                  ${(product.precio * cantidad).toFixed(2)}
                                </Typography>
                              </Stack>
                            </Stack>
                          ))}
                        </Stack>
                      )}

                      <Divider />

                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>${cartTotal.toFixed(2)} MXN</Typography>
                      </Stack>

                      <FormControl fullWidth size="small">
                        <InputLabel>Método de pago</InputLabel>
                        <Select value={metodo} label="Método de pago" onChange={(e) => setMetodo(e.target.value)}>
                          {METODOS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        color={metodo === 'Gasto' ? 'error' : 'primary'}
                        disabled={cart.length === 0 || submitting}
                        onClick={handleVenta}
                        startIcon={submitting ? <CircularProgress size={16} /> : null}
                      >
                        {metodo === 'Gasto' ? `Registrar Gasto $${cartTotal.toFixed(2)}` : `Cobrar $${cartTotal.toFixed(2)}`}
                      </Button>

                      {cart.length > 0 && (
                        <Button
                          fullWidth
                          variant="text"
                          color="error"
                          size="small"
                          onClick={() => setCart([])}
                          disabled={submitting}
                        >
                          Vaciar carrito
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
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
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
