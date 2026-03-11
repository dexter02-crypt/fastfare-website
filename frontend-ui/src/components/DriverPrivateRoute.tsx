import { Navigate } from "react-router-dom";

interface DriverPrivateRouteProps {
    children: React.ReactNode;
}

/**
 * Auth guard for Driver App routes.
 * Checks `driver_token` in localStorage — completely separate from the
 * regular user `token` used by ProtectedRoute.
 */
const DriverPrivateRoute = ({ children }: DriverPrivateRouteProps) => {
    const driverToken = localStorage.getItem("driver_token");
    const driverInfo = localStorage.getItem("driver_info");

    if (!driverToken || !driverInfo) {
        return <Navigate to="/driver-app/login" replace />;
    }

    // Validate that driverInfo is parseable
    try {
        JSON.parse(driverInfo);
    } catch {
        localStorage.removeItem("driver_token");
        localStorage.removeItem("driver_info");
        return <Navigate to="/driver-app/login" replace />;
    }

    return <>{children}</>;
};

export default DriverPrivateRoute;
