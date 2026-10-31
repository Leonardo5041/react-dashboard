import Head from 'next/head';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, FormControlLabel, LinearProgress, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import api from 'src/utils/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { confirmAlert } from 'src/utils/get-initials';
import { useQuery } from '@tanstack/react-query';

const fetchProduct = async (id) => {
    try {
        const { data, status } = await api.get(`productos/${id}`);
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
    const { isLoading, isError, data } = useQuery(['product', pid], async () => await fetchProduct(pid), {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 60 * 24 * 1
    });

    const [isMembresia, setIsMembresia] = useState(false);
    const [memberships, setMemberships] = useState([]);

    useEffect(() => {
        api.get('memberships')
            .then(({ data }) => setMemberships(data || []))
            .catch(() => setMemberships([]));
    }, []);

    const updateProduct = async (values) => {
        const { sku, nombre, precio, minimo, membership_id } = values;
        const productRequest = {
            sku: sku.trim(),
            nombre: nombre.trim(),
            precio: parseFloat(precio),
            minimo: parseInt(minimo),
            ...(isMembresia && membership_id ? { membership_id } : { membership_id: null })
        };
        try {
            const { status } = await api.put(`productos/${pid}`, productRequest);
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
            const { data, status } = await api.delete(`productos/${pid}`);
            if (status === 200 || status === 204) {
                await router.push('/products');
            } else {
                console.error(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formik = useFormik({
        initialValues: {
            sku: '',
            nombre: '',
            precio: 0,
            stock: 0,
            minimo: 0,
            membership_id: ''
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

    useEffect(() => {
        if (!data) return;
        formik.setValues({
            sku: data?.sku ?? '',
            nombre: data?.nombre ?? '',
            precio: data?.precio ?? 0,
            stock: data?.stock ?? 0,
            minimo: data?.minimo ?? 0,
            membership_id: data?.membership_id ?? ''
        });
        if (data?.membership_id) {
            setIsMembresia(true);
        }
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

                        {isLoading && <LinearProgress />}
                        {isError && (
                            <Typography variant="h4">
                                Error al cargar el producto
                            </Typography>
                        )}
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
                                    error={!!(formik.touched.nombre && formik.errors.nombre)}
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
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isMembresia}
                                            onChange={(e) => {
                                                setIsMembresia(e.target.checked);
                                                if (!e.target.checked) {
                                                    formik.setFieldValue('membership_id', '');
                                                }
                                            }}
                                        />
                                    }
                                    label="¿Es producto de membresía?"
                                />
                                {isMembresia && (
                                    <TextField
                                        select
                                        fullWidth
                                        label="Membresía vinculada"
                                        name="membership_id"
                                        value={formik.values.membership_id}
                                        onChange={formik.handleChange}
                                    >
                                        <MenuItem value="">Seleccionar</MenuItem>
                                        {memberships.map((m) => (
                                            <MenuItem key={m.id} value={m.id}>
                                                {m.description}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
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
                                color="error"
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
