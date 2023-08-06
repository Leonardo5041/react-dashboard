import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Box, Card, Container, Typography, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewLatestOrders } from 'src/sections/overview/overview-latest-orders';
import { OverviewTotalCustomers } from 'src/sections/overview/overview-total-customers';
import axios from 'axios';
import { OverviewBudget } from 'src/sections/overview/overview-budget';
import { BACKEND_URL } from 'src/utils/get-initials';
import { useAuth } from '../hooks/use-auth';

const Page = () => {
  const auth = useAuth();
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);

  const getSubscriptions = async () => {
    try {
      const { data, status } = await axios.get(`${BACKEND_URL}subscription`);
      if (status !== 200) {
        setOrders([]);
      } else {
        setOrders(data);
      }
    } catch (error) {
      setOrders([]);
    }
  };

  const getPercentage = () => {
    const totalClients = clients.length;
    const totalSubscriptions = orders.length;
    const percentage = (totalSubscriptions / totalClients) * 100;
    return parseInt(percentage.toFixed(2));
  };

  const getInactiveClients = () => {
    const inactiveClients = clients.filter((client) => client.active === false);
    return inactiveClients.length;
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
        setClients([]);
      } else {
        setClients(data);
      }
    } catch (error) {
      setClients([]);
    }
  };

  useEffect(() => {
    getSubscriptions();
    getClients();
  }, []);
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
          <OverviewTotalCustomers
            difference={clients.length > 0 ? getPercentage() : null}
            // difference={16}

            positive={clients.length > 0 ? (getPercentage() > 50) : false}
            sx={{ height: '100%' }}
            value={String(clients?.length)}
          />
        </Grid>
        <Grid
          xs={12}
          md={12}
          lg={12}
        >
          <OverviewLatestOrders
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
