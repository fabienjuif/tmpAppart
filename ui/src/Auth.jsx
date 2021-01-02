import { createContext, useState, useEffect, useContext } from "react";

const login = () => {
  window.localStorage.removeItem("token");
  window.location.replace(
    `${process.env.REACT_APP_API_BASE_URI}/tokens?from=${window.location.href}`
  );
};

export const AuthContext = createContext({ token: null, login });

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [value, setValue] = useState({ token: null, login });

  useEffect(() => {
    let token;
    const { searchParams } = new URL(document.location);
    if (searchParams.has("token")) {
      token = searchParams.get("token");
    }

    if (!token) {
      token = window.localStorage.getItem("token");
    }

    if (!token) {
      login();
    } else {
      window.localStorage.setItem("token", token);
      if (searchParams.has("token")) {
        searchParams.delete("token");
        const search = searchParams.toString();
        window.history.replaceState(
          undefined,
          undefined,
          `${window.location.pathname}${search.length > 0 ? `?${search}` : ""}`
        );
      }

      setValue((old) => ({ ...old, token }));
    }
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
