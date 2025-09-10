import "../../../../assets/fonts/typography.css";
import "../../../../assets/fonts/fonts.css";
import "../../../../assets/colors/colors.css";
import "../../../../../src/index.css";

import RadarChart, { type RadarDataPoint } from "./RadarChart";
import RadarChartWithFilter from "./RadarChartWithFilter";
import { ALL_DIMENSIONS } from './constants';

export default {
    title: "Components/RadarChart",
    component: RadarChart,
    parameters: {
        layout: 'padded',
    },
};

const sampleData: RadarDataPoint[] = [
    {
        dimension: 'Frame the problem with an integrative approach',
        userScore: 4.2,
        classAverage: 3.8
    },
    {
        dimension: 'Stakeholder consideration',
        userScore: 3.5,
        classAverage: 4.1
    },
    {
        dimension: 'Range of disciplinary perspectives',
        userScore: 4.8,
        classAverage: 3.9
    },
    {
        dimension: 'Disciplinary reasoning',
        userScore: 3.2,
        classAverage: 3.6
    },
    {
        dimension: 'Credibility of disciplinary knowledge',
        userScore: 4.0,
        classAverage: 4.2
    },
    {
        dimension: 'Number of disciplinary integration',
        userScore: 3.7,
        classAverage: 3.4
    },
    {
        dimension: 'Depth of disciplinary integration',
        userScore: 4.5,
        classAverage: 3.7
    },
    {
        dimension: 'Social (society) impact',
        userScore: 3.9,
        classAverage: 4.0
    },
    {
        dimension: 'Limitations',
        userScore: 3.6,
        classAverage: 3.8
    }
];

// Full radar chart with all dimensions
export const Full = () => (
    <div style={{ width: '800px', height: '600px' }}>
        <RadarChart
            data={sampleData}
            selectedDimensions={ALL_DIMENSIONS}
            height={500}
        />
    </div>
);

// Filtered radar chart (5 dimensions)
export const Filtered = () => (
    <div style={{ width: '800px', height: '600px' }}>
        <RadarChart
            data={sampleData}
            selectedDimensions={[
                'Frame the problem with an integrative approach',
                'Range of disciplinary perspectives',
                'Depth of disciplinary integration',
                'Social (society) impact',
                'Limitations'
            ]}
            height={500}
        />
    </div>
);

// Interactive chart with filter controls
export const WithFilter = () => (
    <div style={{ width: '100%', minHeight: '600px' }}>
        <RadarChartWithFilter data={sampleData} />
    </div>
);

// Empty state
export const Empty = () => (
    <div style={{ width: '600px', height: '400px' }}>
        <RadarChart
            data={sampleData}
            selectedDimensions={[]}
            height={400}
        />
    </div>
);
