import React from 'react';
import './Table.css';

export type TableData = (string | React.ReactNode)[][];

interface TableProps {
    data: TableData;
    className?: string;
}

const Table: React.FC<TableProps> = ({
    data,
    className = ''
}) => {
    // Empty data
    if (!data || data.length === 0) {
        return (
            <div className={`table-container ${className}`}>
                <div className="table-empty subtitle-2">
                    <p>No data available</p>
                </div>
            </div>
        );
    }
    
    const headers = data[0];
    const rows = data.slice(1);

    return (
        <div className={`table-container ${className}`}>
            <div className="table-desktop">
                <table className="table">
                    <thead>
                        <tr className="table-header-row">
                            {headers.map((header, index) => (
                                <th key={index} className="table-th subtitle-2">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="table-row">
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="table-td subtitle-3">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="table-mobile">
                {rows.map((row, rowIndex) => (
                    <div key={`mobile-${rowIndex}`} className="table-card">
                        {row.map((cell, cellIndex) => (
                            <div key={cellIndex} className="table-card-row">
                                <div className="table-card-label overline">
                                    {headers[cellIndex]}
                                </div>
                                <div className="table-card-value subtitle-3">
                                    {cell}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Table;
