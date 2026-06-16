import ArrowRightIcon from '@heroicons/react/24/solid/ArrowRightIcon';
import BanknotesIcon from '@heroicons/react/24/solid/BanknotesIcon';
import CalendarDaysIcon from '@heroicons/react/24/solid/CalendarDaysIcon';
import ChartBarIcon from '@heroicons/react/24/solid/ChartBarIcon';
import ClipboardDocumentListIcon from '@heroicons/react/24/solid/ClipboardDocumentListIcon';
import CogIcon from '@heroicons/react/24/solid/CogIcon';
import CubeIcon from '@heroicons/react/24/solid/CubeIcon';
import ShoppingBagIcon from '@heroicons/react/24/solid/ShoppingBagIcon';
import ShoppingCartIcon from '@heroicons/react/24/solid/ShoppingCartIcon';
import UserIcon from '@heroicons/react/24/solid/UserIcon';
import UserPlusIcon from '@heroicons/react/24/solid/UserPlusIcon';
import UsersIcon from '@heroicons/react/24/solid/UsersIcon';
import { SvgIcon } from '@mui/material';

export const items = [
  {
    title: 'Resumen',
    path: '/',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <ChartBarIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Clientes',
    path: '/customers',
    roles: ['admin', 'cajero'],
    icon: (
      <SvgIcon fontSize="small">
        <UsersIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Membresías',
    path: '/companies',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <ShoppingBagIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Productos',
    path: '/products',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <ShoppingCartIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Punto de Venta',
    path: '/ventas',
    roles: ['admin', 'cajero'],
    icon: (
      <SvgIcon fontSize="small">
        <BanknotesIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Historial de Ventas',
    path: '/ventas/historial',
    roles: ['admin', 'cajero'],
    icon: (
      <SvgIcon fontSize="small">
        <ClipboardDocumentListIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Inventario',
    path: '/inventario',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <CubeIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Corte de Caja',
    path: '/corte',
    roles: ['admin', 'cajero'],
    icon: (
      <SvgIcon fontSize="small">
        <ChartBarIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Corte Global',
    path: '/corte-admin',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <ChartBarIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Reporte Semanal',
    path: '/reporte-semanal',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <CalendarDaysIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Mi cuenta',
    path: '/account',
    roles: ['admin', 'cajero'],
    icon: (
      <SvgIcon fontSize="small">
        <UserIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Configuraciones',
    path: '/settings',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <CogIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Registrar usuario',
    path: '/auth/register',
    roles: ['admin'],
    icon: (
      <SvgIcon fontSize="small">
        <UserPlusIcon />
      </SvgIcon>
    )
  },
  {
    title: 'Acceso de clientes',
    path: '/access',
    roles: ['admin', 'cajero'],
    icon: (
      <SvgIcon fontSize="small">
        <ArrowRightIcon />
      </SvgIcon>
    )
  }
];
