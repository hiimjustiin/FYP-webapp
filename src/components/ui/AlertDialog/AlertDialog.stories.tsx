import { AlertDialog } from './AlertDialog';
import { useState } from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";
import Button from '../Button/Button';

export default {
    title: "Components/AlertDialog",
    component: AlertDialog,
    parameters: {
        layout: 'centered',
    },
};

export const AllStates = () => {
    const [currentDialog, setCurrentDialog] = useState<string | null>(null);

    const dialogs = [
        { type: 'warning' as const, title: 'Warning Dialog' },
        { type: 'success' as const, title: 'Success Dialog' },
        { type: 'error' as const, title: 'Error Dialog' },
        { type: 'info' as const, title: 'Info Dialog' },
        { type: 'loading' as const, title: 'Loading Dialog' },
    ];

    return (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'start' }}>
            {dialogs.map(dialog => (
                <Button
                    key={dialog.type}
                    onClick={() => setCurrentDialog(dialog.type)}
                    variant='blue'>
                    Show {dialog.title}
                </Button>
            ))}

            <AlertDialog
                isOpen={currentDialog === 'warning'}
                type="warning"
                title="Delete Confirmation"
                message="This action cannot be undone."
                primaryButtonText="Delete"
                secondaryButtonText="Cancel"
                onPrimaryAction={() => setCurrentDialog(null)}
                onSecondaryAction={() => setCurrentDialog(null)}
            />

            <AlertDialog
                isOpen={currentDialog === 'success'}
                type="success"
                title="Operation Successful"
                message="Your changes have been saved successfully."
                primaryButtonText="OK"
                onPrimaryAction={() => setCurrentDialog(null)}
            />

            <AlertDialog
                isOpen={currentDialog === 'error'}
                type="error"
                title="Something went wrong"
                message="Please try again or contact support."
                primaryButtonText="Retry"
                secondaryButtonText="Cancel"
                onPrimaryAction={() => setCurrentDialog(null)}
                onSecondaryAction={() => setCurrentDialog(null)}
            />

            <AlertDialog
                isOpen={currentDialog === 'info'}
                type="info"
                title="Information"
                message="Here's some important information for you."
                primaryButtonText="Got it"
                onPrimaryAction={() => setCurrentDialog(null)}
                showCloseButton={true}
                onClose={() => setCurrentDialog(null)}
            />

            <AlertDialog
                isOpen={currentDialog === 'loading'}
                type="loading"
                title="Processing..."
                message="Please wait while we process your request."
            />
        </div>
    );
};
