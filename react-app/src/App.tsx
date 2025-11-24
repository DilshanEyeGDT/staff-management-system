import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RoomAvailability from "./pages/Dashboard/RoomBooking/RoomAvailability";

function App() {
  return (
    <Router>
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rooms/:room_id" element={<RoomAvailability />} />
      </Routes>
    </Router>
  );
}

export default App;
