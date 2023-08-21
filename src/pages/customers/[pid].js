import Head from 'next/head';
import {Box, Container, Stack, Typography, Unstable_Grid2 as Grid, Divider, LinearProgress} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { CustomerProfile } from 'src/sections/customer/customer-profile';
import { CustomerProfileDetails } from 'src/sections/customer/customer-profile-details';
import { CustomerMembership } from 'src/sections/customer/customer-membership';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { BACKEND_URL } from 'src/utils/get-initials';
import { CustomerFingerPrint } from 'src/sections/customer/customer-fingerprint';
import {useQuery} from "@tanstack/react-query";

const getCustomer = async (id) => {
    try {
        const { data, status } = await axios.get(`${BACKEND_URL}clients/${id}`);
        if (status === 200) {
            return data;
        } else {
            return null;
        }
    } catch (err) {
        throw new Error(err);
    }
};
const Page = () => {
    const router = useRouter();
    const { pid } = router.query;
    const { isError, isLoading, data: customer = null } = useQuery(['customer'], async () => await getCustomer(pid));

    return (
        <>
            <Head>
                <title>
                    Detalles del Cliente | Pitbulls Gym
                </title>
            </Head>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    py: 8
                }}
            >
                <Container maxWidth="lg">
                    <Stack spacing={3}>
                        <div>
                            <Typography variant="h4">
                                Cliente
                            </Typography>
                        </div>
                        <div>
                            <Grid
                                container
                                spacing={3}
                            >
                                {
                                    isLoading && (
                                        <LinearProgress />
                                    )
                                }
                                {
                                    isError && (
                                        <Typography variant="h4">
                                            Error al cargar el cliente
                                        </Typography>
                                    )
                                }
                                <Grid
                                    xs={12}
                                    md={6}
                                    lg={4}
                                >
                                    <CustomerProfile user={customer} />
                                    <Divider sx={{ my: 1 }} />
                                    <CustomerFingerPrint user={customer} />
                                </Grid>
                                
                                <Grid
                                    xs={12}
                                    md={6}
                                    lg={8}
                                >
                                    <CustomerProfileDetails user={customer}/>
                                </Grid>
                                
                                <Grid
                                    xs={12}
                                    md={6}
                                    lg={12}
                                >
                                    <CustomerMembership user={customer}/>
                                </Grid>
                            </Grid>
                        </div>
                    </Stack>
                </Container>
            </Box>
        </>
    );
}

Page.getLayout = (page) => (
    <DashboardLayout>
        {page}
    </DashboardLayout>
);

export default Page;
