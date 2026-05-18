function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 p-8">
      <div className="text-center max-w-2xl">
        {/* Logo + Title */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl text-white">🌬️</span>
          </div>
          <h1 className="text-6xl font-bold text-brand-700 mb-2">Nishwas</h1>
          <p className="text-2xl text-gray-500 font-bangla" lang="bn">
            নিশ্বাস
          </p>
        </div>

        {/* Tagline */}
        <p className="text-lg text-gray-600 mb-8">Breathe better. Live smarter.</p>
        {/* Footer */}
        <p className="text-sm text-gray-400 mt-8">
          Bangladesh-focused weather, air quality & health-aware platform
        </p>
      </div>
    </div>
  );
}

export default App;
