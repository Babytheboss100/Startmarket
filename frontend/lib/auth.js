import Cookies from 'js-cookie';
export const getToken = () => Cookies.get('sm_token');
export const setToken = (t) => Cookies.set('sm_token', t, { expires: 30 });
export const removeToken = () => Cookies.remove('sm_token');
export const isLoggedIn = () => !!getToken();
export const getUser = () => { try { return JSON.parse(localStorage.getItem('sm_user')); } catch { return null; } };
export const setUser = (u) => localStorage.setItem('sm_user', JSON.stringify(u));
export const removeUser = () => localStorage.removeItem('sm_user');
export const logout = () => { removeToken(); removeUser(); window.location.href = '/'; };
