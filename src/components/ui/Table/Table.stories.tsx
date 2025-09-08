import Button from '../Button/Button';
import MemberGroup from '../MemberIcon/MemberGroup';

import "../../../assets/fonts/typography.css";
import "../../../assets/fonts/fonts.css";
import "../../../assets/colors/colors.css";
import "../../../../src/index.css";

import Table, { type TableData } from "./Table";

export default {
    title: "Components/Table",
    component: Table,
    parameters: {
        layout: 'padded',
    },
};

const sampleMembers = [
    { id: '1', name: 'Calvin Klein', backgroundColor: 'auto' as const },
    { id: '2', name: 'Mark Jacobs', backgroundColor: 'auto' as const },
    { id: '3', name: 'Kate Spade', backgroundColor: 'auto' as const },
    { id: '4', name: 'Giorgio Armani', backgroundColor: 'auto' as const },
    { id: '5', name: 'Tommy Hilfiger', backgroundColor: 'auto' as const },
    { id: '6', name: 'Yves Saint Laurent', backgroundColor: 'auto' as const },
];

export const ProjectTable = () => {
    const data: TableData = [
        ['Course', 'Project Name', 'Date', 'Member', 'InterQ Scores', 'Status', 'Action'],
        [
            'MSL 902',
            'xxx',
            'xxx',
            <MemberGroup key="members1" members={sampleMembers.slice(0, 6)} size="small" maxVisible={6} layout="horizontal" />,
            '',
            'Draft/Submit 1',
            <Button key="edit1" variant="blue" onClick={() => alert('Edit clicked')}>Edit</Button>
        ],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '']
    ];

    return (
        <div style={{ maxWidth: '1200px' }}>
            <Table data={data} />
        </div>
    );
};

export const TeamTable = () => {
    const data: TableData = [
        ['Course', 'Project Name', 'Member', 'Status'],
        [
            'MSL 902',
            'xxx',
            <MemberGroup key="members1" members={sampleMembers.slice(0, 6)} size="small" maxVisible={6} layout="horizontal" />,
            'Edit / Delete'
        ],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', '']
    ];

    return (
        <div style={{ maxWidth: '1200px' }}>
            <Table data={data} />
        </div>
    );
};

export const Empty = () => {
    const data: TableData = [];
    return (
        <div style={{ maxWidth: '1200px' }}>
            <Table data={data} />
        </div>
    );
};
