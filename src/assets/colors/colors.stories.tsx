import "./colors.css";
import "./gradients.css";

import "../../../src/index.css"

export default {
    title: "Design System/Colors",
};

export const AllColors = () => (
    <section
        className="border-2 p-4 mt-8"
        style={{
            margin: "0 auto",
            overflowX: "auto",
            boxSizing: "border-box",
        }}
    >
        <h2 className="mb-4 text-2xl font-bold underline">
            Colour Scheme Preview
        </h2>
        <h3 className="mb-2 text-xl font-semibold">Colours</h3>

        {/* Grey scale row */}
        <div style={{ display: "flex", gap: "32px", marginBottom: 28 }}>
            {[
                { name: "White", var: "--color-white", hex: "#FFFFFF" },
                { name: "Grey/05", var: "--color-grey-05", hex: "#F2F2F2" },
                { name: "Grey/10", var: "--color-grey-10", hex: "#E6E6E6" },
                { name: "Grey/25", var: "--color-grey-25", hex: "#C8C8C8" },
                { name: "Grey/55", var: "--color-grey-55", hex: "#8C8C8C" },
                { name: "Grey/80", var: "--color-grey-80", hex: "#333333" },
                { name: "Black", var: "--color-black", hex: "#000000" },
            ].map((c) => (
                <div
                    key={c.name}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 80,
                    }}
                >
                    <div
                        style={{
                            background: `var(${c.var})`,
                            width: 48,
                            height: 64,
                            border: "1px solid #ddd",
                            borderRadius: 5,
                        }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>
                        {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#5f5f5f" }}>{c.hex}</div>
                </div>
            ))}
        </div>

        {/* Red row */}
        <div style={{ display: "flex", gap: "32px", marginBottom: 28 }}>
            {[
                { name: "Red/-1", var: "--color-red-m1", hex: "#ED1556" },
                { name: "Red/NTU", var: "--color-red-ntu", hex: "#D71440", bold: true },
                { name: "Red/+1", var: "--color-red-p1", hex: "#A72244" },
                { name: "Red/+2", var: "--color-red-p2", hex: "#7C223F" },
                { name: "Purple", var: "--color-purple", hex: "#A5247F" },
                { name: "Purple/+1", var: "--color-purple-p1", hex: "#5C004D" },
            ].map((c) => (
                <div
                    key={c.name}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 80,
                    }}
                >
                    <div
                        style={{
                            background: `var(${c.var})`,
                            width: 48,
                            height: 64,
                            border: "1px solid #ddd",
                            borderRadius: 5,
                        }}
                    />
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: c.bold ? 700 : 500,
                            marginTop: 8,
                        }}
                    >
                        {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#5f5f5f" }}>{c.hex}</div>
                </div>
            ))}
        </div>

        {/* Blue row */}
        <div style={{ display: "flex", gap: "32px", marginBottom: 28 }}>
            {[
                { name: "Blue/-3", var: "--color-blue-m3", hex: "#5DA9DD" },
                { name: "Blue/-2", var: "--color-blue-m2", hex: "#1B75BC" },
                { name: "Blue/-1", var: "--color-blue-m1", hex: "#0054A6" },
                { name: "Blue/NTU", var: "--color-blue-ntu", hex: "#181C62", bold: true },
                { name: "Teal", var: "--color-teal", hex: "#32BCAD" },
                { name: "Yellow", var: "--color-yellow", hex: "#FFDD00" },
            ].map((c) => (
                <div
                    key={c.name}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 80,
                    }}
                >
                    <div
                        style={{
                            background: `var(${c.var})`,
                            width: 48,
                            height: 64,
                            border: "1px solid #ddd",
                            borderRadius: 5,
                        }}
                    />
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: c.bold ? 700 : 500,
                            marginTop: 8,
                        }}
                    >
                        {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#5f5f5f" }}>{c.hex}</div>
                </div>
            ))}
        </div>

        {/* Green row */}
        <div style={{ display: "flex", gap: "32px", marginBottom: 28 }}>
            {[
                { name: "Green/-1", var: "--color-green-m1", hex: "#D5ED4C" },
                { name: "Green", var: "--color-green", hex: "#07B152" },
                { name: "Green/+1", var: "--color-green-p1", hex: "#007C48" },
            ].map((c) => (
                <div
                    key={c.name}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 80,
                    }}
                >
                    <div
                        style={{
                            background: `var(${c.var})`,
                            width: 48,
                            height: 64,
                            border: "1px solid #ddd",
                            borderRadius: 5,
                        }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8 }}>
                        {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#5f5f5f" }}>{c.hex}</div>
                </div>
            ))}
        </div>

        <h3 className="mt-6 mb-2 text-xl font-semibold">Gradients</h3>
        <div style={{ display: "flex", gap: "32px" }}>
            {[
                {
                    className: "gradient-background",
                    label: "Gradient/Background",
                    stops: "#FFFFFF #ECECEC",
                },
                {
                    className: "gradient-red",
                    label: "Gradient/Red",
                    stops: "#7C223F #A72244 #D71440 #ED1556",
                },
                {
                    className: "gradient-blue",
                    label: "Gradient/Blue",
                    stops: "#181C62 #0054A6 #1B75BC #5DA9DD",
                },
                {
                    className: "gradient-green",
                    label: "Gradient/Green",
                    stops: "#007C48 #07B152 #D5ED4C",
                },
            ].map((g) => (
                <div
                    key={g.label}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 165,
                    }}
                >
                    <div
                        className={g.className}
                        style={{
                            width: 72,
                            height: 72,
                            border: "1px solid #ddd",
                            borderRadius: 5,
                        }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}>
                        {g.label}
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: "#5f5f5f",
                            textAlign: "center",
                        }}
                    >
                        {g.stops}
                    </div>
                </div>
            ))}
        </div>
    </section>
);

