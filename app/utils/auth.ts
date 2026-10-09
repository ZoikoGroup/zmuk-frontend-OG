const TOKEN_KEY = "zoiko_token";
const USER_KEY = "zoiko_user";

export const isLoggedIn = () => {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(TOKEN_KEY);
};

export const getUser = () => {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const logout = async () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("zoiko-auth"));
  try {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/login' });
  } catch (e) {
    window.location.href = '/login';
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const isAuthenticated = () => {
  return !!getToken();
};