import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Box, Button, Divider, IconButton, InputAdornment, Snackbar, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useAuth } from 'src/hooks/use-auth';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import Swal from 'sweetalert2';
import axios from 'axios';
import api from 'src/utils/api';

const Page = () => {
  const router = useRouter();
  const auth = useAuth();
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      name: '',
      password: '',
      submit: null
    },
    validationSchema: Yup.object({
      email: Yup
        .string()
        .email('El correo electrónico debe ser una dirección de correo electrónico válida')
        .max(255)
        .required('Correo electrónico es requerido'),
      name: Yup
        .string()
        .max(255)
        .required('Nombre es requerido'),
      password: Yup
        .string()
        .max(255)
        .required('Contraseña es requerida')
    }),
    onSubmit: async (values, helpers) => {
      try {
        await auth.signUp(values.email, values.name, values.password);
        await Swal.fire({
          title: 'Éxito',
          text: 'El usuario ha sido registrado',
          icon: 'success',
          confirmButtonText: 'Ok'
        });
        router.push('/');
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message = err.response?.data?.error || err.response?.data?.message || 'Error al registrar';
          await Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'Ok'
          });
          helpers.setStatus({ success: false });
          helpers.setErrors({ submit: message });
          helpers.setSubmitting(false);
        } else {
          helpers.setStatus({ success: false });
          helpers.setErrors({ submit: err.message });
          helpers.setSubmitting(false);
        }
      }
    }
  });

  const handleGenerateInvite = async () => {
    setGeneratingLink(true);
    try {
      const { data } = await api.post('users/invite');
      const link = `${window.location.origin}/auth/invite?token=${data.token}`;
      setInviteLink(link);
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el link de invitación',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
  };

  return (
    <>
      <Head>
        <title>Registrar Usuario | Pitbulls Gym</title>
      </Head>
      <Box
        sx={{
          flex: '1 1 auto',
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box sx={{ maxWidth: 550, px: 3, py: '80px', width: '100%' }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h4">Registrar Usuario</Typography>
            <Typography color="text.secondary" variant="body2">
              Crea una cuenta directamente o genera un link de invitación para cajeros.
            </Typography>
          </Stack>

          <form noValidate onSubmit={formik.handleSubmit}>
            <Stack spacing={3}>
              <TextField
                error={!!(formik.touched.name && formik.errors.name)}
                fullWidth
                helperText={formik.touched.name && formik.errors.name}
                label="Nombre"
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
              fullWidth
              size="large"
              sx={{ mt: 3 }}
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
            >
              Guardar Nuevo Usuario
            </Button>
          </form>

          <Divider sx={{ my: 4 }}>
            <Typography color="text.secondary" variant="body2">o</Typography>
          </Divider>

          <Stack spacing={2}>
            <Typography variant="subtitle1">Link de invitación para cajero</Typography>
            <Typography color="text.secondary" variant="body2">
              Genera un link que expira en 72 horas. El cajero lo usa para crear su propia contraseña.
            </Typography>
            <Button
              fullWidth
              size="large"
              variant="outlined"
              onClick={handleGenerateInvite}
              disabled={generatingLink}
            >
              {generatingLink ? 'Generando...' : 'Generar link de invitación'}
            </Button>
            {inviteLink && (
              <TextField
                fullWidth
                label="Link de invitación"
                value={inviteLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copied ? 'Copiado' : 'Copiar'}>
                        <IconButton onClick={handleCopy} edge="end">
                          <span style={{ fontSize: 14 }}>📋</span>
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
            )}
          </Stack>
        </Box>
      </Box>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Link copiado al portapapeles"
      />
    </>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
