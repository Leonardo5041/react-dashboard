import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Divider,
    TextField,
    Unstable_Grid2 as Grid,
    Alert,
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { BACKEND_URL } from 'src/utils/get-initials';

export const CustomerMembership = ({ user }) => {
    const router = useRouter();
    const [values, setValues] = useState({
        subscription: '',
        start_date: '',
        end_date: '',
        membership_id: '',
    });
    const [memberships, setMemberships] = useState([]);

    const getMemberships = async () => {
        try {
            const { data } = await axios.get(`${BACKEND_URL}membership`);
            if (data.length > 0) {
                setMemberships(data);
            }
        } catch (error) {
            setMemberships([]);
        }
    };

    useEffect(() => {
        getMemberships();
        setValues({
            subscription: user?.subscription?.id,
            start_date: user?.subscription?.start_date,
            end_date: user?.subscription?.end_date,
        });
        getSubscription(user?.subscription?.id);
    }, [user]);

    const getSubscription = async (id) => {
        try {
            if (!id) return setValues((prevState) => ({
                ...prevState,
                membership_id: '',
            }));
            const { data } = await axios.get(`${BACKEND_URL}subscription/${id}`);
            if (data) {
                setValues((prevState) => ({
                    ...prevState,
                    membership_id: data?.membership?.id,
                }));
            }
        } catch (error) {
            setValues((prevState) => ({
                ...prevState,
                membership_id: '',
            }));
        }
    }


    const handleChange = (event) => {
        setValues({
            ...values,
            [event.target.name]: event.target.value
        });
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        const request = {
            client_id: user.id,
            membership_id: values.membership_id,
        };
        if (!values.subscription) {
            const createSubscription = await axios.post(`${BACKEND_URL}subscription`, request);
            if (createSubscription.status === 201) {
                setValues((prevState) => ({
                    ...prevState,
                    subscription: createSubscription.data.id,
                    start_date: createSubscription.data.start_date,
                    end_date: createSubscription.data.end_date,
                    membership_id: createSubscription.data.membership.id,
                }));
            }
        }
        else {
            const updateSubscription = await axios.patch(`${BACKEND_URL}subscription/${values.subscription}`, request);
            if (updateSubscription.status === 200) router.reload();

        }
    };

    const getStatusSubscription = (endDate) => {
        const date = new Date(endDate);
        return date > new Date();
    };

    return (
        <form
            autoComplete="off"
            noValidate
            onSubmit={handleSubmit}
        >
            <Card>
                <CardHeader
                    subheader="Actualizar Membresia del Cliente"
                    title="Membresia"
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
                                    label="Seleccionar Membresia"
                                    name="membership_id"
                                    onChange={handleChange}
                                    required
                                    select
                                    SelectProps={{ native: true }}
                                    value={values.membership_id || 'Seleccionar Membresia'}
                                >
                                    {memberships.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.description}
                                        </option>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid
                                xs={12}
                                md={6}
                            >
                                <TextField
                                    fullWidth
                                    label="Fecha de Inicio"
                                    name="start_date"
                                    disabled
                                    onChange={handleChange}
                                    type="text"
                                    value={(values.start_date) ? format(new Date(values?.start_date), 'dd-MMM-yyyy') : '' || ''}
                                />
                            </Grid>
                            <Grid
                                xs={12}
                                md={6}
                            >
                                <TextField
                                    fullWidth
                                    label="Fecha de Terminacion"
                                    name="end_date"
                                    disabled
                                    onChange={handleChange}
                                    type="text"
                                    //format date
                                    value={(values.end_date) ? format(new Date(values?.end_date), 'dd-MMM-yyyy') : '' || ''}
                                />
                            </Grid>
                            <Grid
                                xs={12}
                                md={6}
                            >
                                {
                                    (!values.subscription) ? (
                                        <Alert
                                            color="error"
                                            severity="error"
                                        >
                                            <div>
                                                El cliente no cuenta con una <b>membresia</b> activa.
                                            </div>
                                        </Alert>
                                    ) : (!getStatusSubscription(values.end_date)) ? (
                                        <Alert
                                            color="error"
                                            severity="error"
                                        >
                                            <div>
                                                La <b>membresia</b> del cliente ha expirado.
                                            </div>
                                        </Alert>
                                    ) : (
                                        <Alert
                                            color="success"
                                            severity="success"
                                        >
                                            <div>
                                                El cliente cuenta con una <b>membresia</b> activa.
                                            </div>
                                        </Alert>
                                    )
                                }
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <Button variant="contained"
                            color='success'
                            onClick={handleSubmit}
                        >
                            Actualizar subscripcion
                        </Button>
                </CardActions>
            </Card>
        </form>
    );
};
