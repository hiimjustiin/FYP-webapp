import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import "./assets/fonts/typography.css";
import "./assets/colors/colors.css";
import "./assets/colors/gradients.css";

import Sidebar from "./components/layout/sidebar";
import Home from "./pages/Home.js";
import Project from "./pages/Project.js";
import Team from "./pages/Team.js";
import Report from "./pages/Report.js";
import Settings from "./pages/Settings.js";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-background">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/project" element={<Project />} />
              <Route path="/team" element={<Team />} />
              <Route path="/report" element={<Report />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
