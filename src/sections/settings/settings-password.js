import { useCallback, useState } from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  TextField
} from '@mui/material';
import api from 'src/utils/api';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'next/router';
import { BACKEND_URL } from 'src/utils/get-initials';
import Swal from 'sweetalert2';

export const SettingsPassword = () => {
  const auth = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({
    password: '',
    confirm: ''
  });


  const handleSignOut = useCallback(
    () => {
      auth.signOut();
      localStorage.removeItem('token');
      router.push('/auth/login');
    },
    [auth, router]
  );

  const handleChange = useCallback(
    (event) => {
      setValues((prevState) => ({
        ...prevState,
        [event.target.name]: event.target.value
      }));
    },
    []
  );

  const handleSubmit = async () => {
    if (values.password !== values.confirm) {
      await Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Las contraseñas no coinciden por favor intente de nuevo',
      })
      return;
    }
    try {
      const updatedPassword = await api.put('users/update-password', { password: values.confirm });
      if (updatedPassword.status === 200) {
        await Swal.fire({
          position: 'center-end',
          icon: 'success',
          title: 'Contraseña actualizada correctamente',
          showConfirmButton: false,
          timer: 1500
        });
        handleSignOut();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader
          subheader="Actualizar contraseña"
          title="Contraseña"
        />
        <Divider />
        <CardContent>
          <Stack
            spacing={3}
            sx={{ maxWidth: 400 }}
          >
            <TextField
              fullWidth
              label="Nueva Contraseña"
              name="password"
              onChange={handleChange}
              type="password"
              value={values.password}
            />
            <TextField
              fullWidth
              label="Confirmar Contraseña"
              name="confirm"
              onChange={handleChange}
              type="password"
              value={values.confirm}
            />
          </Stack>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained"
            onClick={handleSubmit}>
            Actualizar
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
