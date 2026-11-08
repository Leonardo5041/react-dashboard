import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import api from 'src/utils/api';
import {
  MENSAJE_CELULAR_INVALIDO,
  PROPS_INPUT_CELULAR,
  celularValido,
  mensajeErrorApi,
  normalizarCelular,
  soloDigitosCelular
} from 'src/utils/phone';

const Page = () => {
  const router = useRouter();

  const registerClient = async (data) => {
    const { email, name, phone, sms_opt_in } = data;
    const celular = normalizarCelular(phone);
    const request = {
      email: (email !== '') ? email.trim() : null,
      name: name.trim(),
      phone: celular ? celular : null,
      sms_opt_in: Boolean(celular) && sms_opt_in
    };
    // Los errores (p. ej. celular inválido) llegan al onSubmit para mostrarse.
    const { status } = await api.post('clients', request);
    if (status === 201) {
      router.push('/customers');
    }
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      name: '',
      phone: '',
      sms_opt_in: false,
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
        .test('celular', MENSAJE_CELULAR_INVALIDO, (v) => normalizarCelular(v) !== null)
    }),
    onSubmit: async (values, helpers) => {
      try {
        await registerClient(values);
      } catch (err) {
        helpers.setStatus({ success: false });
        helpers.setErrors({ submit: mensajeErrorApi(err, err.message) });
        helpers.setSubmitting(false);
      }
    }
  });

  const tieneCelular = celularValido(formik.values.phone);

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
                  helperText={(formik.touched.phone && formik.errors.phone)
                    || 'Opcional. Necesario para recordatorios por SMS'}
                  label="Celular (10 dígitos)"
                  name="phone"
                  onBlur={formik.handleBlur}
                  onChange={(e) => {
                    const digitos = soloDigitosCelular(e.target.value);
                    formik.setFieldValue('phone', digitos);
                    if (!celularValido(digitos)) formik.setFieldValue('sms_opt_in', false);
                  }}
                  type="tel"
                  inputProps={PROPS_INPUT_CELULAR}
                  value={formik.values.phone}
                />
                <FormControlLabel
                  control={(
                    <Checkbox
                      name="sms_opt_in"
                      checked={formik.values.sms_opt_in}
                      onChange={formik.handleChange}
                      disabled={!tieneCelular}
                    />
                  )}
                  label="Acepta recibir recordatorios de pago por SMS"
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
                disabled={formik.isSubmitting}
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
