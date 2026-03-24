let events = [];

export function setupDashboard(user) {
  document.getElementById("welcome").innerText =
    `Welcome ${user.displayName}`;

  const addBtn = document.getElementById("addEventBtn");

  addBtn.addEventListener("click", () => {
    const newEvent = {
      title: document.getElementById("title").value,
      date: document.getElementById("date").value,
      start: document.getElementById("startTime").value,
      end: document.getElementById("endTime").value
    };
    if (!newEvent.title || !newEvent.date || !newEvent.start || !newEvent.end) {
      alert("Fill all fields 😤");
      return;
    }

    if (isClash(newEvent)) {
      alert("⚠️ Event clash detected!");
      return;
    }

    events.push(newEvent);
    renderEvents();
  });
}

function isClash(newEvent) {
  return events.some(e =>
    e.date === newEvent.date &&
    newEvent.start < e.end &&
    newEvent.end > e.start
  );
}

function renderEvents() {
  const list = document.getElementById("eventList");
  list.innerHTML = "";

  events.sort((a,b) => a.start.localeCompare(b.start));

  events.forEach(e => {
    const li = document.createElement("li");
    li.innerText = `${e.title} (${e.start}-${e.end})`;
    list.appendChild(li);
  });
}