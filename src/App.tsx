import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';

function App() {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  return (
    <div className="App">
      <Dashboard 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
    </div>
  );
}

export default App;