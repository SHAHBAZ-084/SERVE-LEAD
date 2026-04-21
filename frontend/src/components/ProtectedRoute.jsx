import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api";

/**
 * ProtectedRoute Component
 * @param {children} - Component to render if authenticated
 * @param {role} - Optional role required ('Admin' or 'Member')
 */
export default function ProtectedRoute({ children, role = "Member" }) {
    const location = useLocation();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initial token check
    const token = role === "Admin" ? localStorage.getItem("adminToken") : localStorage.getItem("token");

    useEffect(() => {
        const verifySession = async () => {
            if (!token) {
                setIsAuthenticated(false);
                setIsVerifying(false);
                return;
            }

            try {
                // Verify session with the backend
                const endpoint = role === "Admin" ? "admin/profile" : "auth/me";
                await api.get(endpoint);
                setIsAuthenticated(true);
            } catch (err) {
                console.error(`Verification failed for ${role}:`, err);
                
                // ONLY invalidate session if it's a 401 Unauthorized error
                // This prevents logging out on network errors or aborted requests (e.g. clicking 'back' while loading)
                if (err.response && err.response.status === 401) {
                    setIsAuthenticated(false);
                    if (role === "Admin") {
                        localStorage.removeItem("adminToken");
                    } else {
                        localStorage.removeItem("token");
                    }
                } else {
                    // For other errors (network, 500, etc.), we might still want to let them in if we have a token
                    // but for safety, let's just not clear the token and keep the current state if possible
                    // or better yet, assume they are authenticated if the token exists but the server is down
                    if (token) {
                        setIsAuthenticated(true);
                    } else {
                        setIsAuthenticated(false);
                    }
                }
            } finally {
                setIsVerifying(false);
            }
        };

        verifySession();
    }, [token, role]);

    if (isVerifying) {
        // Return a blank screen or spinner while verifying to prevent layout shifts/flicker
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        const redirectPath = role === "Admin" ? "/admin-login" : "/login";
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    return children;
}
