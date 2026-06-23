import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
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
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  SvgIcon,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import ShoppingCartIcon from '@heroicons/react/24/solid/ShoppingCartIcon';
import CurrencyDollarIcon from '@heroicons/react/24/solid/CurrencyDollarIcon';
import QrCodeIcon from '@heroicons/react/24/solid/QrCodeIcon';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import MinusIcon from '@heroicons/react/24/solid/MinusIcon';
import TrashIcon from '@heroicons/react/24/solid/TrashIcon';
import UserIcon from '@heroicons/react/24/solid/UserIcon';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'src/utils/api';
import { PRODUCTS_URL } from 'src/utils/get-initials';
import { useAuthContext } from 'src/contexts/auth-context';
import Swal from 'sweetalert2';

const METODOS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Gasto'];

const fetchProducts = async () => {
  const { data, status } = await api.get('productos');
  if (status !== 200) return [];
  return data?.productos || [];
};

const Page = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';

  const { isLoading, isError, data: products = [] } = useQuery(
    ['products-pos'],
    fetchProducts,
    { refetchOnWindowFocus: false }
  );

  const { data: turnoData, isLoading: turnoLoading, refetch: refetchTurno } = useQuery(
    ['corte-turno-pos'],
    async () => { const { data } = await api.get('corte/turno'); return data; },
    { refetchOnWindowFocus: false, enabled: !isAdmin }
  );

  const turnoIniciado = isAdmin || turnoData?.turno_iniciado === true;
  const fondoActual = turnoData?.turno?.fondo_confirmado ?? 0;

  const [iniciarDialog, setIniciarDialog] = useState(false);
  const [fondoInput, setFondoInput] = useState('');
  const [iniciando, setIniciando] = useState(false);

  const handleIniciarTurno = async () => {
    const monto = parseFloat(fondoInput) || 0;
    setIniciando(true);
    try {
      await api.post('corte/turno', { fondo_confirmado: monto });
      await refetchTurno();
      setIniciarDialog(false);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error al iniciar turno';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setIniciando(false);
    }
  };

  const [cart, setCart] = useState([]);
  const [metodo, setMetodo] = useState('Efectivo');
  const [gastoLibre, setGastoLibre] = useState(false);
  const [gastoDesc, setGastoDesc] = useState('');
  const [gastoMonto, setGastoMonto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scanNotFound, setScanNotFound] = useState(false);

  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: allClients = [], isLoading: clientsLoading } = useQuery(
    ['clients-pos'],
    async () => { const { data } = await api.get('clients'); return data || []; },
    { refetchOnWindowFocus: false, enabled: clientDialogOpen }
  );

  const filteredClients = allClients.filter((c) =>
    c.name?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleMetodoChange = (nuevoMetodo) => {
    setMetodo(nuevoMetodo);
    if (nuevoMetodo !== 'Gasto') setGastoLibre(false);
  };

  const scanBuffer = useRef('');
  const scanLastTime = useRef(0);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      Swal.fire({ icon: 'warning', title: 'Sin stock', text: `${product.nombre} no tiene unidades disponibles.`, confirmButtonColor: '#d33' });
      return;
    }
    if (product.membership_id) {
      const already = cart.find((i) => i.product.id === product.id);
      if (already) {
        Swal.fire({ icon: 'info', title: 'Una membresía por transacción', text: 'Para vender más de una membresía, registra transacciones separadas.', confirmButtonColor: '#1976d2' });
        return;
      }
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
    if (delta > 0) {
      const item = cart.find((i) => i.product.id === productId);
      if (item?.product.membership_id) {
        Swal.fire({ icon: 'info', title: 'Una membresía por transacción', text: 'Para vender más de una membresía, registra transacciones separadas.', confirmButtonColor: '#1976d2' });
        return;
      }
    }
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

  const cartHasMembresia = cart.some((i) => i.product.membership_id);

  const handleVenta = async (clientId) => {
    if (cartHasMembresia && !clientId) {
      setClientDialogOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      let payload;
      if (metodo === 'Gasto' && gastoLibre) {
        payload = { metodo: 'Gasto', descripcion: gastoDesc.trim(), monto: parseFloat(gastoMonto) };
      } else {
        if (cart.length === 0) return;
        payload = {
          metodo,
          items: cart.map((i) => ({ sku: i.product.sku, cantidad: i.cantidad })),
          ...(clientId ? { client_id: clientId } : {})
        };
      }

      const { status, data } = await api.post('ventas', payload);
      if (status === 201) {
        setCart([]);
        setGastoDesc('');
        setGastoMonto('');
        setSelectedClient(null);
        queryClient.invalidateQueries(['products-pos']);
        Swal.fire({
          icon: 'success',
          title: metodo === 'Gasto' ? 'Gasto registrado' : 'Venta registrada',
          text: `Total: $${data?.venta?.total} MXN`,
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error al registrar';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientConfirm = () => {
    if (!selectedClient) return;
    setClientDialogOpen(false);
    setClientSearch('');
    handleVenta(selectedClient.id);
  };

  const gastoLibreValido = gastoDesc.trim().length > 0 && parseFloat(gastoMonto) > 0;
  const submitDisabled = submitting || (metodo === 'Gasto' && gastoLibre ? !gastoLibreValido : cart.length === 0);

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
              <Grid xs={12} md={8} sx={{ display: metodo === 'Gasto' && gastoLibre ? 'none' : undefined }}>
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
                        <Select value={metodo} label="Método de pago" onChange={(e) => handleMetodoChange(e.target.value)}>
                          {METODOS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </Select>
                      </FormControl>

                      {metodo === 'Gasto' && (
                        <ToggleButtonGroup
                          value={gastoLibre ? 'libre' : 'inventario'}
                          exclusive
                          size="small"
                          fullWidth
                          onChange={(_, val) => { if (val !== null) setGastoLibre(val === 'libre'); }}
                        >
                          <ToggleButton value="inventario">Gasto de inventario</ToggleButton>
                          <ToggleButton value="libre">Gasto libre</ToggleButton>
                        </ToggleButtonGroup>
                      )}

                      {metodo === 'Gasto' && gastoLibre && (
                        <Stack spacing={1.5}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Descripcion"
                            value={gastoDesc}
                            onChange={(e) => setGastoDesc(e.target.value)}
                            placeholder="Ej: Limpieza, Mantenimiento…"
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Monto"
                            type="number"
                            value={gastoMonto}
                            onChange={(e) => setGastoMonto(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            inputProps={{ min: 0, step: '0.01' }}
                          />
                        </Stack>
                      )}

                      {cartHasMembresia && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {selectedClient ? (
                            <Chip
                              icon={<SvgIcon fontSize="small"><UserIcon /></SvgIcon>}
                              label={selectedClient.name}
                              color="success"
                              onDelete={() => setSelectedClient(null)}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          ) : (
                            <Chip
                              icon={<SvgIcon fontSize="small"><UserIcon /></SvgIcon>}
                              label="Cliente requerido"
                              color="warning"
                              variant="outlined"
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          )}
                        </Stack>
                      )}

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        color={metodo === 'Gasto' ? 'error' : 'primary'}
                        disabled={submitDisabled}
                        onClick={() => handleVenta(selectedClient?.id || null)}
                        startIcon={submitting ? <CircularProgress size={16} /> : null}
                      >
                        {metodo === 'Gasto' && gastoLibre
                          ? `Registrar Gasto $${parseFloat(gastoMonto || 0).toFixed(2)}`
                          : metodo === 'Gasto'
                          ? `Registrar Gasto $${cartTotal.toFixed(2)}`
                          : `Cobrar $${cartTotal.toFixed(2)}`}
                      </Button>

                      {!gastoLibre && cart.length > 0 && (
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

      {/* Búsqueda de cliente para ventas con membresía */}
      <Dialog open={clientDialogOpen} onClose={() => setClientDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Seleccionar cliente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Esta venta incluye una membresía. Selecciona el cliente al que se le asignará.
            </Alert>
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Buscar por nombre"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon fontSize="small"><UserIcon /></SvgIcon>
                  </InputAdornment>
                )
              }}
            />
            {clientsLoading ? (
              <CircularProgress size={24} sx={{ alignSelf: 'center' }} />
            ) : (
              <List dense disablePadding sx={{ maxHeight: 240, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {filteredClients.length === 0 ? (
                  <ListItemButton disabled>
                    <ListItemText primary="Sin resultados" />
                  </ListItemButton>
                ) : filteredClients.map((client) => (
                  <ListItemButton
                    key={client.id}
                    selected={selectedClient?.id === client.id}
                    onClick={() => setSelectedClient(client)}
                  >
                    <ListItemText
                      primary={client.name}
                      secondary={client.email || `#${client.client_number}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setClientDialogOpen(false); setClientSearch(''); }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!selectedClient}
            onClick={handleClientConfirm}
          >
            Confirmar y cobrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bloqueo si el cajero no ha iniciado turno */}
      <Dialog
        open={!isAdmin && !turnoLoading && !turnoIniciado}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>Iniciar turno</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Debes iniciar tu turno antes de registrar ventas. Cuenta el efectivo en caja y confirma el monto.
            </Alert>
            <TextField
              autoFocus
              fullWidth
              label="Efectivo en caja"
              type="number"
              value={fondoInput}
              onChange={(e) => setFondoInput(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              inputProps={{ min: 0, step: '0.01' }}
              onKeyDown={(e) => e.key === 'Enter' && handleIniciarTurno()}
              helperText={`Fondo configurado: $${fondoActual.toFixed(2)} MXN`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="success"
            onClick={handleIniciarTurno}
            disabled={iniciando || fondoInput === ''}
            startIcon={iniciando ? <CircularProgress size={16} /> : null}
          >
            {iniciando ? 'Iniciando...' : 'Iniciar turno'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
