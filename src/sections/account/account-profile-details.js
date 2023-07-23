import { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Unstable_Grid2 as Grid
} from '@mui/material';
import { useAuth } from 'src/hooks/use-auth';
import { BACKEND_URL } from 'src/utils/get-initials';
import axios from 'axios';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';

export const AccountProfileDetails = () => {
  const user = useAuth().user;
  const router = useRouter();
  const [values, setValues] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

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
    const request = {
      name: values.name,
    }
    try{
      const updatedAdmin = await axios.patch(`${BACKEND_URL}users/update`, request, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if(updatedAdmin.status === 200){
        await Swal.fire({
          position: 'center-end',
          icon: 'success',
          title: 'Perfil actualizado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
        router.reload();
      }

    }catch(error){
      console.log(error);
    }

  }

  return (
    <form
      autoComplete="off"
      noValidate
      onSubmit={handleSubmit}
    >
      <Card>
        <CardHeader
          subheader="La información puede ser editada"
          title="Perfil"
        />
        <CardContent sx={{ pt: 0 }}>
          <Box sx={{ m: -1.5 }}>
            <Grid
              container
              spacing={3}
            >
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Nombre"
                  name="name"
                  onChange={handleChange}
                  required
                  value={values.name}
                />
              </Grid>
              <Grid
                xs={12}
                md={6}
              >
                <TextField
                  fullWidth
                  label="Correo Electronico"
                  name="email"
                  onChange={handleChange}
                  disabled
                  value={values.email}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained"
            onClick={handleSubmit}>
            Guardar Cambios
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
