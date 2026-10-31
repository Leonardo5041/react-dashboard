import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import api from 'src/utils/api';
import { useState, useEffect } from 'react';

const Page = () => {
    const router = useRouter();
    const [isMembresia, setIsMembresia] = useState(false);
    const [memberships, setMemberships] = useState([]);

    useEffect(() => {
        api.get('memberships')
            .then(({ data }) => setMemberships(data || []))
            .catch(() => setMemberships([]));
    }, []);

    const registerProduct = async (data) => {
        const { sku, nombre, precio, stock, minimo, membership_id } = data;
        const request = {
            sku: sku.trim(),
            nombre: nombre.trim(),
            precio: parseFloat(precio),
            stock: parseInt(stock),
            minimo: parseInt(minimo),
            ...(isMembresia && membership_id ? { membership_id } : {})
        };
        try {
            const { data, status } = await api.post('productos', request);
            if (status === 201) {
                router.push('/products');
            } else {
                console.error(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formik = useFormik({
        initialValues: {
            nombre: '',
            precio: 0,
            sku: '',
            stock: 0,
            minimo: 0,
            membership_id: '',
            submit: null
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
                .min(1, 'Precio debe ser al menos 1')
                .max(1000000)
                .required('Precio es requerido'),
            stock: Yup
                .number()
                .min(0)
                .max(1000000)
                .required('Stock es requerido'),
            minimo: Yup
                .number()
                .min(1)
                .max(1000000),
            membership_id: Yup
                .string()
                .when('$isMembresia', {
                    is: true,
                    then: (schema) => schema.required('Selecciona una membresía')
                })
        }),
        onSubmit: async (values, helpers) => {
            try {
                await registerProduct(values);
            } catch (err) {
                helpers.setStatus({ success: false });
                helpers.setErrors({ submit: err.message });
                helpers.setSubmitting(false);
            }
        }
    });

    return (
        <>
            <Head>
                <title>
                    Registrar Producto | Pitbulls Gym
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
                    <div>
                        <Stack
                            spacing={1}
                            sx={{ mb: 3 }}
                        >
                            <Typography variant="h4">
                                Registrar Nuevo Producto
                            </Typography>
                        </Stack>
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
                                    error={!!(formik.touched.stock && formik.errors.stock)}
                                    fullWidth
                                    helperText={formik.touched.stock && formik.errors.stock}
                                    label="Stock del producto"
                                    name="stock"
                                    onBlur={formik.handleBlur}
                                    onChange={formik.handleChange}
                                    type="number"
                                    value={formik.values.stock}
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
                                        error={!!(formik.touched.membership_id && formik.errors.membership_id)}
                                        helperText={formik.touched.membership_id && formik.errors.membership_id}
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
