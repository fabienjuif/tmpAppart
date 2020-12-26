import { createContext, useState, useEffect, useContext } from "react";

export const AuthContext = createContext({ token: null });

export const useToken = () => useContext(AuthContext).token;

const AuthProvider = ({ children }) => {
  const [value, setValue] = useState({ token: null });

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
      window.location.replace(
        `${process.env.REACT_APP_API_BASE_URI}/tokens?from=${window.location.href}`
      );
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
