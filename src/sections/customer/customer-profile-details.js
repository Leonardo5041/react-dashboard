import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Checkbox,
    Divider,
    FormControlLabel,
    TextField,
    Unstable_Grid2 as Grid
} from '@mui/material';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { confirmAlert } from 'src/utils/get-initials';
import api from 'src/utils/api';
import { useAuthContext } from 'src/contexts/auth-context';
import {
    MENSAJE_CELULAR_INVALIDO,
    celularValido,
    mensajeErrorApi,
    normalizarCelular
} from 'src/utils/phone';

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
    const { user: authUser } = useAuthContext();
    const isAdmin = authUser?.role === 'admin';
    const [values, setValues] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [active, setActive] = useState(user?.active);
    const [smsOptIn, setSmsOptIn] = useState(Boolean(user?.sms_opt_in));

    useEffect(() => {
        setValues({
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
        });
        setActive(user?.active)
        setSmsOptIn(Boolean(user?.sms_opt_in));
    }, [user]);

    const handleChange = (event) => {
        setValues({
            ...values,
            [event.target.name]: event.target.value
        });
        // Sin celular válido no se pueden aceptar SMS.
        if (event.target.name === 'phone' && !celularValido(event.target.value)) {
            setSmsOptIn(false);
        }
    };

    const celularNormalizado = normalizarCelular(values.phone);
    const celularConError = celularNormalizado === null;
    const tieneCelular = celularValido(values.phone);

    const handleActiveChange = useCallback(
      () => {
        setActive(!active)
      },
      [active]
    );



    const handleSubmit = async (event) => {
        event.preventDefault();
        if (celularConError) {
            Swal.fire({ icon: 'warning', title: 'Celular inválido', text: MENSAJE_CELULAR_INVALIDO });
            return;
        }
        const request = {
            name: values.name,
            email: values.email,
            // null = no se toca; '' = se borra; si no, 10 dígitos
            phone: values.phone == null ? null : celularNormalizado,
            active: active,
            sms_opt_in: tieneCelular && smsOptIn
        };
        try {
            const { status } = await api.patch(`clients/${user.id}`, request);
            if (status === 200) router.reload();
        }
        catch (error) {
            Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: mensajeErrorApi(error) });
        }
    }

    const handleDelete = async (event) => {
        event.preventDefault();
        try {
            const confirmDelete = await confirmAlert('¿Estas seguro de eliminar este cliente?');
            if (confirmDelete.isConfirmed) {
                const { data } = await api.delete(`clients/${user.id}`);
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
                                    label="Celular (10 dígitos)"
                                    name="phone"
                                    onChange={handleChange}
                                    type="tel"
                                    inputProps={{ inputMode: 'tel' }}
                                    error={celularConError}
                                    helperText={celularConError ? MENSAJE_CELULAR_INVALIDO : 'Necesario para recordatorios por SMS'}
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
                            <Grid xs={12}>
                                <FormControlLabel
                                    control={(
                                        <Checkbox
                                            checked={tieneCelular && smsOptIn}
                                            onChange={(e) => setSmsOptIn(e.target.checked)}
                                            disabled={!tieneCelular}
                                        />
                                    )}
                                    label="Acepta recibir recordatorios de pago por SMS"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                    {isAdmin && (
                        <Button
                            color="error"
                            variant='contained'
                            onClick={handleDelete}
                        >
                            Eliminar
                        </Button>
                    )}
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
