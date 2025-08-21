import "./assets/fonts/typography.css";
import "./assets/colors/colors.css";
import "./assets/colors/gradients.css";
import Sidebar from "./components/layout/sidebar";

function App() {
  return (
    <div className="min-h-screen bg-gradient-background p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Interdisciplinary Learning Analytics
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive dashboard for cross-disciplinary educational insights
          </p>
        </header>

        <Sidebar></Sidebar>

      </div>
    </div>
  );
}

export default App;
