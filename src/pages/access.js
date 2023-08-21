import {useEffect, useRef, useState} from 'react';
import Head from 'next/head';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {
    Box,
    LinearProgress,
    Typography
} from '@mui/material';
import {Layout as AccessLayout} from 'src/layouts/access/layout';
import Swal from 'sweetalert2';
import {socket} from "../socket";


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
    const [progress, setProgress] = useState(0);
    const [buffer, setBuffer] = useState(10);

    const progressRef = useRef(() => {
    });
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
        const timer = setInterval(() => {
            progressRef.current();
        }, 500);

        return () => {
            clearInterval(timer);
        };
    }, []);

    //connect to socket server
    useEffect(() => {
        socket.on('connect', () => {
            console.log('connected to socket server');
        });
        socket.on('access', (data) => {
            welcomeAlert({access: data?.access, message: data?.message});
        });

        return () => {
            socket.off('access');
        }
    }, []);

    const formik = useFormik({
        initialValues: {
            client_number: 0,
            token: '',
            submit: null
        },
        validationSchema: Yup.object({
            client_number: Yup
                .string()
                .min(1, 'Ingrese un numero de cliente valido')
                .max(999)
                .required('Numero de cliente requerido'),
            token: Yup
                .string()
                .min(1, 'Ingrese un token valido')
                .max(10, 'Ingrese un token valido de 6 digitos')
                .required('Para acceder necesita un código de acceso')
        }),
        onSubmit: async (values) => {
            socket.emit('access', {
                client_number: values.client_number,
                token: values.token
            });

            socket.on('access', (data) => {
                console.log(data);
                welcomeAlert({access: data?.access, message: data?.message});
                formik.resetForm();
            });
        }
    });


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
