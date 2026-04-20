import PropTypes from 'prop-types';
import ArrowTrendingUpIcon from '@heroicons/react/24/solid/ArrowTrendingUpIcon';
import CurrencyDollarIcon from '@heroicons/react/24/solid/CurrencyDollarIcon';
import ShoppingCartIcon from '@heroicons/react/24/solid/ShoppingCartIcon';
import { Box, Card, CardContent, Divider, Stack, SvgIcon, Typography } from '@mui/material';
import { useRouter } from 'next/router';
export const ProductCard = (props) => {
  const router = useRouter();
  const { product } = props;

  return (
    <Card
      onClick={() => router.push(`/products/${product?.id}`)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer'
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            pb: 3
          }}
        >
          <SvgIcon  sx={{ fontSize: 30 }}>
            <ShoppingCartIcon />
          </SvgIcon>
        </Box>
        <Typography
          align="center"
          gutterBottom
          variant="h5"
        >
          {product?.nombre}
        </Typography>
        <Typography
          align="center"
          variant="body1"
        >
          {product?.descripcion}
        </Typography>
      </CardContent>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={2}
        sx={{ p: 2 }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
        >
          <SvgIcon
            color="action"
            fontSize="small"
          >
            <ArrowTrendingUpIcon />
          </SvgIcon>
          <Typography
            color="text.secondary"
            display="inline"
            variant="body2"
          >
            Cantidad en existencia: {product?.stock} unidades
          </Typography>
        </Stack>
        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
        >
          <SvgIcon
            color="action"
            fontSize="small"
          >
            <CurrencyDollarIcon />
          </SvgIcon>
          <Typography
            color="text.secondary"
            display="inline"
            variant="body2"
          >
            {product?.precio} MXN
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired
};
