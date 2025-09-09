import React, { useState } from "react";
import ChevronLeft from "../../../assets/icons/chevron_left.svg"
import ChevronRight from "../../../assets/icons/chevron_right.svg"

import "../../../assets/fonts/typography.css";
import "./Calendar.css";

interface CalendarProps {
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
    onClose?: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
    selectedDate,
    onDateSelect,
    onClose,
}) => {
    const [currentYear, setCurrentYear] = useState(
        selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
    );
    const [currentMonth, setCurrentMonth] = useState(
        selectedDate ? selectedDate.getMonth() : new Date().getMonth()
    );

    const daysOfWeek = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // Get days in month
    const getDaysInMonth = (year: number, month: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    // Get previous month's trailing days
    const getPrevMonthDays = (year: number, month: number, count: number) => {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
        const days = [];
        for (let i = count - 1; i >= 0; i--) {
            days.unshift(new Date(prevYear, prevMonth, daysInPrevMonth - i));
        }
        return days;
    };

    // Get next month's leading days
    const getNextMonthDays = (year: number, month: number, count: number) => {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const days = [];
        for (let i = 1; i <= count; i++) {
            days.push(new Date(nextYear, nextMonth, i));
        }
        return days;
    };

    const days = getDaysInMonth(currentYear, currentMonth);
    const firstDayWeekday = days[0].getDay();
    const offset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;

    // Get trailing days from previous month
    const prevMonthDays = getPrevMonthDays(currentYear, currentMonth, offset);

    // Get leading days from next month to fill the grid
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - (prevMonthDays.length + days.length);
    const nextMonthDays = getNextMonthDays(
        currentYear,
        currentMonth,
        remainingCells
    );

    const allDays = [...prevMonthDays, ...days, ...nextMonthDays];

    const prevMonth = () => {
        const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        setCurrentYear(newYear);
        setCurrentMonth(newMonth);
    };

    const nextMonth = () => {
        const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        setCurrentYear(newYear);
        setCurrentMonth(newMonth);
    };

    const handleDateSelect = (date: Date) => {
        onDateSelect(date);
        if (onClose) onClose();
    };

    const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth;
    const isSelected = (date: Date) =>
        selectedDate &&
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate();

    return (
        <div className="calendar-container">
            {/* Header */}
            <div className="calendar-header button">
                <button
                    className="calendar-nav-button"
                    onClick={prevMonth}
                    type="button"
                >
                    <img
                    src={ChevronLeft}
                    className="arrow__icon"
                    width="24"
                    height="24"
                />
                </button>
                <div className="calendar-month-year">
                    {monthNames[currentMonth]} {currentYear}
                </div>
                <button
                    className="calendar-nav-button"
                    onClick={nextMonth}
                    type="button"
                >
                    <img
                    src={ChevronRight}
                    className="arrow__icon"
                    width="24"
                    height="24"
                />
                </button>
            </div>

            {/* Weekdays */}
            <div className="calendar-weekdays overline">
                {daysOfWeek.map((day) => (
                    <div key={day} className="calendar-weekday">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="calendar-days overline">
                {allDays.map((day) => (
                    <button
                        key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                        className={`calendar-day ${!isCurrentMonth(day) ? "other-month" : ""
                            } ${isSelected(day) ? "selected" : ""}`}
                        onClick={() => handleDateSelect(day)}
                        type="button"
                    >
                        {day.getDate()}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
