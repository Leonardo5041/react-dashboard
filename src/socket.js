import io from 'socket.io-client';

const URL = 'https://socket-gym-aqdp5pzsxq-uc.a.run.app/';
export const socket = io(URL);