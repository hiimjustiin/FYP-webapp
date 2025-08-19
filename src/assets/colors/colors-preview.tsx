const ColorsPreview = () => {
  return (
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
          {
            name: "Red/NTU",
            var: "--color-red-ntu",
            hex: "#D71440",
            bold: true,
          },
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
          {
            name: "Blue/NTU",
            var: "--color-blue-ntu",
            hex: "#181C62",
            bold: true,
          },
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
};

export default ColorsPreview;
