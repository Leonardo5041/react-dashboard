import Head from 'next/head';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import {
  Box,
  Button,
  Container,
  Pagination,
  Stack,
  SvgIcon,
  Typography,
  Unstable_Grid2 as Grid
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { CompanyCard } from 'src/sections/companies/company-card';
import { CompaniesSearch } from 'src/sections/companies/companies-search';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { BACKEND_URL } from 'src/utils/get-initials';
const Page = () => {
  const router = useRouter();
  const [memberships, setMemberships] = useState([]);

  const fetchMemberships = async () => {
    try {
      const { data = null, status } = await axios.get(`${BACKEND_URL}membership`);
      if (status !== 200) {
        setMemberships([]);
      } else {
        setMemberships(data);
      }
    } catch(error) {
      setMemberships([]);
    }
  }

  useEffect(() => {
    fetchMemberships();
  }, []);
    
  return (
    <>
      <Head>
        <title>
          Membresías | Pitbulls Gym
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
                  Membresías
                </Typography>
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                >
                  {/* <Button
                    color="inherit"
                    startIcon={(
                      <SvgIcon fontSize="small">
                        <ArrowUpOnSquareIcon />
                      </SvgIcon>
                    )}
                  >
                    Import
                  </Button>
                  <Button
                    color="inherit"
                    startIcon={(
                      <SvgIcon fontSize="small">
                        <ArrowDownOnSquareIcon />
                      </SvgIcon>
                    )}
                  >
                    Export
                  </Button> */}
                </Stack>
              </Stack>
              <div>
                <Button
                onClick={() => router.push('/memberships-new')}
                  startIcon={(
                    <SvgIcon fontSize="small">
                      <PlusIcon />
                    </SvgIcon>
                  )}
                  variant="contained"
                >
                  Nueva Membresía
                </Button>
              </div>
            </Stack>
            <CompaniesSearch />
            <Grid
              container
              spacing={3}
            >
              {memberships.map((membership) => (
                <Grid
                  xs={12}
                  md={6}
                  lg={4}
                  key={membership.id}
                >
                  <CompanyCard company={membership} />
                </Grid>
              ))}
            </Grid>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Pagination
                count={1}
                size="small"
              />
            </Box>
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
