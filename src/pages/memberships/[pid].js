import Head from 'next/head';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {Box, Button, LinearProgress, Stack, TextField, Typography} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import axios from 'axios';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { BACKEND_URL, confirmAlert } from 'src/utils/get-initials';
import {useQuery} from "@tanstack/react-query";

const fetchMembership = async (id) => {
    try {
        const { data, status } = await axios.get(`${BACKEND_URL}membership/${id}`);
        if (status === 200) {
            return data;
        } else {
            return null;
        }
    } catch (err) {
        throw new Error(err);
    }
}
const Page = () => {
    const router = useRouter();
    const { pid } = router.query;
    const {isLoading, isError, data} = useQuery(['membership'], async () => await fetchMembership(pid), {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 60 * 24 * 1 // 1 day
    });

    const updateMembership = async (data) => {
        const { name, description, price, duration } = data;
        const request = {
            name: name.trim(),
            description: description.trim(),
            price,
            duration
        }
        request.price = parseFloat(request.price);
        request.duration = daysToHours(parseInt(request.duration));
        try {
            const { data, status } = await axios.patch(`${BACKEND_URL}membership/${pid}`, request);
            if (status === 200) {
                await router.push('/companies');
            } else {
                console.error(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteMembership = async () => {
      const confirmResponse = await confirmAlert('¿Estas seguro de eliminar esta membresia?');
        if (!confirmResponse.isConfirmed) return;
        try {
            const { data, status } = await axios.delete(`${BACKEND_URL}membership/${pid}`);
            if (status === 200) {
                await router.push('/companies');
            } else {
                console.error(data);
            }
        } catch (err) {
            console.error(err);
        }
    }


    const daysToHours = (days) => {
        return days * 24;
    }

    const hoursToDays = (hours) => {
        return parseInt(hours / 24);
    }

    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            price: 0,
            duration: 0
        },
        validationSchema: Yup.object({
            description: Yup
                .string()
                .max(255)
                .required('Descripción es requerida'),
            name: Yup
                .string()
                .max(255)
                .required('Nombre es requerido'),
            price: Yup
                .number()
                .min(1, 'Precio debe ser mayor a 0')
                .max(1000000)
                .required('Precio es requerido'),
            duration: Yup
                .number()
                .min(1, 'Duración debe ser mayor a 0')
                .max(365)
                .required('La duración es requerida y debe ser en dias')
        }),
        onSubmit: async (values, helpers) => {
            try {
                await updateMembership(values);
            } catch (err) {
                helpers.setStatus({ success: false });
                helpers.setErrors({ submit: err.message });
                helpers.setSubmitting(false);
            }
        }
    });

    const initialValues = {
        name: (data) ? data?.name : '',
        description: (data) ? data?.description : '',
        price: (data) ? data?.price : 0,
        duration: (data) ? hoursToDays(data?.duration) : 0
    }
    useEffect(() => {
        formik.setValues(initialValues);
    }, [data]);

    return (
        <>
            <Head>
                <title>
                    Editar Membresia | Pitbulls Gym
                </title>
            </Head>
            <Box
                sx={{
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
                    <div>
                        <Stack
                            spacing={1}
                            sx={{ mb: 3 }}
                        >
                            <Typography variant="h4">
                                Editar Membresia
                            </Typography>
                        </Stack>

                        {
                            isLoading && (
                                <LinearProgress />
                            )
                        }
                        {
                            isError && (
                                <Typography variant="h4">
                                    Error al cargar la membresia
                                </Typography>
                            )
                        }
                        <form
                            noValidate
                            onSubmit={formik.handleSubmit}
                        >
                            <Stack spacing={3}>
                                <TextField
                                    error={!!(formik.touched.name && formik.errors.name)}
                                    fullWidth
                                    helperText={formik.touched.name && formik.errors.name}
                                    label="Nombre de la membresia"
                                    name="name"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    value={formik.values.name}
                                />
                                <TextField
                                    error={!!(formik.touched.description && formik.errors.description)}
                                    fullWidth
                                    helperText={formik.touched.description && formik.errors.description}
                                    label="Descripción de la membresia"
                                    name="description"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    type="textarea"
                                    value={formik.values.description}
                                />
                                <TextField
                                    error={!!(formik.touched.price && formik.errors.price)}
                                    fullWidth
                                    helperText={formik.touched.price && formik.errors.price}
                                    label="Precio de la membresia"
                                    name="price"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    type="number"
                                    value={formik.values.price}
                                />
                                <TextField
                                    error={!!(formik.touched.duration && formik.errors.duration)}
                                    fullWidth
                                    helperText={formik.touched.duration && formik.errors.duration}
                                    label="Duración de la membresia (en días)"
                                    name="duration"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    type="number"
                                    value={formik.values.duration}
                                />
                            </Stack>
                            {formik.errors.submit && (
                                <Typography
                                    color="error"
                                    sx={{ mt: 3 }}
                                    variant="body2"
                                >
                                    {formik.errors.submit}
                                </Typography>
                            )}
                            <Button
                                fullWidth
                                size="large"
                                sx={{ mt: 3 }}
                                type="submit"
                                variant="contained"
                            >
                                Guardar
                            </Button>
                            <Button
                                fullWidth
                                size="small"
                                sx={{ mt: 3 }}
                                onClick={() => deleteMembership()}
                                color='error'
                                variant="contained"
                            >
                                Eliminar Membresia
                            </Button>
                        </form>
                    </div>
                </Box>
            </Box>
        </>
    );
};

Page.getLayout = (page) => (
    <DashboardLayout>
        {page}
    </DashboardLayout>
);

export default Page;
