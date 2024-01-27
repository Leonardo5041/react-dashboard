import {useEffect, useRef, useState} from 'react';
import Head from 'next/head';
import {
    Box,
    LinearProgress,
    Typography
} from '@mui/material';
import {Layout as AccessLayout} from 'src/layouts/access/layout';
import Swal from 'sweetalert2';
import { SOCKET_URL } from '../socket';
const welcomeAlert = ({access, message}) => {
    Swal.fire({
        position: 'center',
        icon: (access) ? 'success' : 'error',
        // si tiene acceso mostrar Bienvenido y emoji feliz, si no mostrar Acceso denegado y emoji triste
        text: (access) ? '👋 Acceso concedido 🏋🏻' : 'Acceso denegado',
        title: message,
        showConfirmButton: false,
        timer: 5000
    })
}
const Page = () => {
    const socket = useRef(null);
    const [progress, setProgress] = useState(0);
    const [buffer, setBuffer] = useState(10);

    const progressRef = useRef(() => {
    });
    useEffect(() => {
        socket.current = new WebSocket(SOCKET_URL);
        progressRef.current = () => {
            if (progress > 100) {
                setProgress(0);
                setBuffer(10);
            } else {
                const diff = Math.random() * 10;
                const diff2 = Math.random() * 10;
                setProgress(progress + diff);
                setBuffer(progress + diff + diff2);
            }
        };
        socket.current.onopen = () => {
        }

        socket.current.onmessage = (event) => {
            const data = JSON.parse(event?.data);
            if (data?.access !== undefined && data?.message) {
                welcomeAlert({access: data?.access, message: data?.message});
            }
        }

        const timer = setInterval(() => {
            progressRef.current();
        }, 500);

        return () => {
          if (socket.current.readyState === WebSocket.OPEN) {
              socket.current.close();
          }
          socket.current.close();
          clearInterval(timer);
        }
    }, []);

    // //connect to socket server
    // useEffect(() => {
    //     socket.onopen = () => {
    //
    //     }
    //     socket.on('access', (data) => {
    //         welcomeAlert({access: data?.access, message: data?.message});
    //     });
    //
    //     return () => {
    //         socket.off('access');
    //     }
    // }, []);


    return (
        <>
            <Head>
                <title>
                    Acceso Clientes | Pitbulls Gym
                </title>
            </Head>
            <Box
                sx={{
                    backgroundColor: 'background.paper',
                    flex: '1 1 auto',
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Box
                    sx={{
                        maxWidth: 550,
                        px: 3,
                        py: '100px',
                        width: '100%'
                    }}
                >
                    {/*    mostrar con letras grandes un mensaje que diga Por favor acerca tu tarjeta al lector Y un loader*/}
                    <Typography
                        color="textPrimary"
                        variant="h3"
                        sx={{
                            textAlign: 'center',
                            mb: 3
                        }}
                    >
                        Para acceder por favor acerca tu tarjeta al lector
                    </Typography>
                    <Box sx={{width: '100%'}}>
                        <LinearProgress variant="buffer"
                                        value={progress}
                                        valueBuffer={buffer}/>
                    </Box>

                </Box>
            </Box>
        </>
    );
};

Page.getLayout = (page) => (
    <AccessLayout>
        {page}
    </AccessLayout>
);

export default Page;