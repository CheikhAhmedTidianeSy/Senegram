import { Navigate, Route, Routes } from "react-router-dom";
import Login    from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home     from "./pages/Home.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import CallOverlay from "./components/CallOverlay.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Overlay d'appel monté globalement, se déclenche via CallContext */}
      <CallOverlay />
    </>
  );
}
