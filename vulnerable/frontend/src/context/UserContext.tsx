import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../services/axiosInstance";

interface User {
    id: number;
    username: string;
    role: string; // user | admin
}

interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {

    // --------------------------
    // Decode JWT (sans vérification)
    // --------------------------
    function decodeJWT(token: string | null) {
        if (!token) return null;

        try {
            const payload = token.split(".")[1];
            const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
            return JSON.parse(decoded);
        } catch (error) {
            console.error("Token invalide :", error);
            return null;
        }
    }

    const [user, setUser] = useState<User | null>(null);

    // --------------------------
    // Charger les infos utilisateur au démarrage
    // --------------------------
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        const userInfo = decodeJWT(token);

        if (!userInfo?.id) return;

        axiosInstance
            .get(`/users/${userInfo.id}`)
            .then((response) => {
                setUser({
                    id: response.data.id,
                    username: response.data.username,
                    role: userInfo.role,
                });
            })
            .catch((error) => {
                console.error("Erreur lors de la récupération de l'utilisateur :", error);
                toast.error("Impossible de charger les informations utilisateur.");
            });
    }, []); // ← se lance 1 seule fois au chargement

    // --------------------------
    // Déconnexion
    // --------------------------
    const logout = () => {
        setUser(null);
        localStorage.removeItem("authToken");
        toast.success("Vous êtes déconnecté.");
    };

    return (
        <UserContext.Provider value={{ user, setUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
