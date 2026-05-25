import React from 'react'; 
import ReactDOM from 'react-dom/client'; 
import App from './App'; 
import "./index.css";

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element. Check that your index.html has a <div id="root"></div>');
}

ReactDOM.createRoot(rootElement).render( 
  <React.StrictMode> 
    <App /> 
  </React.StrictMode> 
);