import "./assets/fonts/typography.css";
import "./assets/colors/colors.css";
import "./assets/colors/gradients.css";
import Sidebar from "./components/layout/sidebar";

function App() {
  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <div className="p-4 sm:p-8 m:p-10 lg:p-12">
            <div className="mx-auto max-w-7xl">
              <header className="mb-8">
                <h1 className="heading-5">
                  Interdisciplinary Learning Analytics
                </h1>
                <p className="subtitle-2 text-grey-80">
                  Comprehensive dashboard for cross-disciplinary educational insights
                </p>
              </header>

              <div className="space-y-6">
                <div className="dashboard-card px-4 py-2">
                  <h5 className="heading-5">Hi User!</h5>
                  <p className="subtitle-2 text-grey-80">Let’s begin a new project with ILA!</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
