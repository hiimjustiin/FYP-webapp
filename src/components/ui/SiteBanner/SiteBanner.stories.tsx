// SiteBanner.stories.tsx
import { SiteBanner } from './SiteBanner';
import { useState } from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";
import Button from '../Button/Button';

export default {
    title: "Components/SiteBanner",
    component: SiteBanner,
    parameters: {
        layout: 'fullscreen',
    },
};

export const AllVariants = () => {
    const [banners, setBanners] = useState({
        headerWithIcon: true,
        headerWithBullets: true,
        noHeaderWithIcon: true,
        noIcon: true,
        slim: true,
        info: true,
    });

    const closeBanner = (variant: keyof typeof banners) => {
        setBanners(prev => ({ ...prev, [variant]: false }));
    };

    const resetBanners = () => {
        setBanners({
            headerWithIcon: true,
            headerWithBullets: true,
            noHeaderWithIcon: true,
            noIcon: true,
            slim: true,
            info: true,
        });
    };

    return (
        <div style={{ gap: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <Button variant='blue' onClick={() => resetBanners()}>Reset All Banners</Button>
            </div>

            <p>Header with icon banner:</p>
            <SiteBanner
                isVisible={banners.headerWithIcon}
                type="warning"
                title="Site alert message"
                description="Additional context and followup information including a link."
                hasHeader={true}
                showIcon={true}
                onClose={() => closeBanner('headerWithIcon')}
            />

            <p>Header bullet points banner:</p>
            <SiteBanner
                isVisible={banners.headerWithBullets}
                type="warning"
                title="Site alert message"
                bulletPoints={[
                    'The primary message and <a href="#">a link</a> for supporting context.',
                    'Another message, <a href="#">and another link</a>.',
                    'A final alert message.'
                ]}
                hasHeader={true}
                showIcon={true}
                onClose={() => closeBanner('headerWithBullets')}
            />

            <p>Header no icon banner:</p>
            <SiteBanner
                isVisible={banners.noHeaderWithIcon}
                type="warning"
                title="Site alert message."
                description='Additional context and followup information including <a href="#">a link</a>.'
                hasHeader={false}
                showIcon={true}
                onClose={() => closeBanner('noHeaderWithIcon')}
            />

            <p>No icon banner:</p>
            <SiteBanner
                isVisible={banners.noIcon}
                type="warning"
                title="Site alert message."
                description='Additional context and followup information including <a href="#">a link</a>.'
                hasHeader={false}
                showIcon={false}
                onClose={() => closeBanner('noIcon')}
            />

            <p>Slim banner:</p>
            <SiteBanner
                isVisible={banners.slim}
                type="warning"
                title="Site alert message."
                description='Additional context and followup information including <a href="#">a link</a>.'
                hasHeader={false}
                showIcon={true}
                slim={true}
                onClose={() => closeBanner('slim')}
            />

            <p>Info banner:</p>
            <SiteBanner
                isVisible={banners.info}
                type="info"
                title="Site alert message"
                description='Additional context and followup information including <a href="#">a link</a>.'
                hasHeader={true}
                showIcon={true}
                onClose={() => closeBanner('info')}
            />

        </div>
    );
};
