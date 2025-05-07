import { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // On mount, check if user data exists in localStorage
  useEffect(() => {
    const storedUser = {
      email: localStorage.getItem("email"),
      userId: localStorage.getItem("userId"),
      role: localStorage.getItem("role"),
      companyName: localStorage.getItem("companyName"),
    };
    const token = localStorage.getItem("token");

    if (token && storedUser.email && storedUser.role) {
      setUser(storedUser);
    }
  }, []);

  const login = (user, token) => {
    // Store the full user object
    setUser({
      email: user.email,
      userId: user._id,
      role: user.role,
      companyName: user.companyName,
    });
    localStorage.setItem("token", token);
    localStorage.setItem("userId", user._id);
    localStorage.setItem("role", user.role);
    localStorage.setItem("email", user.email);
    localStorage.setItem("companyName", user.companyName);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("companyName");
    localStorage.removeItem("role");
    localStorage.removeItem("theme");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
