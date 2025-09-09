import React from 'react';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import MemberIcon from "./MemberIcon";
import MemberGroup, { type Member } from "./MemberGroup";

export default {
    title: "Components/MemberIcon",
    component: MemberIcon,
    parameters: {
        layout: 'padded',
    },
};

export const MemberIcons = () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <MemberIcon name="Lee Jia Yi" backgroundColor="blue" />
        <MemberIcon name="Emma Ng" backgroundColor="pink" />
        <MemberIcon name="Selena Kuan" backgroundColor="green" />
        <MemberIcon name="Martin Zhang" backgroundColor="purple" />
        <MemberIcon name="Jenny Wong" backgroundColor="teal" />
        <MemberIcon name="Joe Lee" backgroundColor="yellow" />
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
            <h4>Small</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
                <MemberIcon name="LW" backgroundColor="blue" size="small" />
                <MemberIcon name="EH" backgroundColor="pink" size="small" />
                <MemberIcon name="GW" backgroundColor="green" size="small" />
            </div>
        </div>
        <div>
            <h4>Medium</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
                <MemberIcon name="LW" backgroundColor="blue" size="medium" />
                <MemberIcon name="EH" backgroundColor="pink" size="medium" />
                <MemberIcon name="GW" backgroundColor="green" size="medium" />
            </div>
        </div>
        <div>
            <h4>Large</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
                <MemberIcon name="LW" backgroundColor="blue" size="large" />
                <MemberIcon name="EH" backgroundColor="pink" size="large" />
                <MemberIcon name="GW" backgroundColor="green" size="large" />
            </div>
        </div>
        <div>
            <h4>X-Large</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
                <MemberIcon name="LW" backgroundColor="blue" size="xlarge" />
                <MemberIcon name="EH" backgroundColor="pink" size="xlarge" />
                <MemberIcon name="GW" backgroundColor="green" size="xlarge" />
            </div>
        </div>
    </div>
);

export const WithProfilePictures = () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <MemberIcon
            name="Clarence Tan"
            profilePicture="https://cdn-icons-png.flaticon.com/512/146/146035.png"
        />
        <MemberIcon
            name="Yvonne Yap"
            profilePicture="https://cdn-icons-png.flaticon.com/512/219/219966.png"
        />
        <MemberIcon name="George Wilson" backgroundColor="green" />
        <MemberIcon name="Sarah Thompson" backgroundColor="purple" />
    </div>
);

export const Clickable = () => {
    const [clicked, setClicked] = React.useState<string>('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <MemberIcon
                    name="Clarence Tan"
                    backgroundColor="blue"
                    onClick={() => setClicked('Clarence Tan')}
                />
                <MemberIcon
                    name="Yvonne Yap"
                    backgroundColor="pink"
                    onClick={() => setClicked('Yvonne Yap')}
                />
                <MemberIcon
                    name="Bong Chen"
                    backgroundColor="green"
                    onClick={() => setClicked('Bong Chen')}
                />
            </div>
            {clicked && (
                <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                    <strong>Clicked:</strong> {clicked}
                </div>
            )}
        </div>
    );
};

export const MemberGroupExample = () => {
    const members: Member[] = [
        { id: '1', name: 'Lee Jia Yi', backgroundColor: 'blue' },
        { id: '2', name: 'Emma Ng', backgroundColor: 'pink' },
        { id: '3', name: 'Selena Kuan', backgroundColor: 'green' },
        { id: '4', name: 'Martin Zhang', backgroundColor: 'purple' },
        { id: '5', name: 'Jenny Wong', backgroundColor: 'teal' },
        { id: '6', name: 'Joe Lee', backgroundColor: 'yellow' },
        { id: '7', name: 'Chris Koh', backgroundColor: 'auto'},
    ];

    const [clickedMember, setClickedMember] = React.useState<string>('');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h4>Horizontal Layout</h4>
                <MemberGroup
                    members={members}
                    maxVisible={5}
                    onMemberClick={(member) => setClickedMember(member.name)}
                    onMoreClick={() => setClickedMember('Show all members')}
                />
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
                <h4>Stacked Layout</h4>
                <MemberGroup
                    members={members}
                    layout="stacked"
                    maxVisible={7}
                    onMemberClick={(member) => setClickedMember(member.name)}
                    onMoreClick={() => setClickedMember('Show all members')}
                />
            </div>

            {clickedMember && (
                <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                    <strong>Action:</strong> {clickedMember}
                </div>
            )}
        </div>
    );
};

// Auto Color Generation
export const AutoColors = () => {
    const names = [
        'Lee Jia Yi', 'Emma Ng', 'Selena Kuan', 'Martin Zhang',
        'Jenny Wong', 'Joe Lee'
    ];

    return (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {names.map((name) => (
                <div key={name} style={{ textAlign: 'center' }}>
                    <MemberIcon name={name} backgroundColor="auto" />
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{name}</div>
                </div>
            ))}
        </div>
    );
};
