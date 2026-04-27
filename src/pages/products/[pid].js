import Head from 'next/head';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {Box, Button, LinearProgress, Stack, TextField, Typography} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import axios from 'axios';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { PRODUCTS_URL, confirmAlert } from 'src/utils/get-initials';
import {useQuery} from "@tanstack/react-query";

const fetchProduct = async (id) => {
    try {
        const { data, status } = await axios.get(`${PRODUCTS_URL}productos/${id}`);
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
    const {isLoading, isError, data} = useQuery(['product', pid], async () => await fetchProduct(pid), {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 60 * 24 * 1 // 1 day
    });

    const updateProduct = async (data) => {
        const { sku, nombre, precio, minimo } = data;
        const productRequest = {
            sku: sku.trim(),
            nombre: nombre.trim(),
            precio: parseFloat(precio),
            minimo: parseInt(minimo)
        };
        try {
            const { status } = await axios.put(`${PRODUCTS_URL}productos/${pid}`, productRequest);
            if (status === 200) {
                await router.push('/products');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteProduct = async () => {
      const confirmResponse = await confirmAlert('¿Estas seguro de eliminar este producto?');
        if (!confirmResponse.isConfirmed) return;
        try {
            const { data, status } = await axios.delete(`${PRODUCTS_URL}productos/${pid}`);
            if (status === 200 || status === 204) {
                await router.push('/products');
            } else {
                console.error(data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    const formik = useFormik({
        initialValues: {
            sku: '',
            nombre: '',
            precio: 0,
            stock: 0,
            minimo: 0
        },
        validationSchema: Yup.object({
            sku: Yup
                .string()
                .max(255)
                .required('SKU es requerido'),
            nombre: Yup
                .string()
                .max(255)
                .required('Nombre es requerido'),
            precio: Yup
                .number()
                .min(1, 'Precio debe ser mayor a 0')
                .max(1000000)
                .required('Precio es requerido'),
            minimo: Yup
                .number()
                .min(1, 'Stock mínimo debe ser mayor a 0')
                .max(10000)
        }),
        onSubmit: async (values, helpers) => {
            try {
                await updateProduct(values);
            } catch (err) {
                helpers.setStatus({ success: false });
                helpers.setErrors({ submit: err.message });
                helpers.setSubmitting(false);
            }
        }
    });

    const initialValues = {
        sku: (data) ? data?.sku : '',
        nombre: (data) ? data?.nombre : '',
        precio: (data) ? data?.precio : 0,
        stock: (data) ? data?.stock : 0,
        minimo: (data) ? data?.minimo : 0
    }
    useEffect(() => {
        formik.setValues(initialValues);
    }, [data]);

    return (
        <>
            <Head>
                <title>
                    Editar Producto | Pitbulls Gym
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
                                Editar Producto
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
                                    Error al cargar el producto
                                </Typography>
                            )
                        }
                        <form
                            noValidate
                            onSubmit={formik.handleSubmit}
                        >
                            <Stack spacing={3}>
                                <TextField
                                    error={!!(formik.touched.sku && formik.errors.sku)}
                                    fullWidth
                                    helperText={formik.touched.sku && formik.errors.sku}
                                    label="SKU del producto"
                                    name="sku"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    type="text"
                                    value={formik.values.sku}
                                    autoFocus
                                />
                                <TextField
                                    error={!!(formik.touched.name && formik.errors.name)}
                                    fullWidth
                                    helperText={formik.touched.nombre && formik.errors.nombre}
                                    label="Nombre del producto"
                                    name="nombre"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    value={formik.values.nombre}
                                />
                                
                                <TextField
                                    error={!!(formik.touched.precio && formik.errors.precio)}
                                    fullWidth
                                    helperText={formik.touched.precio && formik.errors.precio}
                                    label="Precio del producto"
                                    name="precio"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    type="number"
                                    value={formik.values.precio}
                                />
                                <TextField
                                    fullWidth
                                    label="Stock del producto"
                                    type="number"
                                    value={formik.values.stock}
                                    disabled
                                    helperText="El stock solo puede modificarse desde Inventario"
                                />
                                <TextField
                                    error={!!(formik.touched.minimo && formik.errors.minimo)}
                                    fullWidth
                                    helperText={formik.touched.minimo && formik.errors.minimo}
                                    label="Stock mínimo del producto (opcional)"
                                    name="minimo"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    type="number"
                                    value={formik.values.minimo}
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
                                onClick={() => deleteProduct()}
                                color='error'
                                variant="contained"
                            >
                                Eliminar Producto
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
