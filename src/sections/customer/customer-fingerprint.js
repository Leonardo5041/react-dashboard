import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { SOCKET_URL } from '../../socket';
import { useRouter } from 'next/router';

const SavingCard = () => {
  return (
    Swal.fire({
      title: 'Por favor acerque la tarjeta al lector',
      text: 'Guardando tarjeta',
      icon: 'info',
      allowOutsideClick: false,
      showCancelButton: true
    }) && Swal.showLoading()
  );
};
export const CustomerFingerPrint = ({ user }) => {
  const socket = useRef(null);
  const router = useRouter();
  const [loadingCard, setLoadingCard] = useState(false);

  useEffect(() => {
    socket.current = new WebSocket(SOCKET_URL);

    socket.current.onopen = () => {
    };

    socket.current.onmessage = async (event) => {
      const data = JSON.parse(event?.data);
      if (data?.['save-card']) {
        const { response } = data;
        await registerCard(response);
      } else if (data?.card) {
        if (data?.card) {
          const userId = localStorage.getItem('user-id');
          const idCard = data.card;
          socket.current.send(JSON.stringify({
            action: 'save-card',
            user_id: userId,
            card_id: idCard
          }));
          setLoadingCard(false);
          localStorage.removeItem('user-id');
          router.reload();
          socket.current.close;
        }
      }
    };

    // socket.on('register-card', (data) => {
    //   setLoadingCard(true);
    //   registerCard(true).then(() => {
    //   }).catch(() => {
    //   });
    // });
    // socket.on('access', async (data) => {
    //   if (data.card) {
    //     const userId = localStorage.getItem('user-id');
    //     const idCard = data.card;
    //     socket.emit('save-card', { user_id: userId, card_id: idCard });
    //     setLoadingCard(false);
    //     localStorage.removeItem('user-id');
    //     router.reload();
    //     socket.off('access');
    //   }
    // });
    // socket.on('save-card', async (data) => {
    //   const { result } = data;
    //   await registerCard(result);
    // });
    return () => {
      if (socket.current.readyState === WebSocket.OPEN) {
        socket.current.close();
      }
    };
  }, [router]);

  const registerCard = async (value) => {
    if (value) {
      await Swal.fire({
        title: 'Tarjeta registrada',
        text: 'Tarjeta registrada con éxito',
        icon: 'success',
        allowOutsideClick: false,
        //cerrar el modal despues de 2 segundos
        timer: 1500
      });
    } else {
      await Swal.fire({
        title: 'Tarjeta no registrada',
        text: 'Tarjeta no registrada con éxito',
        icon: 'error',
        allowOutsideClick: false
      });
    }
  };

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

    try {
      localStorage.setItem('user-id', userId);
      setLoadingCard(true);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <>
      {
        (loadingCard) && <SavingCard/>
      }
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
          {
            (user?.fingerprint_secret) ?
              <Button
                fullWidth
                variant="text"
                onClick={() => handleSubmit(user.id)}
              >
                Actualizar Tarjeta de Acceso
              </Button>
              :
              <Button
                fullWidth
                variant="text"
                onClick={() => handleSubmit(user.id)}
              >
                Agregar Tarjeta de Acceso
              </Button>
          }

        </CardActions>
      </Card>
    </>
  );
};