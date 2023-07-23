import { useAuth } from './use-auth';
export const useMockedUser = () => {
  // To get the user from the authContext, you can use
  // `const { user } = useAuth();`
  const { user } = useAuth();
  return user;
};
