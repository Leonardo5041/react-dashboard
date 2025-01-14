import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useRouter } from 'next/router';
import { BACKEND_URL, getInitials } from 'src/utils/get-initials';

const HANDLERS = {
  INITIALIZE: 'INITIALIZE',
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT',
  LOADING: 'LOADING'
};

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null
};

const mapLoginStatus = {
  400: 'Credenciales inválidas',
}

const handlers = {
  [HANDLERS.INITIALIZE]: (state, action) => {
    const user = action.payload;
    return {
      ...state,
      isAuthenticated: !!user,
      isLoading: false,
      user: user
    }
  },
  [HANDLERS.SIGN_IN]: (state, action) => {
    const user = action.payload;
    return {
      ...state,
      isAuthenticated: true,
      user: user
    };
  },
  [HANDLERS.SIGN_OUT]: (state) => {
    return {
      ...state,
      isAuthenticated: false,
      user: null
    };
  },
  [HANDLERS.LOADING]: (state) => {
    return {
      ...state,
      isLoading: true
    }
  }
};

const reducer = (state, action) => (
  handlers[action.type] ? handlers[action.type](state, action) : state
);

// The role of this context is to propagate authentication state through the App tree.

export const AuthContext = createContext();

export const AuthProvider = (props) => {
  const router = useRouter();
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, initialState, () => initialState);
  const initialized = useRef(false);

  const initialize = async () => {
    let isAuthenticated;
    const token = localStorage.getItem('token');
    if (initialized.current) {
      return;
    }
    initialized.current = true;
    try {
      isAuthenticated = !!(token);
    } catch (err) {
      console.error(err);
    }

    if (isAuthenticated) {
      try {
        const { data } = await axios.get(`${BACKEND_URL}users/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const user = {
          id: data?.id,
          avatar: getInitials(data?.name) || '',
          name: data?.name,
          email: data?.email
        };

        dispatch({
          type: HANDLERS.INITIALIZE,
          payload: user
        });
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response.status === 401) {
            window.sessionStorage.removeItem('authenticated');
            localStorage.removeItem('token');
            await router.push('/auth/login');
            router.reload();
          }
        }
      }
    } else {
      dispatch({
        type: HANDLERS.INITIALIZE
      });
    }
  };

  useEffect(
    () => {
      initialize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const skip = () => {
    try {
      window.sessionStorage.setItem('authenticated', 'true');
    } catch (err) {
      console.error(err);
    }

    const user = {
      id: '5e86809283e28b96d2d38537',
      avatar: '',
      name: 'Anika Visser',
      email: 'anika.visser@devias.io'
    };

    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const signIn = async (user) => {
    dispatch({
      type: HANDLERS.SIGN_IN,
      payload: user
    });
  };

  const signUp = async (email, name, password) => {
    try {
      const request = {
        email,
        name,
        password
      }
      return axios.post(`${BACKEND_URL}users/register`, request);
    } catch (err) {
      console.error(err);
    }
  };

  const signOut = () => {
    window.sessionStorage.removeItem('authenticated');
    localStorage.removeItem('token');
    router.push('/auth/login').then().catch().finally();
    router.reload();
    dispatch({
      type: HANDLERS.SIGN_OUT
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        skip,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node
};

export const AuthConsumer = AuthContext.Consumer;

export const useAuthContext = () => useContext(AuthContext);
