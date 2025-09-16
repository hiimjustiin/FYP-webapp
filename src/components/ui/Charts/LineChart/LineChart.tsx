import React from 'react';
import {
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    ReferenceLine
} from 'recharts';
import './LineChart.css';

export interface DimensionData {
    submission: string;
    [key: string]: number | string;
}

export interface ChartDimension {
    id: string;
    text: string;
    color: string;
}

export interface LineChartProps {
    data: DimensionData[];
    dimensions: ChartDimension[];
    title?: string;
    height?: number;
    showArea?: boolean;
    xAxisKey?: string;
    className?: string;
}

export const DimensionLineChart: React.FC<LineChartProps> = ({
    data,
    dimensions,
    title = "",
    height = 400,
    showArea = true,
    xAxisKey = "submission",
    className = '',
}) => {
    return (
        <div className={`dimension-chart ${className}`}>
            {title && <h3 className="chart-title heading-6">{title}</h3>}

            <div className="chart-container sublabel">
                <ResponsiveContainer width="100%" height={height}>
                    <ComposedChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 20,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 0" stroke="var(--color-grey-25)" vertical={false} />
                        <XAxis dataKey={xAxisKey} />
                        
                        <YAxis 
                            domain={[0, 10]} 
                            ticks={[0, 2, 4, 6, 8, 10]}
                            axisLine={false}
                        />
                        
                        <Tooltip
                            content={({ payload, label, active }) => {
                                if (!active || !payload || payload.length === 0) return null;
                                
                                // Filter out duplicated value (area) by dataKey
                                const uniquePayload = payload.filter((item, index, self) => 
                                    self.findIndex(p => p.dataKey === item.dataKey) === index
                                );

                                return (
                                    <div className="custom-tooltip">
                                        <p className="tooltip-label overline">{label}</p>
                                        {uniquePayload.map((entry, index) => (
                                            <p key={index} className="tooltip-entry sublabel" style={{ color: entry.color }}>
                                                <span>
                                                    {dimensions.find(d => d.id === entry.dataKey)?.text || entry.dataKey}:
                                                </span>
                                                <span>
                                                    {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                                                </span>
                                            </p>
                                        ))}
                                    </div>
                                );
                            }}
                        />
                        
                        <Legend
                            formatter={(value) => dimensions.find(d => d.id === value)?.text || value}
                        />

                        <ReferenceLine y={5} stroke="#ddd" strokeDasharray="3 3" />

                        {showArea && dimensions.map(dimension => (
                            <Area
                                key={`${dimension.id}-area`}
                                type="linear"
                                dataKey={dimension.id}
                                stroke="none"
                                fill={dimension.color}
                                fillOpacity={0.05}
                                isAnimationActive={false}
                                legendType="none"
                            />
                        ))}

                        {dimensions.map(dimension => (
                            <Line
                                key={`${dimension.id}-line`}
                                type="linear" 
                                dataKey={dimension.id}
                                stroke={dimension.color}
                                strokeWidth={2}
                                dot={{
                                    fill: '#fff',
                                    strokeWidth: 2,
                                    r: 5,
                                    stroke: dimension.color
                                }}
                                activeDot={{
                                    r: 7,
                                    fill: dimension.color,
                                    stroke: '#fff',
                                    strokeWidth: 2
                                }}
                                connectNulls={false}
                                isAnimationActive={false}
                            />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
