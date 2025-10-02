import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

// Smooth scroll to hash links
document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  if (t instanceof HTMLAnchorElement && t.hash && t.getAttribute("href")?.startsWith("#")) {
    e.preventDefault();
    const el = document.querySelector(t.hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
