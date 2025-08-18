import "./assets/fonts/typography.css";
import "./assets/colors/colors.css";
import "./assets/colors/gradients.css";
import ColorsPreview from "./assets/colors/colors-preview";
import TypographyPreview from "./assets/fonts/typography-preview";

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Interdisciplinary Learning Analytics
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive dashboard for cross-disciplinary educational insights
          </p>
        </header>
        {/* Cards and Buttons removed as requested */}

        {/* Typography Preview */}
        <TypographyPreview />

        {/* Colors Preview */}
        <ColorsPreview />

      </div>
    </div>
  );
}

export default App;
