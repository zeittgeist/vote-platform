import { BehaviorSubject, Observable } from 'rxjs';
import { Response, User } from '../models';
import { axiosInstance as axios } from '../axios';
import decode from 'jwt-decode';

export type AuthState = {
  isLoggedIn: boolean;
  userType: string;
  token: string;
  exp: number;
  user: string;
};

type AuthServiceInterface = {
  login: (loginForm: User) => Promise<LoginResponse>;
  isLoggedIn: () => boolean;
  setToken: (username: string, token: string) => void;
  revokeToken: () => void;
  authState$: () => Observable<AuthState>;
};

type LoginResponse = Response<any>;

const initialAuthState: AuthState = {
  isLoggedIn: false,
  userType: '',
  token: '',
  exp: 0,
  user: '',
};

const authService: () => AuthServiceInterface = () => {
  const authState = new BehaviorSubject<AuthState>(initialAuthState);

  const isLoggedIn: () => boolean = () => {
    return authState.value.isLoggedIn;
  };

  const setToken: (username: string, token: string) => void = (
    username,
    token
  ) => {
    const user: { sub: string; exp: number; [key: string]: any } =
      decode(token);

    authState.next({
      isLoggedIn: true,
      userType: user.sub,
      exp: user.exp,
      user: username,
      token,
    });
  };

  const revokeToken: () => void = () => {
    authState.next(initialAuthState);
  };

  const login: (loginForm: User) => Promise<LoginResponse> = async (
    loginForm
  ) => {
    try {
      const requestEndpoint = loginForm.isAdmin ? 'admin' : 'user';
      const { data } = await axios.post(`/${requestEndpoint}/login`, {
        user: loginForm.username,
        password: loginForm.password,
      });

      return {
        success: true,
        data,
      };
    } catch (e: any) {
      return {
        success: false,
        data: e,
      };
    }
  };

  const authState$: () => Observable<AuthState> = () =>
    authState.asObservable();

  return {
    login,
    isLoggedIn,
    setToken,
    revokeToken,
    authState$,
  };
};

export const AuthService: AuthServiceInterface = authService();
