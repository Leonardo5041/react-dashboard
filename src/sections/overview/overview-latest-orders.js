import { format } from 'date-fns';
import PropTypes from 'prop-types';
import ArrowRightIcon from '@heroicons/react/24/solid/ArrowRightIcon';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  Divider,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import { SeverityPill } from 'src/components/severity-pill';
import { useRouter } from 'next/router';


const getStatusLabel = (endDate) => {
  const date = new Date(endDate);

  if (date > new Date()) {
    return 'Activa';
  }

  return 'Expirada';
}

const getStatusColor = (endDate) => {
  const date = new Date(endDate);
  if (date > new Date()) {
    return 'success';
  }
  else {
    return 'error';
  }
};

export const OverviewLatestOrders = (props) => {
  const router = useRouter();
  const { orders = [], sx } = props;

  return (
    <Card sx={sx}>
      <CardHeader title="Subscripciones" />
      <Scrollbar sx={{ flexGrow: 1 }}>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Subscripción
                </TableCell>
                <TableCell>
                  Cliente
                </TableCell>
                <TableCell sortDirection="desc">
                  Fecha de inicio
                </TableCell>
                <TableCell sortDirection="desc">
                  Fecha de fin
                </TableCell>
                <TableCell>
                  Estado
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => {
                const createdAt = format(new Date(order.start_date), 'dd MMM, yyyy');
                const expirationAt = format(new Date(order.end_date), 'dd MMM, yyyy');

                return (
                  <TableRow
                    hover
                    key={order.id}
                  >
                    <TableCell>
                      {order.membership.name}
                    </TableCell>
                    <TableCell>
                      {order.client.name}
                    </TableCell>
                    <TableCell>
                      {createdAt}
                    </TableCell>
                    <TableCell>
                      {expirationAt}
                    </TableCell>
                    <TableCell>
                      <SeverityPill color={getStatusColor(order?.end_date)}>
                        { getStatusLabel(order?.end_date)}
                      </SeverityPill>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <Button
          color="inherit"
          onClick={() => router.push('/customers')}
          endIcon={(
            <SvgIcon fontSize="small">
              <ArrowRightIcon />
            </SvgIcon>
          )}
          size="small"
          variant="text"
        >
          Ver todo
        </Button>
      </CardActions>
    </Card>
  );
};

OverviewLatestOrders.prototype = {
  orders: PropTypes.array,
  sx: PropTypes.object
};
