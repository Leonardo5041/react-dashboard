import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography
} from '@mui/material';
import { useAuth } from 'src/hooks/use-auth';

export const AccountProfile = () => {
  //cargar el usuario desde el contexto
  const user = useAuth().user;
  
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
          <Avatar
            
            sx={{
              height: 80,
              mb: 2,
              width: 80
            }}
          />
          <Typography
            gutterBottom
            variant="h5"
          >
            {user.name}
          </Typography>
          <Typography
            color="text.secondary"
            variant="body2"
          >
            {user.city} {user.email}
          </Typography>
          <Typography
            color="text.secondary"
            variant="body2"
          >
            {user.timezone}
          </Typography>
        </Box>
      </CardContent>
      {/* <Divider />
      <CardActions>
        <Button
          fullWidth
          variant="text"
        >
          Subir foto
        </Button>
      </CardActions> */}
    </Card>
  );  
}