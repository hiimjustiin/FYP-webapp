import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../assets/fonts/typography.css";
import "../../assets/fonts/fonts.css";
import "../../assets/colors/colors.css";
import "../../assets/colors/gradients.css";

import OwlIcon from "../../assets/icons/owl_filled.svg";
import HomeIcon from "../../assets/icons/home.svg";
import HomeIconFilled from "../../assets/icons/home_filled.svg";
import ProjectIcon from "../../assets/icons/projects.svg";
import ProjectIconFilled from "../../assets/icons/projects_filled.svg";
import TeamIcon from "../../assets/icons/team.svg";
import TeamIconFilled from "../../assets/icons/team_filled.svg";
import ReportIcon from "../../assets/icons/report.svg";
import ReportIconFilled from "../../assets/icons/report_filled.svg";
import SettingsIcon from "../../assets/icons/settings.svg";
import SettingsIconFilled from "../../assets/icons/settings_filled.svg";
import LogoutIcon from "../../assets/icons/logout.svg";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const navigationItems = [
    { name: "Home", icon: HomeIcon, iconFilled: HomeIconFilled, path: "/" },
    {
      name: "Project",
      icon: ProjectIcon,
      iconFilled: ProjectIconFilled,
      path: "/project",
    },
    { name: "Team", icon: TeamIcon, iconFilled: TeamIconFilled, path: "/team" },
    {
      name: "Report",
      icon: ReportIcon,
      iconFilled: ReportIconFilled,
      path: "/report",
    },
  ];

  const isActive = (path: string) => {
    // exact match for home so it doesn't light up everywhere
    if (path === "/") return location.pathname === "/";

    // active if exact match OR any child route (e.g. /project/new)
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside
      className="card-drop-shadow 
            w-14 sm:w-62 md:w-70 lg:w-78 xl:w-78
            px-1 sm:px-2 
            py-6 sm:py-10 
            flex flex-col justify-between bg-white min-h-screen
            transition-all duration-300 ease-in-out"
    >
      <div
        className="flex flex-col"
        style={{ gap: "clamp(2rem, 4vh, 2.5rem)" }}
      >
        {/* Logo Section */}
        <div>
          <div className="flex flex-col sm:flex-row items-center">
            <div className="p-1 sm:p-2 w-12 sm:w-20 h-12 sm:h-20 flex flex-col items-center justify-center">
              <img
                src={OwlIcon}
                alt="ILA"
                className="w-8 sm:w-12 h-8 sm:h-12"
              />
              <p className="overline text-xs hidden sm:block">ILA</p>
            </div>
            <div className="hidden sm:block">
              <h6 className="heading-6">NTU DSAIR</h6>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex w-full flex-col h-fit">
          <nav>
            <ul>
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-center sm:justify-start 
                                    px-2 sm:px-6 
                                    py-3 sm:py-4 
                                    rounded-lg 
                                    ${isActive(item.path)
                        ? "subtitle-2 text-highlight-blue bg-tab-selected"
                        : "subtitle-2 hover:bg-gray-100"
                      }`}
                  >
                    <img
                      src={isActive(item.path) ? item.iconFilled : item.icon}
                      alt={item.name}
                      className={`w-6 sm:w-10 h-6 sm:h-10 ${isActive(item.path) ? "icon-blue-tint" : ""
                        }`}
                    />
                    <span className="hidden sm:inline sm:ml-4">
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <div className="flex-grow min-h-[clamp(1rem,10vh,2rem)]" />

      {/* Bottom Section */}
      <div className="flex w-full flex-col h-fit">
        <ul>
          <li>
            <Link
              to="/settings"
              className={`flex items-center justify-center sm:justify-start 
                        px-2 sm:px-6 
                        py-3 sm:py-4 
                        rounded-lg subtitle-2 
                        ${isActive("/settings")
                  ? "text-highlight-blue bg-tab-selected"
                  : "hover:bg-gray-100"
                }`}
            >
              <img
                src={isActive("/settings") ? SettingsIconFilled : SettingsIcon}
                alt="Settings"
                className={`w-6 sm:w-10 h-6 sm:h-10 ${isActive("/settings") ? "icon-blue-tint" : ""
                  }`}
              />
              <span className="hidden sm:inline sm:ml-4">Settings</span>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center sm:justify-start 
                        px-2 sm:px-6 
                        py-3 sm:py-4 
                        rounded-lg subtitle-2 text-highlight-red hover:bg-red-50"
            >
              <img
                src={LogoutIcon}
                alt="Logout"
                className="w-6 sm:w-10 h-6 sm:h-10 icon-red-tint"
              />
              <span className="hidden sm:inline sm:ml-4">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
