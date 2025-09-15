import { Checkbox } from './Checkbox';
import { useState } from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

export default {
    title: "Components/Checkbox",
    component: Checkbox,
    parameters: {
        layout: 'centered',
    },
};


export const CheckboxGroup = () => {
    const [items, setItems] = useState([
        { id: 'item1', label: 'Item 1', checked: false },
        { id: 'item2', label: 'Item 2', checked: true },
        { id: 'item3', label: 'Item 3', checked: false },
    ]);

    const allChecked = items.every(item => item.checked);
    const someChecked = items.some(item => item.checked);
    const indeterminate = someChecked && !allChecked;

    const handleSelectAll = (checked: boolean) => {
        setItems(items.map(item => ({ ...item, checked })));
    };

    const handleItemChange = (checked: boolean, value?: string) => {
        if (!value) return;
        setItems(items.map(item =>
            item.id === value ? { ...item, checked } : item
        ));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className='button'>
                Select multiple options:
            </h3>
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--color-grey-10)' }} />
            <Checkbox
                value="select-all"
                label="Select All"
                checked={allChecked}
                indeterminate={indeterminate}
                onChange={handleSelectAll}
            />
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--color-grey-10)' }} />
            {items.map(item => (
                <Checkbox
                    key={item.id}
                    value={item.id}
                    label={item.label}
                    checked={item.checked}
                    onChange={handleItemChange}
                />
            ))}
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <strong>Selected: </strong>
                {items
                    .filter(item => item.checked)
                    .map(item => item.label)
                    .join(', ') || 'None'}
            </div>
        </div>
    );
};

export const Disabled = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Checkbox
                value="disabled"
                name="example"
                label="Disabled"
                checked={false}
                disabled={true}
            />
            <Checkbox
                value="disabled-checked"
                name="example"
                label="Disabled Checked"
                checked={true}
                disabled={true}
            />
        </div>
    );
};

export const Indeterminate = () => {
    return (
        <Checkbox
            value="indeterminate"
            name="example"
            label="Indeterminate"
            checked={false}
            indeterminate={true}
        />
    );
};

export const WithoutLabel = () => {
    const [isChecked, setIsChecked] = useState(false);

    return (
        <Checkbox
            value="no-label"
            name="example"
            checked={isChecked}
            onChange={setIsChecked}
        />
    );
};

export const Sizes = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <Checkbox
                    value="small"
                    name="sizes1"
                    label="Small"
                    className="checkbox-small"
                    checked={true}
                />
                <Checkbox
                    value="medium"
                    name="sizes2"
                    label="Medium (Default)"
                    checked={true}
                />
                <Checkbox
                    value="large"
                    name="sizes3"
                    label="Large"
                    className="checkbox-large"
                    checked={true}
                />
            </div>
        </div>
    );
};

export const HorizontalGroup = () => {
    const [checkedItems, setCheckedItems] = useState({
        option1: false,
        option2: true,
        option3: false
    });

    const handleChange = (checked: boolean, value?: string) => {
        if (value) {
            setCheckedItems(prev => ({
                ...prev,
                [value]: checked
            }));
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <Checkbox
                    value="option1"
                    name="horizontal-group"
                    label="Option 1"
                    checked={checkedItems.option1}
                    onChange={handleChange}
                />
                <Checkbox
                    value="option2"
                    name="horizontal-group"
                    label="Option 2"
                    checked={checkedItems.option2}
                    onChange={handleChange}
                />
                <Checkbox
                    value="option3"
                    name="horizontal-group"
                    label="Option 3"
                    checked={checkedItems.option3}
                    onChange={handleChange}
                />

            </div>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <strong>Selected: </strong> {Object.entries(checkedItems)
                    .filter(([, value]) => value)
                    .map(([key]) => key)
                    .join(', ') || 'None'}
            </div>
        </div>
    );
};
