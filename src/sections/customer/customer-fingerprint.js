import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_URL } from '../../socket';

const REGISTER_TIMEOUT_MS = 90000;
const SAVE_RESPONSE_TIMEOUT_MS = 20000;
const RECONNECT_DELAY_MS = 3000;

export const CustomerFingerPrint = ({ user }) => {
  const queryClient = useQueryClient();
  const socket = useRef(null);
  const mounted = useRef(true);
  const reconnectTimer = useRef(null);
  const registerTimer = useRef(null);
  // Client waiting for a card swipe. Null when no registration is in progress.
  const pendingUserId = useRef(null);
  // True once save-card was sent and we wait for the backend response.
  const awaitingSave = useRef(false);
  const [registering, setRegistering] = useState(false);

  const clearPending = useCallback(() => {
    clearTimeout(registerTimer.current);
    registerTimer.current = null;
    pendingUserId.current = null;
    awaitingSave.current = false;
    setRegistering(false);
  }, []);

  const failRegistration = useCallback((text) => {
    clearPending();
    Swal.fire({
      title: 'Tarjeta no registrada',
      text,
      icon: 'error',
      allowOutsideClick: false
    });
  }, [clearPending]);

  const handleMessage = useCallback(async (event) => {
    let data;
    try {
      data = JSON.parse(event?.data);
    } catch {
      return;
    }
    if (!pendingUserId.current) {
      return;
    }

    // Backend response to our save-card.
    if (data?.['save-card'] !== undefined) {
      if (!awaitingSave.current) {
        return;
      }
      const saved = data.response === true;
      clearPending();
      if (saved) {
        await queryClient.invalidateQueries(['customer']);
        await Swal.fire({
          title: 'Tarjeta registrada',
          text: 'Tarjeta registrada con éxito',
          icon: 'success',
          allowOutsideClick: false,
          timer: 1500
        });
      } else {
        await Swal.fire({
          title: 'Tarjeta no registrada',
          text: 'No se pudo asignar la tarjeta. Puede que pertenezca a otro cliente.',
          icon: 'error',
          allowOutsideClick: false
        });
      }
      return;
    }

    if (awaitingSave.current || data?.access === undefined) {
      return;
    }

    // Unregistered card read: assign it to the pending client.
    if (data.card) {
      if (socket.current?.readyState !== WebSocket.OPEN) {
        failRegistration('Se perdió la conexión con el lector.');
        return;
      }
      awaitingSave.current = true;
      // The card was read: from now on the wait is for the backend, not for a swipe.
      clearTimeout(registerTimer.current);
      registerTimer.current = setTimeout(() => {
        if (awaitingSave.current) {
          failRegistration('El servidor no respondió. Revise si la tarjeta quedó asignada antes de intentar de nuevo.');
        }
      }, SAVE_RESPONSE_TIMEOUT_MS);
      socket.current.send(JSON.stringify({
        action: 'save-card',
        user_id: pendingUserId.current,
        card_id: data.card
      }));
      Swal.update({ title: 'Guardando tarjeta', text: 'Asignando tarjeta al cliente...' });
      Swal.showLoading();
      return;
    }

    // Card read but it is already registered: backend never sends `card` for it.
    failRegistration('La tarjeta leída ya está registrada. Use una tarjeta nueva.');
  }, [clearPending, failRegistration, queryClient]);

  // Keep the socket handler pointing at the latest callback without reconnecting.
  const handleMessageRef = useRef(handleMessage);
  useEffect(() => {
    handleMessageRef.current = handleMessage;
  }, [handleMessage]);

  useEffect(() => {
    mounted.current = true;
    // Leftover from the previous implementation, which kept the pending client in localStorage.
    try {
      localStorage.removeItem('user-id');
    } catch {
      // ignore
    }

    const connect = () => {
      if (!mounted.current) return;
      const ws = new WebSocket(SOCKET_URL);
      socket.current = ws;

      ws.onmessage = (event) => handleMessageRef.current(event);

      ws.onclose = () => {
        if (!mounted.current) return;
        if (pendingUserId.current) {
          failRegistration('Se perdió la conexión con el lector. Intente de nuevo.');
        }
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      mounted.current = false;
      clearTimeout(reconnectTimer.current);
      clearTimeout(registerTimer.current);
      // Don't leave the waiting modal open on the next page.
      if (pendingUserId.current) {
        Swal.close();
      }
      pendingUserId.current = null;
      awaitingSave.current = false;
      socket.current?.close();
    };
  }, [failRegistration]);

  // Next keeps this component mounted when navigating between customers:
  // abort a registration started for a different customer.
  useEffect(() => {
    if (pendingUserId.current && pendingUserId.current !== user?.id) {
      clearPending();
      Swal.close();
    }
  }, [user?.id, clearPending]);

  const handleSubmit = async (userId) => {
    const confirmResponse = await Swal.fire({
      title: '¿Actualizar Tarjeta de Acceso?',
      icon: 'question',
      iconHtml: '?',
      confirmButtonText: 'Si',
      cancelButtonText: 'No',
      showCancelButton: true,
      showCloseButton: true
    });
    if (!confirmResponse.isConfirmed) {
      return;
    }

    if (socket.current?.readyState !== WebSocket.OPEN) {
      await Swal.fire({
        title: 'Sin conexión',
        text: 'No hay conexión con el lector. Espere unos segundos e intente de nuevo.',
        icon: 'error'
      });
      return;
    }

    clearPending();
    pendingUserId.current = userId;
    setRegistering(true);
    registerTimer.current = setTimeout(() => {
      if (pendingUserId.current === userId) {
        failRegistration('No se detectó ninguna tarjeta en 90 segundos.');
      }
    }, REGISTER_TIMEOUT_MS);

    const result = await Swal.fire({
      title: 'Por favor acerque la tarjeta al lector',
      text: 'Esperando tarjeta nueva...',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      didOpen: () => Swal.showLoading()
    });

    const cancelled = [
      Swal.DismissReason.cancel,
      Swal.DismissReason.esc,
      Swal.DismissReason.close
    ].includes(result?.dismiss);
    if (cancelled && pendingUserId.current === userId) {
      clearPending();
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {
            (user?.fingerprint_secret) ?
              <Alert
                color="info"
                severity="info"
              >
                <div>
                  El cliente cuenta con una <b>tarjeta</b> asignada.
                </div>
              </Alert>
              :
              <Alert
                color="warning"
                severity="warning"
              >
                <div>
                  El cliente no tiene una <b>tarjeta</b> asignada.
                </div>
              </Alert>
          }
        </Box>
      </CardContent>
      <Divider/>
      <CardActions>
        <Button
          fullWidth
          variant="text"
          disabled={!user?.id || registering}
          onClick={() => handleSubmit(user.id)}
        >
          {(user?.fingerprint_secret) ? 'Actualizar Tarjeta de Acceso' : 'Agregar Tarjeta de Acceso'}
        </Button>
      </CardActions>
    </Card>
  );
};
