import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
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
import PrinterIcon from '@heroicons/react/24/solid/PrinterIcon';
import Cog6ToothIcon from '@heroicons/react/24/solid/Cog6ToothIcon';
import { debeImprimirAutomatico, imprimirTicket } from 'src/utils/printing';
import { PrinterSettingsDialog } from 'src/sections/sales/printer-settings-dialog';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'src/utils/api';
import { PRODUCTS_URL } from 'src/utils/get-initials';
import { useAuthContext } from 'src/contexts/auth-context';
import Swal from 'sweetalert2';
import {
  MENSAJE_CELULAR_INVALIDO,
  celularValido,
  mensajeErrorApi,
  normalizarCelular
} from 'src/utils/phone';

// Por qué un cliente no recibiría el recordatorio por SMS (null = sí lo recibe).
const motivoSinSms = (client) => {
  if (!celularValido(client?.phone)) return 'Sin celular';
  if (!client?.sms_opt_in) return 'No ha aceptado SMS';
  return null;
};

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

  // ─── Ticket ───────────────────────────────────────────────────────────────
  // Solo se conserva el último ticket (en memoria, hasta el siguiente cobro o recargar).
  const [lastTicket, setLastTicket] = useState(null);
  const [lastTicketImpreso, setLastTicketImpreso] = useState(false);
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);

  const { data: dryRunActivo = false } = useQuery(
    ['health-dry-run'],
    async () => {
      const res = await fetch(new URL('../../health', PRODUCTS_URL).toString());
      const body = await res.json();
      return body?.dry_run === true;
    },
    { refetchOnWindowFocus: false, retry: false }
  );

  const imprimir = async (ticket, copia) => {
    try {
      await imprimirTicket(ticket, { copia });
      setLastTicketImpreso(true);
    } catch (err) {
      const { isConfirmed } = await Swal.fire({
        icon: 'warning',
        title: 'No se pudo imprimir el ticket',
        text: `La venta sí quedó registrada. ${err?.message || ''}`.trim(),
        showCancelButton: true,
        confirmButtonText: 'Reintentar',
        cancelButtonText: 'Cerrar'
      });
      if (isConfirmed) imprimir(ticket, copia);
    }
  };

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

        // Ticket: se guarda el último (no para gastos) y se imprime solo si es membresía.
        const ticket = metodo !== 'Gasto' ? data?.ticket : null;
        setLastTicket(ticket || null);
        setLastTicketImpreso(false);
        if (ticket && debeImprimirAutomatico(ticket)) {
          imprimir(ticket, false);
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Error al registrar';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Celular / SMS desde el diálogo de cliente (sin salir del POS) ─────────
  const [telInput, setTelInput] = useState('');
  const [optInInput, setOptInInput] = useState(false);
  const [guardandoTel, setGuardandoTel] = useState(false);
  const [msgTel, setMsgTel] = useState(null); // { tipo: 'success' | 'error', texto }
  const [telTocado, setTelTocado] = useState(false); // mostrar error solo tras intentar guardar o salir del campo

  useEffect(() => {
    setTelInput(selectedClient?.phone || '');
    // Consentimiento explícito: recepción pregunta y marca la casilla solo si el socio acepta.
    setOptInInput(false);
    setMsgTel(null);
    setTelTocado(false);
  }, [selectedClient?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardarCelular = async () => {
    const celular = normalizarCelular(telInput);
    if (!celular) {
      setTelTocado(true); // el error se muestra en el campo
      return;
    }
    setGuardandoTel(true);
    setMsgTel(null);
    try {
      const { data } = await api.patch(`clients/${selectedClient.id}`, {
        phone: celular,
        sms_opt_in: optInInput
      });
      const actualizado = { ...selectedClient, ...data };
      setSelectedClient(actualizado);
      // Refleja el cambio en la lista sin volver a pedirla al servidor.
      queryClient.setQueryData(['clients-pos'], (lista = []) =>
        lista.map((c) => (c.id === actualizado.id ? { ...c, ...actualizado } : c))
      );
      setMsgTel({
        tipo: 'success',
        texto: actualizado.sms_opt_in
          ? 'Celular guardado. Recibirá el recordatorio por SMS.'
          : 'Celular guardado (sin recordatorios por SMS).'
      });
    } catch (err) {
      setMsgTel({ tipo: 'error', texto: mensajeErrorApi(err) });
    } finally {
      setGuardandoTel(false);
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
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  icon={<SvgIcon fontSize="small"><QrCodeIcon /></SvgIcon>}
                  label="Lector de barras activo"
                  color="success"
                  variant="outlined"
                  size="small"
                />
                <IconButton
                  size="small"
                  title="Impresora de tickets"
                  aria-label="Configurar impresora de tickets"
                  onClick={() => setPrinterDialogOpen(true)}
                >
                  <SvgIcon fontSize="small"><Cog6ToothIcon /></SvgIcon>
                </IconButton>
              </Stack>
            </Stack>

            {dryRunActivo && (
              <Alert severity="warning" variant="filled">
                MODO PRUEBA (DRY_RUN): las ventas no se guardan y los tickets salen marcados como prueba.
              </Alert>
            )}

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

                      {lastTicket && (
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<SvgIcon fontSize="small"><PrinterIcon /></SvgIcon>}
                          onClick={() => imprimir(lastTicket, lastTicketImpreso)}
                          disabled={submitting}
                        >
                          {lastTicketImpreso ? 'Reimprimir último ticket' : 'Imprimir ticket'}
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
            {selectedClient && motivoSinSms(selectedClient) && (
              <Stack spacing={1}>
                <Alert severity="warning" sx={{ py: 0.25 }}>
                  {motivoSinSms(selectedClient)}: no recibirá recordatorios por SMS (opcional).
                </Alert>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    fullWidth
                    size="small"
                    label="Celular"
                    placeholder="55 1234 5678"
                    type="tel"
                    inputProps={{ inputMode: 'tel' }}
                    value={telInput}
                    onChange={(e) => { setTelInput(e.target.value); setMsgTel(null); }}
                    onBlur={() => { if (telInput) setTelTocado(true); }}
                    error={telTocado && normalizarCelular(telInput) === null}
                    helperText={telTocado && normalizarCelular(telInput) === null ? MENSAJE_CELULAR_INVALIDO : null}
                  />
                  <Button
                    variant="contained"
                    onClick={guardarCelular}
                    disabled={guardandoTel}
                    startIcon={guardandoTel ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ whiteSpace: 'nowrap', minWidth: 96, height: 40 }}
                  >
                    Guardar
                  </Button>
                </Stack>
                <FormControlLabel
                  control={(
                    <Checkbox
                      size="small"
                      checked={optInInput}
                      onChange={(e) => setOptInInput(e.target.checked)}
                    />
                  )}
                  label="Acepta recordatorios por SMS"
                />
              </Stack>
            )}
            {msgTel && (
              <Alert severity={msgTel.tipo}>{msgTel.texto}</Alert>
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

      <PrinterSettingsDialog open={printerDialogOpen} onClose={() => setPrinterDialogOpen(false)} />
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
