import {
    Avatar,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Divider,
} from '@mui/material';
import axios from 'axios';
import { useState } from 'react';
import { BACKEND_URL } from 'src/utils/get-initials';
import Swal from 'sweetalert2';


export const CustomerFingerPrint = ({ user }) => {
    const [qrImage, setQrImage] = useState();

    const handleSubmit = async () => {
        const confirmResponse = await Swal.fire({
          title: '¿Generar un nuevo código QR de acceso?',
          icon: 'question',
          iconHtml: '?',
          confirmButtonText: 'Si',
          cancelButtonText: 'No',
          showCancelButton: true,
          showCloseButton: true
        });
        if (!confirmResponse.isConfirmed) return;
        try {
            const fingerprintResponse = await axios.get(`${BACKEND_URL}clients/${user.id}/register-fingerprint`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (fingerprintResponse.status === 200) {
                setQrImage(fingerprintResponse?.data?.qrCode);
            }
        } catch (error) {
            console.log(error);
        }
    }
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
                    {
                        (qrImage) ?
                            <Avatar
                            variant='square'
                                src={qrImage}
                                sx={{
                                    height: 200,
                                    width: 200
                                }}

                            />
                            :
                            <></>
                    }
                </Box>
            </CardContent>
            <Divider />
            <CardActions>
                <Button
                    fullWidth
                    variant="text"
                    onClick={handleSubmit}
                >
                    Generar QR de acceso
                </Button>
            </CardActions>
        </Card>
    );
}