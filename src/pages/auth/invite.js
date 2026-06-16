import Head from 'next/head';
import { useRouter } from 'next/router';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Layout as AuthLayout } from 'src/layouts/auth/layout';
import Swal from 'sweetalert2';
import axios from 'axios';
import { BACKEND_URL } from 'src/utils/get-initials';

const Page = () => {
  const router = useRouter();
  const { token } = router.query;

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      submit: null
    },
    validationSchema: Yup.object({
      name: Yup
        .string()
        .max(255)
        .required('Nombre es requerido'),
      email: Yup
        .string()
        .email('Correo electrónico inválido')
        .max(255)
        .required('Correo electrónico es requerido'),
      password: Yup
        .string()
        .min(6, 'Mínimo 6 caracteres')
        .max(255)
        .required('Contraseña es requerida')
    }),
    onSubmit: async (values, helpers) => {
      if (!token) {
        helpers.setErrors({ submit: 'Link de invitación inválido o expirado.' });
        return;
      }
      try {
        await axios.post(`${BACKEND_URL}users/register-invite`, {
          token,
          name: values.name,
          email: values.email,
          password: values.password
        });
        await Swal.fire({
          title: '¡Listo!',
          text: 'Tu cuenta ha sido creada. Ya puedes iniciar sesión.',
          icon: 'success',
          confirmButtonText: 'Ir al login'
        });
        router.push('/auth/login');
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? (err.response?.data?.error || 'Error al registrar')
          : err.message;
        await Swal.fire({
          title: 'Error',
          text: message,
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: message });
        helpers.setSubmitting(false);
      }
    }
  });

  return (
    <>
      <Head>
        <title>Crear cuenta | Pitbulls Gym</title>
      </Head>
      <Box
        sx={{
          flex: '1 1 auto',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ maxWidth: 550, px: 3, py: '100px', width: '100%' }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h4">Crear tu cuenta</Typography>
            <Typography color="text.secondary" variant="body2">
              Completa tus datos para acceder al sistema de Pitbulls Gym.
            </Typography>
          </Stack>
          {!token && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              Link de invitación inválido o expirado. Solicita uno nuevo al administrador.
            </Typography>
          )}
          <form noValidate onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>
              <TextField
                error={!!(formik.touched.name && formik.errors.name)}
                fullWidth
                helperText={formik.touched.name && formik.errors.name}
                label="Nombre completo"
                name="name"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik.values.name}
              />
              <TextField
                error={!!(formik.touched.email && formik.errors.email)}
                fullWidth
                helperText={formik.touched.email && formik.errors.email}
                label="Correo electrónico"
                name="email"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                type="email"
                value={formik.values.email}
              />
              <TextField
                error={!!(formik.touched.password && formik.errors.password)}
                fullWidth
                helperText={formik.touched.password && formik.errors.password}
                label="Contraseña"
                name="password"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                type="password"
                value={formik.values.password}
              />
            </Stack>
            {formik.errors.submit && (
              <Typography color="error" sx={{ mt: 3 }} variant="body2">
                {formik.errors.submit}
              </Typography>
            )}
            <Button
              disabled={formik.isSubmitting || !token}
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              type="submit"
              variant="contained"
            >
              Crear cuenta
            </Button>
          </form>
        </Box>
      </Box>
    </>
  );
};

Page.getLayout = (page) => (
  <AuthLayout>
    {page}
  </AuthLayout>
);

export default Page;
