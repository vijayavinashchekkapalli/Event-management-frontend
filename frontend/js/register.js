import { auth } from "./firebase.js";

const API_URL = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:5001';

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