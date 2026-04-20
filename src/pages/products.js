import Head from 'next/head';
import PlusIcon from '@heroicons/react/24/solid/PlusIcon';
import {
    Box,
    Button,
    Container,
    LinearProgress,
    Pagination,
    Stack,
    SvgIcon,
    Typography,
    Unstable_Grid2 as Grid
} from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { CompanyCard } from 'src/sections/companies/company-card';
import { CompaniesSearch } from 'src/sections/companies/companies-search';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { PRODUCTS_URL } from 'src/utils/get-initials';
import { ProductCard } from 'src/sections/products/product-card';


const fetchProducts = async () => {
  try {
    const { data = null, status } = await axios.get(`${PRODUCTS_URL}productos`);
    if (status !== 200) {
      return [];
    } else {
        const productos = data?.productos || [];
      return productos;
    }
  } catch (error) {
    return [];
  }
};
const Page = () => {
  const { isLoading, isError, data: products = [] } = useQuery(['products'], async () => await fetchProducts(), {
    refetchOnWindowFocus: false,
  })
  const router = useRouter();

  return (
    <>
      <Head>
        <title>
          Productos | Pitbulls Gym
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
                  Productos
                </Typography>
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                >
                </Stack>
              </Stack>
              <div>
                <Button
                  onClick={() => router.push('/products-new')}
                  startIcon={(
                    <SvgIcon fontSize="small">
                      <PlusIcon/>
                    </SvgIcon>
                  )}
                  variant="contained"
                >
                  Nuevo Producto
                </Button>
              </div>
            </Stack>
            <CompaniesSearch/>
            <Grid
              container
              spacing={3}
            >
              {
                isError && (
                  <Typography variant="h4">
                    Error al cargar los datos
                  </Typography>
                )
              }
              {isLoading && (
                  <LinearProgress color="secondary" />
              )}
              {products.map((product) => (
                <Grid
                  xs={12}
                  md={6}
                  lg={4}
                  key={product.id}
                >
                  <ProductCard product={product}/>
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
};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
