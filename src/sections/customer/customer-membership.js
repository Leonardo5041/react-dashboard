import {useState, useEffect} from 'react';
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
    Alert
} from '@mui/material';
import api from 'src/utils/api';
import {useRouter} from 'next/router';
import {BACKEND_URL} from 'src/utils/get-initials';
import {DatePicker} from '@mui/x-date-pickers';
import moment from 'moment-timezone';
import { toMXWallDate, fromMXWallDate } from 'src/utils/date-mx';

export const CustomerMembership = ({user, readOnly = false}) => {
    const router = useRouter();
    const [values, setValues] = useState({
        subscription: '',
        membership_id: '',
        end_date: '',
        price: ''
    });
    // startDate/endDate son "fechas de pared MX" (ver src/utils/date-mx.js):
    // el DatePicker siempre muestra el día de México aunque la PC tenga otra zona.
    const [startDate, setStartDate] = useState(toMXWallDate(user?.subscription?.start_date));
    const [endDate, setEndDate] = useState(toMXWallDate(user?.subscription?.end_date));
    const [memberships, setMemberships] = useState([]);

    const getMemberships = async () => {
        try {
            const {data} = await api.get('memberships');
            if (data.length > 0) {
                const memberships = [{id: '123', description: 'Seleccionar'}, ...data];
                setMemberships(memberships);
            }
        } catch (error) {
            setMemberships([]);
        }
    };

    useEffect(() => {
        getMemberships();
        setValues({
            subscription: user?.subscription?.id,
            end_date: user?.subscription?.end_date
        });
        setEndDate(toMXWallDate(user?.subscription?.end_date));
        setStartDate(toMXWallDate(user?.subscription?.start_date));
        getSubscription(user?.subscription?.id);
    }, [user]);

    const getSubscription = async (id) => {
        try {
            if (!id) {
                return setValues((prevState) => ({
                    ...prevState,
                    membership_id: ''
                }));
            }
            const {data} = await api.get(`subscriptions/${id}`);
            if (data) {
                setValues((prevState) => ({
                    ...prevState,
                    membership_id: data?.membership?.id,
                    price: data?.membership?.price
                }));
            }
        } catch (error) {
            setValues((prevState) => ({
                ...prevState,
                membership_id: ''
            }));
        }
    };

    const handleChange = (event) => {
        setValues({
            ...values,
            [event.target.name]: event.target.value
        });
        const selectedMembership = memberships.find((membership) => membership.id
            === event.target.value);
        const start = toMXWallDate(new Date());
        setStartDate(start);
        setEndDate(moment(start).add(selectedMembership?.duration, 'days').toDate());
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const request = {
            client_id: user.id,
            membership_id: values.membership_id,
            start_date: fromMXWallDate(startDate),
            end_date: fromMXWallDate(endDate)
        };
        if (!values.subscription) {
            const createSubscription = await api.post('subscriptions', request);
            if (createSubscription.status === 201) {
                setValues((prevState) => ({
                    ...prevState,
                    subscription: createSubscription.data.id,
                    start_date: createSubscription.data.start_date,
                    end_date: createSubscription.data.end_date,
                    membership_id: createSubscription.data.membership.id,
                    price: createSubscription.data.membership.price
                }));
            }
        } else {
            const updateSubscription = await api.patch(`subscriptions/${values.subscription}`, request);
            if (updateSubscription.status === 200) {
                router.reload();
            }

        }
    };

    const getStatusSubscription = (endDate) => {
        const date = new Date(endDate);
        return date > new Date();
    };

    const handleStartDateChange = (newValue) => {
        // newValue ya es "fecha de pared MX" (viene del DatePicker)
        setStartDate(newValue);
        if (!newValue) return;
        const selectedMembership = memberships.find((membership) => membership.id
            === values.membership_id);
        setEndDate(moment(newValue).add(selectedMembership?.duration, 'days').toDate());
    };
    return (
        <form
            autoComplete="off"
            noValidate
            onSubmit={readOnly ? (e) => e.preventDefault() : handleSubmit}
        >
            <Card>
                <CardHeader
                    subheader={readOnly ? 'Solo el administrador puede modificar la membresía' : 'Actualizar Membresia del Cliente'}
                    title="Membresia"
                />
                <CardContent sx={{pt: 0}}>
                    <Box sx={{m: -1.5}}>
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
                                    SelectProps={{native: true}}
                                    value={values.membership_id || '123'}
                                    disabled={readOnly}
                                >
                                    {
                                        memberships.map((option) => (
                                            <option
                                                disabled={option.id === '123'}
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

                                <DatePicker
                                    headerAlign={'center'}
                                    disableMaskedInput={true}
                                    label={'Fecha de Inicio (Opcional)'}
                                    onChange={(newValue) => handleStartDateChange(newValue)}
                                    value={startDate}
                                    timezone={'system'}
                                    inputFormat={'dd/MMM/yyyy'}
                                    disabled={readOnly}
                                    renderInput={(params) => <TextField variant={'outlined'} {...params} />}
                                />
                            </Grid>
                            <Grid
                                xs={12}
                                md={6}
                            >
                                <DatePicker
                                    disableMaskedInput={true}
                                    label={'Fecha de Fin'}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    value={endDate}
                                    disabled
                                    inputFormat={'dd/MMM/yyyy'}
                                    renderInput={(params) => <TextField variant={'outlined'} {...params} />}
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
                <Divider/>
                {!readOnly && (
                    <CardActions sx={{justifyContent: 'flex-end'}}>
                        <Button variant="contained"
                                color="success"
                                onClick={handleSubmit}
                        >
                            Actualizar subscripcion
                        </Button>
                    </CardActions>
                )}
            </Card>
        </form>
    );
};
