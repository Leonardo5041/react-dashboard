import {useCallback, useMemo, useState} from 'react';
import Head from 'next/head';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import {
    Box,
    Button,
    Card,
    Container,
    InputAdornment,
    LinearProgress,
    OutlinedInput,
    Stack,
    SvgIcon,
    Typography
} from '@mui/material';
import {Layout as DashboardLayout} from 'src/layouts/dashboard/layout';
import {CustomersTable} from 'src/sections/customer/customers-table';
import {applyPagination} from 'src/utils/apply-pagination';
import axios from 'axios';
import {useRouter} from 'next/router';
import MagnifyingGlassIcon from '@heroicons/react/24/solid/MagnifyingGlassIcon';
import {BACKEND_URL} from 'src/utils/get-initials';
import Swal from 'sweetalert2';
import {useAuth} from '../hooks/use-auth';
import {useQuery} from '@tanstack/react-query';


const useCustomers = (page, rowsPerPage, data = []) => {
    return useMemo(
        () => {
            if (data.length > 0) {
                return applyPagination(data, page, rowsPerPage);
            }
        },
        [page, rowsPerPage, data]
    );
};

const useCustomerIds = (customers) => {
    return useMemo(
        () => {
            return (!customers) ? [] : customers.map((customer) => customer.id);
        },
        [customers]
    );
};

const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    try {
        const {data = null, status} = await axios.get(`${BACKEND_URL}clients`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
        });
        if (status === 200) {
            return data;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response.status === 401) {
                throw new Error('Unauthorized');
            }
        }
        throw new Error('internal_server_error');
    }
};
const Page = () => {
    const {isError, isLoading, data: clients = [], error} = useQuery(['customers'], async () => await fetchCustomers());
    const auth = useAuth();
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [clientsSearch, setClientsSearch] = useState([]);
    const customers = useCustomers(page, rowsPerPage, clients);


    const handlePageChange = useCallback(
        (event, value) => {
            setPage(value);
        },
        []
    );

    const handleRowsPerPageChange = useCallback(
        (event) => {
            setRowsPerPage(event.target.value);
        },
        []
    );

    const handleFetchError = async (error) => {
        if (error === 'Unauthorized') {
            Swal.fire({
                title: 'Tu sesión ha expirado',
                text: 'Por favor, inicia sesión nuevamente',
                icon: 'warning',
                confirmButtonText: 'Aceptar',
                allowOutsideClick: false
            });
            await auth.signOut();
        } else {
            Swal.fire({
                title: 'Ocurrió un error',
                text: 'No se pudieron obtener los clientes',
                icon: 'error',
                confirmButtonText: 'Aceptar',
                allowOutsideClick: false
            });
            await router.push('/');
        }
    }

    if (error) {
        return handleFetchError(error.message).then().catch(error => console.log(error));
    }

    const handleSearch = (event) => {
        if (event === '') {
            setClientsSearch([]);
            //setClients(clients);
            return;
        }
        const filteredData = clients.filter((client) => client.name.toLowerCase().includes(event.toLowerCase()));
        setClientsSearch(filteredData);
        setPage(0)
    }

    return (
        <>
            <Head>
                <title>
                    Clientes | Pitbulls Gym
                </title>
            </Head>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    py: 8
                }}
            >
                <Container maxWidth="xl">
                    <Stack spacing={3}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            spacing={4}
                        >
                            <Stack spacing={1}>
                                <Typography variant="h4">
                                    Clientes
                                </Typography>
                            </Stack>
                            <div>
                                <Button
                                    onClick={() => router.push('/customers-new')}
                                    startIcon={(
                                        <SvgIcon fontSize="small">
                                            <PlusIcon/>
                                        </SvgIcon>
                                    )}
                                    variant="contained"
                                >
                                    Registrar cliente
                                </Button>
                            </div>
                        </Stack>
                        {/* <CustomersSearch /> */}
                        <Card sx={{p: 2}}>
                            <OutlinedInput
                                defaultValue=""
                                onChange={(event) => handleSearch(event.target.value)}
                                fullWidth
                                placeholder="Buscar cliente por nombre"
                                startAdornment={(
                                    <InputAdornment position="start">
                                        <SvgIcon
                                            color="action"
                                            fontSize="small"
                                        >
                                            <MagnifyingGlassIcon/>
                                        </SvgIcon>
                                    </InputAdornment>
                                )}
                                sx={{maxWidth: 500}}
                            />
                        </Card>
                        {
                            isLoading && (
                                <LinearProgress/>
                            )
                        }
                        <CustomersTable
                            count={(clientsSearch.length > 0) ? clientsSearch.length : clients.length}
                            items={(clientsSearch.length > 0) ? clientsSearch : customers}
                            onPageChange={handlePageChange}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            page={page}
                            rowsPerPage={rowsPerPage}
                        />
                    </Stack>
                </Container>
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
