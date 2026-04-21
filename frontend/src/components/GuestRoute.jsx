import { Navigate } from "react-router-dom";

/**
 * GuestRoute Component
 * Prevents authenticated users from accessing guest-only routes (login, register).
 * Provides immediate redirection to the dashboard to avoid flickers.
 */
export default function GuestRoute({ children, role = "Member" }) {
    const token = role === "Admin" ? localStorage.getItem("adminToken") : localStorage.getItem("token");

    if (token) {
        const redirectPath = role === "Admin" ? "/admin-portal" : "/dashboard";
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}
