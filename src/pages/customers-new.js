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

  const registerClient = async (data) => {
    const { email, name, phone } = data;
    const request = {
      email: (email !== '') ? email.trim() : null,
      name: name.trim(),
      phone: (phone !== '') ? phone.trim() : null,
    }
    try {
      const { data, status } = await axios.post(`${BACKEND_URL}clients`, request);
      if (status === 201) {
        router.push('/customers');
      } else {
        console.error(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      name: '',
      phone: '',
      submit: null
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .email('El correo electrónico debe ser una dirección de correo electrónico válida')
        .max(255),
      name: Yup
        .string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(155)
        .required('El nombre es requerido'),
      phone: Yup
        .string()
        .max(15, 'El número de teléfono debe tener maximo 15 caracteres')
    }),
    onSubmit: async (values, helpers) => {
      try {
        await registerClient(values);
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
          Registrar Cliente | Pitbulls Gym
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
                Registrar Nuevo Cliente
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
                  required
                  helperText={formik.touched.name && formik.errors.name}
                  label="Nombre y apellido"
                  name="name"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  value={formik.values.name}
                />
                <TextField
                  error={!!(formik.touched.phone && formik.errors.phone)}
                  fullWidth
                  helperText={formik.touched.phone && formik.errors.phone}
                  label="Telefono (Opcional)"
                  name="phone"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  type="text"
                  value={formik.values.password}
                />
                <TextField
                  error={!!(formik.touched.email && formik.errors.email)}
                  fullWidth
                  helperText={formik.touched.email && formik.errors.email}
                  label="Correo Electronico (Opcional)"
                  name="email"
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  type="email"
                  value={formik.values.email}
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
