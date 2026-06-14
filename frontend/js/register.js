import { auth } from "./firebase.js";

const API_URL = (() => {
  if (typeof window !== 'undefined' && window.API_BASE_OVERRIDE) {
    return String(window.API_BASE_OVERRIDE).replace(/\/$/, '');
  }

  try {
    const viteApiUrl = import.meta.env.VITE_API_URL;
    if (viteApiUrl) return String(viteApiUrl).replace(/\/$/, '');
  } catch (error) {
    // ignore and use fallback
  }

  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return 'http://localhost:5001';
    }
  }

  return '';
})();

window.registerTeam = async () => {
  const user = auth.currentUser;
  const token = await user.getIdToken();

  const data = {
    teamName: document.getElementById("teamName").value,
    leaderName: document.getElementById("leader").value
  };

  console.log('[register.js] fetch register', `${API_URL}/api/teams/register`, data);

  await fetch(`${API_URL}/api/teams/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  alert("Team Registered");
};