// Ping backend to wake it up
async function wakeBackend() {
  try {
    const res = await fetch("https://cahtroom-rtnv.onrender.com/ping", { cache: "no-store" });
    if (res.ok) {
      console.log("backend is awake");
    } else {
      console.warn("ping responded but not OK");
    }
  } catch (err) {
    console.warn("ping failed (backend may be waking up)", err);
  }
}

// Add message to DOM
function addMessage(msg) {
  const msgEl = document.createElement("p");

let time = "";
if (msg.timestamp) {
  const date = new Date(msg.timestamp);
  time = date.toLocaleString([], {
    year: "numeric",
    month: "short",   // "short" gives Jan, Feb, etc. Use "long" or "2-digit" if you want different formats
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}


  const timeHtml = `<span style="color: green;">(${time})</span>`;

  msgEl.innerHTML = `${msg.user}: ${msg.text} ${timeHtml}`;
  if (msg.admin === 1) {msgEl.style.color = "red"; msgEl.innerHTML = `${msg.user}: ${msg.text} <span style="color: purple;">&lt;--owner</span> ${timeHtml}`;}
  if (msg.admin === 2) msgEl.style.color = "blue";

  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Start everything
async function startApp() {
  await wakeBackend(); // wake up the backend before connecting

  // Load old messages first
  try {
    const res = await fetch("https://cahtroom-rtnv.onrender.com/messages");
    const messages = await res.json();
    messages.forEach(addMessage);
  } catch (err) {
    console.warn("failed to load old messages:", err);
  }

  // Connect to socket for new messages
  const socket = io("https://cahtroom-rtnv.onrender.com", {
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("connected to backend via socket");
  });

  socket.on("new_message", (msg) => {
    addMessage(msg);
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connection error:", err);
  });

  // Expose sendMessage function for the button
  window.sendMessage = async function () {
    const messageInput = document.getElementById("messageInput");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("bypassPassword");

    const text = messageInput.value;
    const user = usernameInput.value;
    const password = passwordInput.value;

    const res = await fetch("https://cahtroom-rtnv.onrender.com/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "failed to send message");
    } else {
      messageInput.value = "";
    }
  };
}

const messagesDiv = document.getElementById("messages");
startApp();
