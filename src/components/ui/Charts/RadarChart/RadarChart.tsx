import React from "react";

import {
    ResponsiveContainer,
    RadarChart as RechartsRadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend,
} from "recharts";
import "./RadarChart.css";

export interface RadarDataPoint {
    dimension: string;
    userScore: number;
    classAverage: number;
    maxScore?: number;
}

export interface RadarChartProps {
    data: RadarDataPoint[];
    selectedDimensions: string[];
    maxScore?: number;
    width?: number;
    height?: number;
    showLegend?: boolean;
    userColor?: string;
    classAverageColor?: string;
    className?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({
    data,
    selectedDimensions,
    maxScore = 5,
    showLegend = true,
    userColor = "var(--color-blue-ntu)",
    classAverageColor = "var(--color-red-ntu)",
    className = "",
}) => {
    // Filter data based on selected dimensions
    const filteredData = data
        .filter((item) => selectedDimensions.includes(item.dimension))
        .map((item) => ({
            ...item,
            label: item.dimension,
            // Ensure scores don't exceed maxScore
            userScore: Math.min(item.userScore, maxScore),
            classAverage: Math.min(item.classAverage, maxScore),
        }));

    if (filteredData.length === 0) {
        return (
            <div className={`radar-chart-container ${className}`
            }>
                <div className="radar-chart-empty" >
                    <p className="subtitle-2" > No dimensions selected </p>
                    < p className="caption" >
                        {" "}
                        Select at least one dimension to display the radar chart.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`radar-chart-container ${className}`}
            style={{ width: '100%', height: '100%', minHeight: '400px' }}
        >
            <ResponsiveContainer width="100%" height="100%" >
                <RechartsRadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={filteredData}
                >
                    <PolarGrid stroke="var(--color-grey-25)" strokeWidth={1} />
                    <PolarAngleAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: "var(--color-black)" }}
                        className="radar-axis-label"
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, maxScore]}
                        tick={{ fontSize: 10, fill: "var(--color-grey-55)" }}
                        axisLine={false}
                        tickCount={maxScore + 1}
                    />
                    <Radar
                        name="Personal Average"
                        dataKey="userScore"
                        stroke={userColor}
                        fill={userColor}
                        fillOpacity={0.3}
                        strokeWidth={2}
                    />
                    <Radar
                        name="Class Average"
                        dataKey="classAverage"
                        stroke={classAverageColor}
                        fill={classAverageColor}
                        fillOpacity={0.2}
                        strokeWidth={2}
                    />
                    {showLegend && (
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            height={36}
                            wrapperStyle={{
                                paddingTop: "20px",
                                fontSize: "14px",
                            }}
                        />
                    )}
                </RechartsRadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RadarChart;
