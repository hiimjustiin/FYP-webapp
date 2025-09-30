import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Calendar from "../components/ui/Calendar/Calendar";
import Button from "../components/ui/Button/Button";

const Home = () => {
    const navigate = useNavigate();

    // Date range state
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-UK", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
            <div className="w-full flex-1 min-h-0 flex flex-col">
                <div className="flex flex-col h-full gap-4">
                    {/* Row: Greeting + Add New Project */}
                    <div className="flex flex-row justify-between items-center gap-4 flex-shrink-0">
                        {/* Greeting card */}
                        <div className="dashboard-card flex-7/12 px-4 py-2">
                            <h5 className="heading-5">Hi, User!</h5>
                            <p className="subtitle-2 text-grey-80">Let's begin a new project with ILA!</p>
                        </div>

                        {/* Add New Project card (clickable) */}
                        <div
                            className="dashboard-card basis-5/12 min-w-0 px-6 py-5 flex items-center justify-center cursor-pointer hover:scale-102 active:scale-98 transition-all"
                            onClick={() => navigate("/project")}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    navigate("/project");
                                }
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="subtitle-2 leading-none">＋</span>
                                <span className="subtitle-2">Add New Project</span>
                            </div>
                        </div>
                    </div>

                    {/* Find your reports between: [Start] to [End] */}
                    <div className="flex-1 min-h-0">
                        <div className="dashboard-card px-6 py-5 w-full  flex flex-col gap-4">
                            <div className="flex items-center flex-wrap gap-4">
                                <span className="subtitle-2">Find your reports between:</span>

                                {/* Start Date */}
                                <div className="relative shrink-0 w-[160px]">
                                    <Dropdown
                                        placeholder="Start Date"
                                        customTriggerText={startDate ? formatDate(startDate) : undefined}
                                        className="w-full min-w-0"
                                    >
                                        <Calendar selectedDate={startDate} onDateSelect={setStartDate} />
                                    </Dropdown>
                                </div>

                                <span className="body-2 ps-3 shrink-0">To</span>

                                {/* End Date */}
                                <div className="relative shrink-0 w-[160px]">
                                    <Dropdown
                                        placeholder="End Date"
                                        customTriggerText={endDate ? formatDate(endDate) : undefined}
                                        className="w-full min-w-0"
                                    >
                                        <Calendar selectedDate={endDate} onDateSelect={setEndDate} />
                                    </Dropdown>
                                </div>

                                <div className="ml-auto">
                                    <Button
                                        type="button"
                                        variant="blue"
                                        disabled={!startDate || !endDate}
                                        onClick={() => console.log("Filter:", { startDate, endDate })}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>

                            {/* Range preview */}
                            <div className="mt-2 p-3 bg-[var(--color-grey-05)] rounded-xl">
                                <strong>Range:&nbsp;</strong>
                                {startDate && endDate
                                    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                                    : "No range selected"}
                            </div>
                        </div>

                        {/* Report details */}
                        <div className="">

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
