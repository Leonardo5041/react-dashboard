import PropTypes from 'prop-types';
import { useState } from 'react';
import ArrowRightIcon from '@heroicons/react/24/solid/ArrowRightIcon';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '../../utils/get-initials';


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

const EXPIRATION_FILTERS = {
  day: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes'
};

export const OverviewLatestOrders = (props) => {
  const router = useRouter();
  const { expiringSubscriptions, orders = [], sx } = props;
  const [expirationFilter, setExpirationFilter] = useState('week');

  const { data: filteredOrders = orders } = useQuery(['orders-by-expiration', expirationFilter],
    async () => await expiringSubscriptions(expirationFilter), {
    keepPreviousData: true,
    enabled: Boolean(expiringSubscriptions),
    staleTime: 1000 * 60
  });

  return (
    <Card sx={sx}>
      <CardHeader
        action={(
          <FormControl
            size="small"
            sx={{ minWidth: 140 }}
          >
            <InputLabel id="expiration-filter-label">Expira</InputLabel>
            <Select
              labelId="expiration-filter-label"
              id="expiration-filter"
              value={expirationFilter}
              label="Expira en"
              onChange={(event) => setExpirationFilter(event.target.value)}
            >
              {Object.entries(EXPIRATION_FILTERS).map(([value, label]) => (
                <MenuItem
                  key={value}
                  value={value}
                >
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        title="Subscripciones próximas a expirar"
      />
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
              {filteredOrders.map((order) => {
                const createdAt = formatDateTime(order.start_date);
                const expirationAt = formatDateTime(order.end_date);

                return (
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/customers/${order?.client?.id}`)}
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
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                  >
                    No hay subscripciones que expiren en este rango.
                  </TableCell>
                </TableRow>
              )}
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
  expiringSubscriptions: PropTypes.func,
  orders: PropTypes.array,
  sx: PropTypes.object
};
