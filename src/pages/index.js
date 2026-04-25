import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Alert,
  Box,
  Card,
  Container,
  LinearProgress,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewLatestOrders } from 'src/sections/overview/overview-latest-orders';
import { OverviewTotalCustomers } from 'src/sections/overview/overview-total-customers';
import axios from 'axios';
import { OverviewBudget } from 'src/sections/overview/overview-budget';
import { BACKEND_URL, PRODUCTS_URL } from 'src/utils/get-initials';
import { useAuth } from '../hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { OverviewTasksProgress } from '../sections/overview/overview-tasks-progress';

const fetchAlertasInventario = async () => {
  try {
    const { data, status } = await axios.get(`${PRODUCTS_URL}inventario/alertas`);
    if (status !== 200) return null;
    return data;
  } catch {
    return null;
  }
};

const getSubscriptions = async () => {
  try {
    const { data, status } = await axios.get(`${BACKEND_URL}subscription/expiring`);
    if (status !== 200) {
      return [];
    } else {
      return data;
    }
  } catch (error) {
    return [];
  }
};

const expiringSubscriptions = async (filter) => {
  try {
    const { data, status } = await axios.get(`${BACKEND_URL}subscription/filter-by-expiration`, {
      params: { filter }
    });
    if (status !== 200) {
      return [];
    } else {
      return data;
    }
  } catch (error) {
    return [];
  }
};

const getClients = async () => {
  try {
    const token = localStorage.getItem('token');
    const { data, status } = await axios.get(`${BACKEND_URL}clients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (status !== 200) {
      return [];
    } else {
      return data;
    }
  } catch (error) {
    return [];
  }
};

const Page = () => {
  const auth = useAuth();
  const router = useRouter();
  const { isLoading, isError, data: orders = [] } = useQuery(['orders'],
    async () => await getSubscriptions(), {
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  const { isLoading: isLoadingClients, isError: isErrorClients, data: clients = [] } = useQuery(['clients'],
    async () => await getClients(), {
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
  const { data: alertasData } = useQuery(['inventario-alertas'], fetchAlertasInventario, {
    staleTime: 1000 * 60 * 5
  });

  const alertas = alertasData?.alertas || [];
  const hayAlertas = alertasData?.estado === 'ALERTA';

  const getPercentage = () => {
    const totalClients = clients.length;
    const totalSubscriptions = getActiveMemberships();
    const percentage = (totalSubscriptions / totalClients) * 100;
    return parseInt(percentage.toFixed(2));
  };

  const getInactiveClients = () => {
    const inactiveClients = clients.filter((client) => client.active === false);
    return inactiveClients.length;
  };

  const getActiveMemberships = () => {
    let subscriptions = clients.map((client) => client?.subscription);
    subscriptions = subscriptions.filter((subscription) => subscription !== null);
    const activeMemberships = subscriptions.filter((order) => new Date(order?.end_date) > new Date());
    return activeMemberships.length;
  }

  return (
    <>
      <Head>
        <title>
          Resumen | Pitbulls Gym
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
          <Grid
            container
            spacing={3}
          >
            <Grid
              xs={12}
              sm={6}
              lg={3}
            >
              <Card>
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3
                  }}
                >
                  <Typography
                    color="textPrimary"
                    variant="h3"
                  >
                    Hola! 👋
                  </Typography>
                  <Typography
                    color="textSecondary"
                    variant="subtitle1"
                  >
                    {auth.user?.name}
                  </Typography>
                </Box>
              </Card>
            </Grid>
            <Grid
              xs={12}
              sm={6}
              lg={3}
            >
              <OverviewBudget
                sx={{ height: '100%' }}
                value={String(getInactiveClients())}
              />
            </Grid>
            <Grid
              xs={12}
              sm={6}
              lg={3}
            >
              <OverviewTasksProgress value={getActiveMemberships()} />
            </Grid>
            <Grid
              xs={12}
              sm={6}
              lg={3}
            >
              <OverviewTotalCustomers
                difference={clients.length > 0 ? getPercentage() : null}
                positive={clients.length > 0 ? (getPercentage() > 50) : false}
                sx={{ height: '100%' }}
                value={String(clients?.length)}
              />
            </Grid>
            {hayAlertas && (
              <Grid xs={12}>
                <Alert
                  severity="warning"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push('/inventario')}
                >
                  <strong>Stock bajo en {alertasData.cantidad} producto(s):</strong>{' '}
                  {alertas.map((a) => `${a.producto} (${a.stockActual}/${a.stockMinimo})`).join(', ')}
                  {' — '}
                  <u>Click aqui para ir al inventario</u>
                </Alert>
              </Grid>
            )}

            <Grid
              xs={12}
              md={12}
              lg={12}
            >
              {
                isLoading && (
                  <LinearProgress />
                )
              }
              <OverviewLatestOrders
                expiringSubscriptions={expiringSubscriptions}
                orders={orders}
                sx={{ height: '100%' }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  )
    ;
};
Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);
export default Page;
