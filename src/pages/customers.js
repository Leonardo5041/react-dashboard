import { useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import { Box, Button, Card, Container, InputAdornment, OutlinedInput, Stack, SvgIcon, Typography } from '@mui/material';
import { useSelection } from 'src/hooks/use-selection';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { CustomersTable } from 'src/sections/customer/customers-table';
import { applyPagination } from 'src/utils/apply-pagination';
import { useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import MagnifyingGlassIcon from '@heroicons/react/24/solid/MagnifyingGlassIcon';
import { BACKEND_URL } from 'src/utils/get-initials';


const useCustomers = (page, rowsPerPage, data) => {
  return useMemo(
    () => {
      return applyPagination(data, page, rowsPerPage);
    },
    [page, rowsPerPage, data]
  );
};

const useCustomerIds = (customers) => {
  return useMemo(
    () => {
      return customers.map((customer) => customer.id);
    },
    [customers]
  );
};

const Page = () => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [clients, setClients] = useState([]);
  const customers = useCustomers(page, rowsPerPage, clients);
  const customersIds = useCustomerIds(clients);
  const customersSelection = useSelection(customersIds);




  const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    try {
      const { data = null, status } = await axios.get(`${BACKEND_URL}clients`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (status !== 200) {
        setClients([]);
      } else {
        (status === 401) ? window.sessionStorage.setItem('authenticated', 'false') : null;
        setClients(data);
      }
    } catch (error) {
      setClients([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);



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

  const handleSearch = (event) => {
    if (event === '') fetchCustomers();
    const filteredData = clients.filter((client) => client.name.toLowerCase().includes(event.toLowerCase()));
    setClients(filteredData);
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
                      <PlusIcon />
                    </SvgIcon>
                  )}
                  variant="contained"
                >
                  Registrar cliente
                </Button>
              </div>
            </Stack>
            {/* <CustomersSearch /> */}
            <Card sx={{ p: 2 }}>
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
                      <MagnifyingGlassIcon />
                    </SvgIcon>
                  </InputAdornment>
                )}
                sx={{ maxWidth: 500 }}
              />
            </Card>
            <CustomersTable
              count={clients.length}
              items={customers}
              onDeselectAll={customersSelection.handleDeselectAll}
              onDeselectOne={customersSelection.handleDeselectOne}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onSelectAll={customersSelection.handleSelectAll}
              onSelectOne={customersSelection.handleSelectOne}
              page={page}
              rowsPerPage={rowsPerPage}
              selected={customersSelection.selected}
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
