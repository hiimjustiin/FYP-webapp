import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Calendar from "./Calendar";

export default {
    title: "Components/Calendar",
    component: Calendar,
    parameters: {
        layout: 'padded',
    },
};

// Default calendar
export const Default = () => {
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());

    return (
        <div style={{ width: 'fit-content' }}>
            <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
            />
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-grey-10)', borderRadius: '8px' }}>
                <strong>Selected Date:</strong> {selectedDate ? selectedDate.toLocaleDateString() : 'None'}
            </div>
        </div>
    );
};

export const DifferentMonths = () => {
    const [date1, setDate1] = React.useState<Date | null>(new Date(2021, 0, 15)); // January 2021
    const [date2, setDate2] = React.useState<Date | null>(new Date(2021, 5, 20)); // June 2021
    const [date3, setDate3] = React.useState<Date | null>(new Date(2021, 11, 25)); // December 2021

    return (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div>
                <h4>January 2021</h4>
                <Calendar selectedDate={date1} onDateSelect={setDate1} />
            </div>
            <div>
                <h4>June 2021</h4>
                <Calendar selectedDate={date2} onDateSelect={setDate2} />
            </div>
            <div>
                <h4>December 2021</h4>
                <Calendar selectedDate={date3} onDateSelect={setDate3} />
            </div>
        </div>
    );
};
