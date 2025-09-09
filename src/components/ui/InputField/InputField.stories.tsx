import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import InputField from "./InputField";

export default {
    title: "Components/InputField",
    component: InputField,
    parameters: {
        layout: 'padded',
    },
};

export const Disabled = () => {
    const [value, setValue] = React.useState('');
    
    return (
        <div style={{ width: '400px' }}>
            <InputField
                label="Label"
                value={value}
                onChange={setValue}
                placeholder="Placeholder"
                disabled={true}
            />
        </div>
    );
};

export const DateInput = () => {
    const [value, setValue] = React.useState('');
    
    return (
        <div style={{ width: '400px' }}>
            <InputField
                label="Label"
                type="date"
                value={value}
                onChange={setValue}
                placeholder="Placeholder"
            />
        </div>
    );
};

export const PasswordInput = () => {
    const [value, setValue] = React.useState('');
    
    return (
        <div style={{ width: '400px' }}>
            <InputField
                label="Label"
                type="password"
                value={value}
                onChange={setValue}
                placeholder="Placeholder"
                showPasswordToggle={true}
            />
        </div>
    );
};

export const AllStates = () => {
    const [textValue, setTextValue] = React.useState('');
    const [textWithValue, setTextWithValue] = React.useState('Input Text');
    const [errorValue, setErrorValue] = React.useState('Input Text');
    const [dateValue, setDateValue] = React.useState('');
    const [passwordValue, setPasswordValue] = React.useState('');
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '400px' }}>
            <InputField
                label="Label"
                value={textValue}
                onChange={setTextValue}
                placeholder="Placeholder"
            />
            
            <InputField
                label="Label"
                value={textWithValue}
                onChange={setTextWithValue}
                placeholder="Placeholder"
            />
            
            <InputField
                label="Label"
                value={errorValue}
                onChange={setErrorValue}
                placeholder="Placeholder"
                error="Error label"
            />
            
            <InputField
                label="Label"
                value=""
                onChange={() => {}}
                placeholder="Placeholder"
                disabled={true}
            />
            
            <InputField
                label="Label"
                type="date"
                value={dateValue}
                onChange={setDateValue}
                placeholder="Placeholder"
            />
            
            <InputField
                label="Label"
                type="password"
                value={passwordValue}
                onChange={setPasswordValue}
                placeholder="Placeholder"
                showPasswordToggle={true}
            />
        </div>
    );
};

export const FormExample = () => {
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthDate: ''
    });
    
    const handleChange = (field: string) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    
    return (
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <InputField
                label="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                placeholder="Enter your full name"
                required
            />
            
            <InputField
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="Enter your email"
                required
            />
            
            <InputField
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange('password')}
                placeholder="Enter your password"
                showPasswordToggle={true}
                required
            />
            
            <InputField
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="Confirm your password"
                showPasswordToggle={true}
                error={formData.confirmPassword && formData.password !== formData.confirmPassword ? "Passwords do not match" : undefined}
                required
            />
            
            <InputField
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={handleChange('birthDate')}
            />
        </div>
    );
};
