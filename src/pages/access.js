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
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;

const Page = () => {
    const socket = useRef(null);
    const reconnectTimer = useRef(null);
    const attempt = useRef(0);
    const mounted = useRef(true);
    const [connected, setConnected] = useState(false);
    const [progress, setProgress] = useState(0);
    const [buffer, setBuffer] = useState(10);

    const progressRef = useRef(() => {});

    useEffect(() => {
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
    });

    useEffect(() => {
        mounted.current = true;

        const connect = () => {
            if (!mounted.current) return;
            const ws = new WebSocket(SOCKET_URL);
            socket.current = ws;

            ws.onopen = () => {
                if (!mounted.current) return;
                attempt.current = 0;
                setConnected(true);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event?.data);
                if (data?.access !== undefined && data?.message) {
                    welcomeAlert({ access: data?.access, message: data?.message });
                }
            };

            ws.onclose = () => {
                if (!mounted.current) return;
                setConnected(false);
                const delay = Math.min(RECONNECT_BASE_MS * 2 ** attempt.current, RECONNECT_MAX_MS);
                attempt.current += 1;
                reconnectTimer.current = setTimeout(connect, delay);
            };

            ws.onerror = () => ws.close();
        };

        connect();

        const timer = setInterval(() => progressRef.current(), 500);

        return () => {
            mounted.current = false;
            clearTimeout(reconnectTimer.current);
            clearInterval(timer);
            socket.current?.close();
        };
    }, []);


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
                        sx={{ textAlign: 'center', mb: 3 }}
                    >
                        Para acceder por favor acerca tu tarjeta al lector
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                        <LinearProgress
                            variant={connected ? 'buffer' : 'indeterminate'}
                            value={connected ? progress : undefined}
                            valueBuffer={connected ? buffer : undefined}
                            color={connected ? 'primary' : 'warning'}
                        />
                    </Box>
                    {!connected && (
                        <Typography
                            variant="caption"
                            color="warning.main"
                            sx={{ display: 'block', textAlign: 'center', mt: 1 }}
                        >
                            Reconectando…
                        </Typography>
                    )}

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