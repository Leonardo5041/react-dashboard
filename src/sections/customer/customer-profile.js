import {
    Box,
    Card,
    CardContent,
    Divider,
    Typography
  } from '@mui/material';
  
  export const CustomerProfile = ({user}) => {

    return (
      <Card>
        <CardContent>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography
              gutterBottom
              variant="h5"
            >
              {user?.name}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              {user?.email}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              {user?.phone}
            </Typography>
            <Typography
              color="text.secondary"
              variant="body2"
            >
             Numero de cliente: <strong> {user?.client_number} </strong>
            </Typography>
          </Box>
        </CardContent>
        <Divider />
      </Card>
    );  
  }