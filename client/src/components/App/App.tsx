import "./App.css";
import { Route, Routes } from "react-router";

import { ProtectedRoute, PublicRoute } from "../ProtectedRoute/ProtectedRoute";
import Intro from "../../pages/Intro/Intro";
import AppLayout from "../AppLayout/AppLayout";
import Login from "../../pages/Login/Login";
import Register from "../../pages/Register/Register";
import Library from "../../pages/Library/Library";
import Chat from "../../pages/Chat/Chat";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/library" element={<Library />} />
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
