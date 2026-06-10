import { auth } from "./firebase.js";

const API_URL = (() => {
  try {
    const viteApiUrl = import.meta.env.VITE_API_URL;
    if (viteApiUrl) return String(viteApiUrl).replace(/\/$/, '');
  } catch (error) {
    // ignore and use fallback
  }

  return 'https://event-management-frontend-og23.onrender.com';
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