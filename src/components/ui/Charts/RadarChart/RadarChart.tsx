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
  classAverage?: number;
  maxScore?: number;
}

export interface RadarChartProps {
  data: RadarDataPoint[];
  selectedDimensions: string[];
  maxScore?: number;
  width?: number;
  height?: number;
  showLegend?: boolean;
  userName?: string;
  userColor?: string;
  classAverageColor?: string;
  className?: string;
  onDimensionClick?: (dimension: string) => void;
}

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  selectedDimensions,
  maxScore = 5,
  height = 400,
  showLegend = true,
  userName = "Personal Average",
  userColor = "var(--color-blue-ntu)",
  classAverageColor = "var(--color-red-ntu)",
  className = "",
  onDimensionClick,
}) => {
  // Filter data based on selected dimensions
  const filteredData = data
    .filter((item) => selectedDimensions.includes(item.dimension))
    .map((item) => ({
      ...item,
      label: item.dimension,
      // Ensure scores don't exceed maxScore
      userScore: Math.min(item.userScore, maxScore),
      classAverage:
        item.classAverage !== undefined
          ? Math.min(item.classAverage, maxScore)
          : undefined,
    }));

  if (filteredData.length === 0) {
    return (
      <div className={`radar-chart-container ${className}`}>
        <div className="radar-chart-empty">
          <p className="subtitle-2"> No dimensions selected </p>
          <p className="caption">
            {" "}
            Select at least one dimension to display the radar chart.
          </p>
        </div>
      </div>
    );
  }

  // Check if we have class average data to display
  const hasClassAverage = filteredData.some(
    (d) => d.classAverage !== undefined
  );

  // Handle click on radar chart - called when clicking the chart background
  const handleChartClick = (data: unknown): void => {
    console.log("[RadarChart] Chart click:", data);
    if (data && typeof data === "object" && "activeLabel" in data) {
      const chartData = data as { activeLabel?: string };
      if (chartData.activeLabel && onDimensionClick) {
        console.log(
          "[RadarChart] Calling onDimensionClick with:",
          chartData.activeLabel
        );
        onDimensionClick(chartData.activeLabel);
      }
    }
  };

  return (
    <div
      className={`radar-chart-container ${className}`}
      style={{ width: "100%", height: `${height}px`, minHeight: `${height}px` }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={filteredData}
          onClick={handleChartClick}
          style={{ cursor: onDimensionClick ? "pointer" : "default" }}
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
            name={userName}
            dataKey="userScore"
            stroke={userColor}
            fill={userColor}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          {hasClassAverage && (
            <Radar
              name="Class Average"
              dataKey="classAverage"
              stroke={classAverageColor}
              fill={classAverageColor}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
          {showLegend && (hasClassAverage || userName !== "Personal Average") && (
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
