import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type Role = "user" | "admin";

type AuthContextValue = {
  name: string;
  role: Role;
  setRole: (role: Role) => void;
  setName: (name: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState("Guest");
  const [role, setRole] = useState<Role>("user");

  const value = useMemo(
    () => ({
      name,
      role,
      setRole,
      setName,
    }),
    [name, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
