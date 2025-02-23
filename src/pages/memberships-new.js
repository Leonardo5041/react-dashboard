import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import axios from 'axios';
import { BACKEND_URL } from 'src/utils/get-initials';

const Page = () => {
    const router = useRouter();

    const registerMembership = async (data) => {
        const { name, description, price, duration } = data;
        const request = {
            name: name.trim(),
            description: description.trim(),
            price,
            duration
        }
        request.price = parseFloat(request.price);
        request.duration = parseInt(request.duration);
        try {
            const { data, status } = await axios.post(`${BACKEND_URL}membership`, request);
            if (status === 201) {
                router.push('/companies');
            } else {
                console.error(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const daysToHours = (days) => {
        return days * 24;
    }


    const formik = useFormik({
        initialValues: {
            email: '',
            name: '',
            phone: '',
            submit: null
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
                .min(1)
                .max(1000000)
                .required('Precio es requerido'),
            duration: Yup
                .number()
                .min(1)
                .max(365)
                .required('La duración es requerida y debe ser en dias')
        }),
        onSubmit: async (values, helpers) => {
            try {
                await registerMembership(values);
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
                    Registrar Membresia | Pitbulls Gym
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
                                Registrar Nueva Membresia
                            </Typography>
                        </Stack>
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