export const GreyScale = () => (
    <div className="p-4">
        <h3 className="mb-4 text-xl font-semibold">Grey Scale Colors</h3>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
                { name: "White", var: "--color-white", hex: "#FFFFFF" },
                { name: "Grey/05", var: "--color-grey-05", hex: "#F2F2F2" },
                { name: "Grey/10", var: "--color-grey-10", hex: "#E6E6E6" },
                { name: "Grey/25", var: "--color-grey-25", hex: "#C8C8C8" },
                { name: "Grey/55", var: "--color-grey-55", hex: "#8C8C8C" },
                { name: "Grey/80", var: "--color-grey-80", hex: "#333333" },
                { name: "Black", var: "--color-black", hex: "#000000" },
            ].map((c) => (
                <div
                    key={c.name}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 100,
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            background: `var(${c.var})`,
                            width: 80,
                            height: 80,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            marginBottom: 8,
                        }}
                    />
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                        {c.name}
                    </div>
                    <div style={{ fontSize: 14, color: "#666", fontFamily: "monospace" }}>
                        {c.hex}
                    </div>
                    <div style={{ fontSize: 12, color: "#999", fontFamily: "monospace" }}>
                        var({c.var})
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const PrimaryColors = () => (
    <div className="p-4">
        <h3 className="mb-4 text-xl font-semibold">Primary Colors (NTU)</h3>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
                { name: "Red NTU", var: "--color-red-ntu", hex: "#D71440", desc: "Primary brand red" },
                { name: "Blue NTU", var: "--color-blue-ntu", hex: "#181C62", desc: "Primary brand blue" },
            ].map((c) => (
                <div
                    key={c.name}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 120,
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            background: `var(${c.var})`,
                            width: 100,
                            height: 100,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            marginBottom: 8,
                        }}
                    />
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                        {c.name}
                    </div>
                    <div style={{ fontSize: 14, color: "#666", fontFamily: "monospace" }}>
                        {c.hex}
                    </div>
                    <div style={{ fontSize: 12, color: "#999", fontFamily: "monospace" }}>
                        var({c.var})
                    </div>
                    <div style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 4 }}>
                        {c.desc}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const ColorPalette = () => (
    <div className="p-4">
        <h3 className="mb-4 text-xl font-semibold">Full Color Palette</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "24px" }}>
            {[
                // Red family
                { name: "Red/-1", var: "--color-red-m1", hex: "#ED1556", family: "Red" },
                { name: "Red/NTU", var: "--color-red-ntu", hex: "#D71440", family: "Red" },
                { name: "Red/+1", var: "--color-red-p1", hex: "#A72244", family: "Red" },
                { name: "Red/+2", var: "--color-red-p2", hex: "#7C223F", family: "Red" },
                
                // Blue family
                { name: "Blue/-3", var: "--color-blue-m3", hex: "#5DA9DD", family: "Blue" },
                { name: "Blue/-2", var: "--color-blue-m2", hex: "#1B75BC", family: "Blue" },
                { name: "Blue/-1", var: "--color-blue-m1", hex: "#0054A6", family: "Blue" },
                { name: "Blue/NTU", var: "--color-blue-ntu", hex: "#181C62", family: "Blue" },
                
                // Green family
                { name: "Green/-1", var: "--color-green-m1", hex: "#D5ED4C", family: "Green" },
                { name: "Green", var: "--color-green", hex: "#07B152", family: "Green" },
                { name: "Green/+1", var: "--color-green-p1", hex: "#007C48", family: "Green" },
                
                // Other colors
                { name: "Purple", var: "--color-purple", hex: "#A5247F", family: "Other" },
                { name: "Purple/+1", var: "--color-purple-p1", hex: "#5C004D", family: "Other" },
                { name: "Teal", var: "--color-teal", hex: "#32BCAD", family: "Other" },
                { name: "Yellow", var: "--color-yellow", hex: "#FFDD00", family: "Other" },
            ].map((c) => (
                <div
                    key={c.name}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: 12,
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                        backgroundColor: "#fafafa",
                    }}
                >
                    <div
                        style={{
                            background: `var(${c.var})`,
                            width: 60,
                            height: 60,
                            border: "1px solid #ddd",
                            borderRadius: 6,
                            marginBottom: 8,
                        }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, textAlign: "center" }}>
                        {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>
                        {c.hex}
                    </div>
                    <div style={{ fontSize: 10, color: "#999", fontFamily: "monospace" }}>
                        var({c.var})
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export const Gradients = () => (
    <div className="p-4">
        <h3 className="mb-4 text-xl font-semibold">Gradient Collection</h3>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
                {
                    className: "gradient-background",
                    label: "Background",
                    stops: "#FFFFFF → #ECECEC",
                    usage: "Page backgrounds",
                },
                {
                    className: "gradient-red",
                    label: "Red",
                    stops: "#7C223F → #A72244 → #D71440 → #ED1556",
                    usage: "Red themed elements",
                },
                {
                    className: "gradient-blue",
                    label: "Blue",
                    stops: "#181C62 → #0054A6 → #1B75BC → #5DA9DD",
                    usage: "Blue themed elements",
                },
                {
                    className: "gradient-green",
                    label: "Green",
                    stops: "#007C48 → #07B152 → #D5ED4C",
                    usage: "Green themed elements",
                },
            ].map((g) => (
                <div
                    key={g.label}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 200,
                        padding: 16,
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                        backgroundColor: "#fafafa",
                        marginBottom: 20,
                    }}
                >
                    <div
                        className={g.className}
                        style={{
                            width: 120,
                            height: 80,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            marginBottom: 12,
                        }}
                    />
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                        Gradient/{g.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", textAlign: "center", marginBottom: 4 }}>
                        {g.stops}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", textAlign: "center" }}>
                        {g.usage}
                    </div>
                    <div style={{ fontSize: 10, color: "#999", fontFamily: "monospace", marginTop: 4 }}>
                        .{g.className}
                    </div>
                </div>
            ))}
        </div>
    </div>
);
