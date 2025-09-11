import { RadioButton } from './RadioButton';
import { useState } from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

export default {
    title: "Components/RadioButton",
    component: RadioButton,
    parameters: {
        layout: 'centered',
    },
};

export const RadioButtons = () => {
    const [selectedValue, setSelectedValue] = useState('Option 1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className='button'>
                Choose an option:
            </h3>
            <RadioButton
                value="Option 1"
                name="radio-group"
                label="Option 1"
                checked={selectedValue === 'Option 1'}
                onChange={setSelectedValue}
            />
            <RadioButton
                value="Option 2"
                name="radio-group"
                label="Option 2"
                checked={selectedValue === 'Option 2'}
                onChange={setSelectedValue}
            />
            <RadioButton
                value="Option 3"
                name="radio-group"
                label="Option 3"
                checked={selectedValue === 'Option 3'}
                onChange={setSelectedValue}
            />
            <RadioButton
                value="Option 4"
                name="radio-group"
                label="Option 4 (Disabled)"
                disabled={true}
                checked={false}
                onChange={setSelectedValue}
            />
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    <strong>Selected: </strong>{selectedValue}
            </div>
        </div>
    );
};

export const Disabled = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column'}}>
            <RadioButton
            value="disabled"
            name="example"
            label="Disabled"
            checked={false}
            disabled={true}
            />
            <RadioButton
            value="disabled-selected"
            name="example"
            label="Disabled Selected"
            checked={true}
            disabled={true}
            />
        </div>
    );
};

export const HorizontalGroup = () => {
    const [selectedOption, setSelectedOption] = useState('option1');

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <RadioButton
                value="option1"
                name="horizontal-group"
                label="Option 1"
                checked={selectedOption === 'option1'}
                onChange={setSelectedOption}
            />
            <RadioButton
                value="option2"
                name="horizontal-group"
                label="Option 2"
                checked={selectedOption === 'option2'}
                onChange={setSelectedOption}
            />
            <RadioButton
                value="option3"
                name="horizontal-group"
                label="Option 3"
                checked={selectedOption === 'option3'}
                onChange={setSelectedOption}
            />
        </div>
    );
};
