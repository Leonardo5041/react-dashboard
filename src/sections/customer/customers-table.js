import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  Avatar,
  Box,
  Button,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import { Scrollbar } from 'src/components/scrollbar';
import { formatDateTime, getInitials } from 'src/utils/get-initials';
import { useRouter } from 'next/router';
import { SeverityPill } from 'src/components/severity-pill';

const getSubscriptionState = (endDate) => {
  const now = new Date();
  const isBefore = endDate ? now < new Date(endDate) : false;
  return isBefore ? 'info' : 'warning';
}

const getStatusLabel = (endDate) => {
  const date = new Date(endDate);

  if (date > new Date()) {
    return 'Membresia Activa';
  }

  return 'Membresia Inactiva';
}

const formatDate = (date) => {
  if (!date) return 'No cuenta con una suscripción';
  return `Fecha de termino: ${formatDateTime(date)} `;
}

const getNumberClient = (clientNumber) => {
  if (!clientNumber) return 'No cuenta con un numero de cliente';
  return `Numero de cliente: ${clientNumber}`;
}

export const CustomersTable = (props) => {
  const router = useRouter();
  const {
    count = 0,
    items = [],
    // onDeselectAll,
    // onDeselectOne,
    onPageChange = () => { },
    onRowsPerPageChange,
    // onSelectAll,
    // onSelectOne,
    page = 0,
    rowsPerPage = 0,
    selected = []
  } = props;

  // const selectedSome = (selected.length > 0) && (selected.length < items.length);
  // const selectedAll = (items.length > 0) && (selected.length === items.length);

  return (
    <Card>
      <Scrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  Nombre
                </TableCell>
                <TableCell>
                  Telefono
                </TableCell>
                <TableCell>
                  Estado del Cliente
                </TableCell>
                <TableCell>
                  Estado de la subscripcion
                </TableCell>
                <TableCell>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((customer) => {
                const isSelected = selected.includes(customer.id);
                return (
                  <TableRow
                    hover
                    key={customer?.id}
                    selected={isSelected}
                  >
                    <TableCell>
                      <Stack
                        alignItems="center"
                        direction="row"
                        spacing={2}
                      >
                        <Tooltip title={getNumberClient(customer.client_number)}>
                          <Avatar src={customer.avatar}>
                            {getInitials(customer.name)}
                          </Avatar>
                        </Tooltip>
                        <Typography variant="subtitle2">
                          {customer.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {customer.phone}
                    </TableCell>
                    <TableCell>
                      <SeverityPill
                        color={(customer?.active ? 'success' : 'error')} >
                        {customer?.active ? 'Activo' : 'Inactivo'}
                      </SeverityPill>
                    </TableCell>
                    <Tooltip title={formatDate(customer?.subscription?.end_date)}>
                      <TableCell>
                        <SeverityPill
                          color={(getSubscriptionState(customer?.subscription?.end_date))} >
                          {getStatusLabel(customer?.subscription?.end_date)}
                        </SeverityPill>

                      </TableCell>
                    </Tooltip>
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={2}
                      >
                        <Button
                          onClick={() => router.push(`/customers/${customer.id}`)}
                          size="small"
                          sx={{ minWidth: 'auto' }}
                          variant="contained"
                        >
                          Ver Detalles
                        </Button>
                      </Stack>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Scrollbar>
      <TablePagination
        component="div"
        count={count}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 20, 30, 50, 100]}
      />
    </Card>
  );
};

CustomersTable.propTypes = {
  count: PropTypes.number,
  items: PropTypes.array,
  onDeselectAll: PropTypes.func,
  onDeselectOne: PropTypes.func,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  onSelectAll: PropTypes.func,
  onSelectOne: PropTypes.func,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  selected: PropTypes.array
};
