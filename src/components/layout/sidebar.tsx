import React from "react";
import "../../assets/fonts/typography.css";
import "../../assets/fonts/fonts.css";
import "../../assets/colors/colors.css";
import "../../assets/colors/gradients.css";

import OwlIcon from "../../assets/icons/owl_filled.svg";
import HomeIcon from "../../assets/icons/home_filled.svg";
import ProjectIcon from "../../assets/icons/projects.svg";
import TeamIcon from "../../assets/icons/team.svg";
import ReportIcon from "../../assets/icons/report.svg";
import SettingsIcon from "../../assets/icons/settings.svg";
import LogoutIcon from "../../assets/icons/logout.svg";

const Sidebar: React.FC = () => {
    const navigationItems = [
        { name: "Home", icon: HomeIcon, active: true },
        { name: "Project", icon: ProjectIcon, active: false },
        { name: "Team", icon: TeamIcon, active: false },
        { name: "Report", icon: ReportIcon, active: false },
    ];

    return (
        <aside className="card-drop-shadow 
            w-16 sm:w-64 md:w-72 lg:w-80 xl:w-80
            px-2 sm:px-4 
            py-6 sm:py-10 
            flex flex-col justify-between bg-white min-h-screen
            transition-all duration-300 ease-in-out">

        <div className="flex flex-col gap-8 sm:gap-14">
            {/* Logo Section */}
            <div className="p-1 sm:p-2">
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
            <nav className="py-2 sm:py-4">
                <ul className="space-y-1 sm:space-y-2">
                {navigationItems.map((item) => (
                    <li key={item.name}>
                        <a
                            href="#"
                            className={`flex items-center justify-center sm:justify-start 
                                px-2 sm:px-6 
                                py-3 sm:py-4 
                                rounded-lg 
                                ${item.active
                                    ? "subtitle-2 text-highlight-blue bg-tab-selected"
                                    : "subtitle-2 hover:bg-gray-100"
                                }`}
                        >
                            <img 
                                src={item.icon} 
                                alt={item.name}
                                className={`w-6 sm:w-10 h-6 sm:h-10 ${
                                    item.active ? "icon-blue-tint" : ""
                                }`}
                            />
                            <span className="hidden sm:inline sm:ml-4">{item.name}</span>
                        </a>
                    </li>
                ))}
                </ul>
            </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex w-full flex-col h-fit py-2 sm:py-4">
            <ul className="space-y-1 sm:space-y-2">
                <li>
                    <a
                    href="#"
                    className="flex items-center justify-center sm:justify-start 
                        px-2 sm:px-6 
                        py-3 sm:py-4 
                        rounded-lg subtitle-2 hover:bg-gray-100"
                    >
                        <img 
                            src={SettingsIcon} 
                            alt="Settings"
                            className="w-6 sm:w-10 h-6 sm:h-10" 
                        />
                        <span className="hidden sm:inline sm:ml-4">Settings</span>
                    </a>
                </li>
                <li>
                    <a
                    href="#"
                    className="flex items-center justify-center sm:justify-start 
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
                    </a>
                </li>
            </ul>
        </div>

        </aside>
    );
};

export default Sidebar;
