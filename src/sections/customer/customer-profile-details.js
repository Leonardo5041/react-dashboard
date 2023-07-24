import { useState, useEffect, useCallback } from 'react';
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
import axios from 'axios';
import { useRouter } from 'next/router';
import { BACKEND_URL, confirmAlert } from 'src/utils/get-initials';

const states = [
    {
        value: true,
        label: 'Activo'
    },
    {
        value: false,
        label: 'Inactivo'
    }
];

export const CustomerProfileDetails = ({ user }) => {
    const router = useRouter();
    const [values, setValues] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [active, setActive] = useState(user?.active);

    useEffect(() => {
        setValues({
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
        });
        setActive(user?.active)
    }, [user]);

    const handleChange = (event) => {
        setValues({
            ...values,
            [event.target.name]: event.target.value
        });
    };

    const handleActiveChange = useCallback(
      () => {
        setActive(!active)
      },
      [active]
    );



    const handleSubmit = async (event) => {
        event.preventDefault();
        const request = {
            name: values.name,
            email: values.email,
            phone: values.phone,
            active: active
        };
        try {
            const { data } = await axios.patch(`${BACKEND_URL}clients/${user.id}`, request);
            if (data?.affected > 0) router.reload();
        }
        catch (error) {
            console.log(error);
        }
    }

    const handleDelete = async (event) => {
        event.preventDefault();
        try {
            const confirmDelete = await confirmAlert('¿Estas seguro de eliminar este cliente?');
            if (confirmDelete.isConfirmed) {
                const { data } = await axios.delete(`${BACKEND_URL}clients/${user.id}`);
                if (data?.affected > 0) router.push('/customers')
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    return (<>
        <form
            autoComplete="off"
            noValidate
            onSubmit={handleSubmit}
        >
            <Card>
                <CardHeader
                    subheader="Actualiza la información del cliente"
                    title="Detalles del cliente"
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
                                    
                                    value={values.name || ''}
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
                                    type="email"
                                    value={values.email || ''}
                                />
                            </Grid>
                            <Grid
                                xs={12}
                                md={6}
                            >
                                <TextField
                                    fullWidth
                                    label="Numero de Telefono"
                                    name="phone"
                                    onChange={handleChange}
                                    type="text"
                                    value={values.phone || ''}
                                />
                            </Grid>
                            <Grid
                                xs={12}
                                md={6}
                            >
                                <TextField
                                    fullWidth
                                    label="Seleccionar estado"
                                    name="active"
                                    onChange={handleActiveChange}
                                    
                                    select
                                    SelectProps={{ native: true }}
                                    value={active}
                                >
                                    {states.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <Button
                        color="error"
                        variant='contained'
                        onClick={handleDelete}
                    >
                        Eliminar
                    </Button>
                    <Button variant="contained"
                        onClick={handleSubmit}>
                        Actualizar Cliente
                    </Button>
                </CardActions>
            </Card>
        </form>
    </>

    );
};
