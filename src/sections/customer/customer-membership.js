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
import axios from 'axios';
import {useRouter} from 'next/router';
import {BACKEND_URL} from 'src/utils/get-initials';
import {DatePicker} from '@mui/x-date-pickers';
import * as moment from 'moment';

export const CustomerMembership = ({user}) => {
    const router = useRouter();
    const [values, setValues] = useState({
        subscription: '',
        membership_id: '',
        end_date: '',
        price: ''
    });
    const [startDate, setStartDate] = useState(new Date(user?.subscription?.start_date));
    const [endDate, setEndDate] = useState(new Date(user?.subscription?.end_date));
    const [memberships, setMemberships] = useState([]);

    const getMemberships = async () => {
        try {
            const {data} = await axios.get(`${BACKEND_URL}membership`);
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
        let endDate = moment(user?.subscription?.end_date).toDate();
        setEndDate(endDate);
        setStartDate(moment(user?.subscription?.start_date).toDate());
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
            const {data} = await axios.get(`${BACKEND_URL}subscription/${id}`);
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
        setStartDate(moment().toDate());
        const endDateNumber = moment().add(selectedMembership?.duration, 'days').toDate();
        setEndDate(new Date(endDateNumber));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const request = {
            client_id: user.id,
            membership_id: values.membership_id,
            start_date: startDate,
            end_date: endDate
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
                    price: createSubscription.data.membership.price
                }));
            }
        } else {
            const updateSubscription = await axios.patch(`${BACKEND_URL}subscription/${values.subscription}`,
                request);
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
        setStartDate(newValue);
        const selectedMembership = memberships.find((membership) => membership.id
            === values.membership_id);
        const endDateNumber = moment(newValue).add(selectedMembership?.duration, 'days').toDate();
        setEndDate(endDateNumber);
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
                <CardActions sx={{justifyContent: 'flex-end'}}>
                    <Button variant="contained"
                            color="success"
                            onClick={handleSubmit}
                    >
                        Actualizar subscripcion
                    </Button>
                </CardActions>
            </Card>
        </form>
    );
};
