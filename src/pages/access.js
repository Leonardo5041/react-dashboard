import { useState } from 'react';
import Head from 'next/head';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Layout as AccessLayout } from 'src/layouts/access/layout';
import axios from 'axios';
import { BACKEND_URL } from 'src/utils/get-initials';
import Swal from 'sweetalert2';


const mapError = {
  'Invalid credentials': 'Correo o contraseña incorrectos',
  'User not found': 'El usuario no existe'
}

const welcomeAlert = ({access, message}) => {
  Swal.fire({
    position: 'top-end',
    icon: (access) ? 'success' : 'error',
    title: message,
    showConfirmButton: false,
    timer: 1500
  })
}
const Page = () => {
  const [method, setMethod] = useState('email');
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
        .max(7, 'Ingrese un token valido de 6 digitos')
        .required('Para acceder necesita un código de acceso')
    }),
    onSubmit: async (values, helpers) => {
      try {
        const response = await axios.post(`${BACKEND_URL}clients/access`, {
          client_number: values.client_number,
          token: values.token
        })
        const { data } = response;
        welcomeAlert({ access: data?.access, message: data?.message });
        formik.resetForm();
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message = mapError[err.response.data.message];
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
          <div>
            <Stack
              spacing={1}
              sx={{ mb: 3 }}
            >
              <Typography variant="h4">
                Ingresar Acceso
              </Typography>
              {/* <Typography
                color="text.secondary"
                variant="body2"
              >
                No tienes una cuenta?
                &nbsp;
                <Link
                  component={NextLink}
                  href="/auth/register"
                  underline="hover"
                  variant="subtitle2"
                >
                  Registrar
                </Link>
              </Typography> */}
            </Stack>
            {/* <Tabs
              onChange={handleMethodChange}
              sx={{ mb: 3 }}
              value={method}
            >
              <Tab
                label="Correo Electrónico"
                value="email"
              />
              <Tab
                label="Numero de Telefono"
                value="phoneNumber"
              />
            </Tabs> */}
            {method === 'email' && (
              <form
                noValidate
                onSubmit={formik.handleSubmit}
              >
                <Stack spacing={3}>
                  <TextField
                    error={!!(formik.touched.client_number && formik.errors.client_number)}
                    fullWidth
                    helperText={formik.touched.client_number && formik.errors.client_number}
                    label="Número de Cliente"
                    name="client_number"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="number"
                    value={formik.values.client_number}
                  />
                  <TextField
                    error={!!(formik.touched.token && formik.errors.token)}
                    fullWidth
                    helperText={formik.touched.token && formik.errors.token}
                    label="Token de Acceso"
                    name="token"
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    type="text"
                    value={formik.values.token}
                  />
                </Stack>
                {/* <FormHelperText sx={{ mt: 1 }}>
                  Optionally you can skip.
                </FormHelperText> */}
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
                  Ingresar
                </Button>
                {/* <Button
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  onClick={handleSkip}
                >
                  Skip authentication
                </Button> */}
                {/* <Alert
                  color="primary"
                  severity="info"
                  sx={{ mt: 3 }}
                >
                  <div>
                    You can use <b>demo@devias.io</b> and password <b>Password123!</b>
                  </div>
                </Alert> */}
              </form>
            )}
            {method === 'phoneNumber' && (
              <div>
                <Typography
                  sx={{ mb: 1 }}
                  variant="h6"
                >
                  No disponible por el momento
                </Typography>
                <Typography color="text.secondary">
                  Muy pronto podras Iniciar sesión con tu numero de telefono
                </Typography>
              </div>
            )}
          </div>
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
