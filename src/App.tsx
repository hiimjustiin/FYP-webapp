import './assets/fonts/typography.css';

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
        <section className="border-2 p-4">
          <h2 className="mb-4 text-2xl font-bold underline">Typography Preview</h2>
          <div>
            <div className="heading-1 mb-2">Heading 1</div>
            <div className="heading-2 mb-2">Heading 2</div>
            <div className="heading-3 mb-2">Heading 3</div>
            <div className="heading-4 mb-2">Heading 4</div>
            <div className="heading-5 mb-2">Heading 5</div>
            <div className="heading-6 mb-2">Heading 6</div>
            <div className="subtitle-1 mb-2">Subtitle 1</div>
            <div className="subtitle-2 mb-2">Subtitle 2</div>
            <div className="subtitle-3 mb-2">Subtitle 3</div>
            <div className="body-1 mb-2">Body 1</div>
            <div className="body-2 mb-2">Body 2</div>
            <div className="button mb-2">Button</div>
            <div className="caption mb-2">Caption</div>
            <div className="overline mb-2">Overline</div>
            <div className="monospace mb-2">monospace</div>
            <div className="sublabel mb-2">Sublabel</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
