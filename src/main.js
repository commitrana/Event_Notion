import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc,
  updateDoc,
  arrayUnion,
  setDoc,
  getDoc
} from "firebase/firestore";

// DOM Elements
let currentUser = null;
let userRole = null;

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, setting up event listeners...");
  
  // Login buttons
  const studentLoginBtn = document.getElementById("studentLoginBtn");
  const societyLoginBtn = document.getElementById("societyLoginBtn");
  const googleLoginBtn = document.getElementById("loginBtn");

  if (studentLoginBtn) {
    studentLoginBtn.addEventListener("click", () => loginWithRole("student"));
  }
  if (societyLoginBtn) {
    societyLoginBtn.addEventListener("click", () => loginWithRole("society"));
  }
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => loginWithRole("student"));
  }

  // Check if user is already logged in
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User already logged in:", user.email);
      currentUser = user;
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userRole = userDoc.data().role;
        if (userRole === "student") {
          showStudentDashboard(user);
          await loadStudentData();
        } else {
          showSocietyDashboard(user);
          await loadSocietyData();
        }
      }
    }
  });
});

async function loginWithRole(role) {
  console.log("Attempting to login with role:", role);
  
  try {
    // Show loading state
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = "Signing in...";
    }

    const result = await signInWithPopup(auth, provider);
    console.log("Sign in successful:", result.user.email);
    
    const user = result.user;
    currentUser = user;
    userRole = role;

    // Store user role in Firestore
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        role: role,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });
      console.log("Created new user document with role:", role);
    } else {
      await updateDoc(userRef, {
        role: role,
        lastLogin: new Date().toISOString()
      });
      console.log("Updated existing user with role:", role);
    }

    // Show appropriate dashboard
    if (role === "student") {
      showStudentDashboard(user);
      await loadStudentData();
    } else {
      showSocietyDashboard(user);
      await loadSocietyData();
    }
    
  } catch (error) {
    console.error("Login error details:", error);
    
    // Handle specific error cases
    if (error.code === 'auth/popup-blocked') {
      alert("Popup was blocked! Please allow popups for this site and try again.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      console.log("User closed the popup");
    } else {
      alert(`Login failed: ${error.message}\nPlease try again.`);
    }
  } finally {
    const loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign in with Google";
    }
  }
}

function showStudentDashboard(user) {
  console.log("Showing student dashboard for:", user.displayName);
  
  // Hide login section
  const loginSection = document.getElementById("loginSection");
  if (loginSection) loginSection.classList.add("hidden");
  
  // Show student dashboard
  const dashboard = document.getElementById("studentDashboard");
  if (dashboard) dashboard.classList.remove("hidden");
  
  // Update welcome message
  const welcomeElement = document.getElementById("studentWelcome");
  const emailElement = document.getElementById("studentEmail");
  if (welcomeElement) welcomeElement.innerText = `Welcome, ${user.displayName || user.email}`;
  if (emailElement) emailElement.innerText = user.email;
  
  // Setup tabs
  setupTabs();
  
  // Setup logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  
  // Setup add class button
  const addClassBtn = document.getElementById("addClassBtn");
  if (addClassBtn) addClassBtn.addEventListener("click", addClass);
}

function showSocietyDashboard(user) {
  console.log("Showing society dashboard for:", user.displayName);
  
  // Hide login section
  const loginSection = document.getElementById("loginSection");
  if (loginSection) loginSection.classList.add("hidden");
  
  // Show society dashboard
  const dashboard = document.getElementById("societyDashboard");
  if (dashboard) dashboard.classList.remove("hidden");
  
  // Update welcome message
  const welcomeElement = document.getElementById("societyWelcome");
  const emailElement = document.getElementById("societyEmail");
  if (welcomeElement) welcomeElement.innerText = `Welcome, ${user.displayName || user.email}`;
  if (emailElement) emailElement.innerText = user.email;
  
  // Setup tabs
  setupSocietyTabs();
  
  // Setup logout
  const logoutBtn = document.getElementById("logoutBtnSociety");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
  
  // Setup create event button
  const createEventBtn = document.getElementById("createEventBtn");
  if (createEventBtn) createEventBtn.addEventListener("click", createEvent);
}

function setupTabs() {
  const tabs = document.querySelectorAll("#studentDashboard .tab-btn");
  console.log("Setting up tabs, found:", tabs.length);
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      console.log("Switching to tab:", tabId);
      
      // Hide all tab contents
      document.querySelectorAll("#studentDashboard .tab-content").forEach(content => {
        content.classList.add("hidden");
      });
      
      // Show selected tab content
      const selectedTab = document.getElementById(`${tabId}Tab`);
      if (selectedTab) selectedTab.classList.remove("hidden");
      
      // Update active tab styling
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      // Load data when switching tabs
      if (tabId === "timeline") updateTimeline();
      if (tabId === "events") loadEvents();
      if (tabId === "classes") loadClasses();
    });
  });
}

function setupSocietyTabs() {
  const tabs = document.querySelectorAll("#societyDashboard .tab-btn");
  console.log("Setting up society tabs, found:", tabs.length);
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      console.log("Switching to society tab:", tabId);
      
      // Hide all tab contents
      document.querySelectorAll("#societyDashboard .tab-content").forEach(content => {
        content.classList.add("hidden");
      });
      
      // Show selected tab content
      const selectedTab = document.getElementById(`${tabId}EventTab`);
      if (selectedTab) selectedTab.classList.remove("hidden");
      
      // Update active tab styling
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      // Load data when switching tabs
      if (tabId === "manage") loadSocietyEvents();
      if (tabId === "registrations") loadRegistrations();
    });
  });
}

async function addClass() {
  console.log("Adding new class...");
  
  const classData = {
    title: document.getElementById("classTitle").value,
    day: document.getElementById("classDay").value,
    startTime: document.getElementById("classStartTime").value,
    endTime: document.getElementById("classEndTime").value,
    venue: document.getElementById("classVenue").value,
    userId: currentUser.uid,
    createdAt: new Date().toISOString()
  };
  
  if (!classData.title || !classData.day || !classData.startTime || !classData.endTime) {
    alert("Please fill all required fields!");
    return;
  }
  
  try {
    const docRef = await addDoc(collection(db, "classes"), classData);
    console.log("Class added with ID:", docRef.id);
    alert("Class added successfully!");
    clearClassForm();
    await loadClasses();
    await updateTimeline();
  } catch (error) {
    console.error("Error adding class:", error);
    alert("Failed to add class. Please check your internet connection and try again.");
  }
}

function clearClassForm() {
  document.getElementById("classTitle").value = "";
  document.getElementById("classDay").value = "";
  document.getElementById("classStartTime").value = "";
  document.getElementById("classEndTime").value = "";
  document.getElementById("classVenue").value = "";
}

async function loadClasses() {
  console.log("Loading classes for user:", currentUser.uid);
  
  try {
    const q = query(collection(db, "classes"), where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    const classes = [];
    querySnapshot.forEach(doc => {
      classes.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("Loaded classes:", classes.length);
    displayClasses(classes);
    return classes;
  } catch (error) {
    console.error("Error loading classes:", error);
    return [];
  }
}

function displayClasses(classes) {
  const container = document.getElementById("classesList");
  if (!container) return;
  
  if (classes.length === 0) {
    container.innerHTML = "<p style='color: #666;'>No classes added yet. Add your schedule above!</p>";
    return;
  }
  
  container.innerHTML = classes.map(cls => `
    <div class="class-item">
      <div class="class-info">
        <div class="class-name"><strong>${escapeHtml(cls.title)}</strong></div>
        <div class="class-time">📅 ${cls.day} | ⏰ ${cls.startTime} - ${cls.endTime}</div>
        <div class="class-venue">📍 ${cls.venue || "No venue specified"}</div>
      </div>
      <button onclick="window.deleteClass('${cls.id}')" class="remove-class">Remove</button>
    </div>
  `).join("");
}

async function loadEvents() {
  console.log("Loading all events...");
  
  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    const events = [];
    querySnapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log("Loaded events:", events.length);
    displayEvents(events);
    return events;
  } catch (error) {
    console.error("Error loading events:", error);
    return [];
  }
}

function displayEvents(events) {
  const container = document.getElementById("eventsList");
  if (!container) return;
  
  if (events.length === 0) {
    container.innerHTML = "<p style='color: #666;'>No events available. Check back later!</p>";
    return;
  }
  
  container.innerHTML = events.map(event => `
    <div class="event-card">
      <div class="event-title"><strong>${escapeHtml(event.title)}</strong></div>
      <div class="event-details">📅 ${event.date} | 🕐 ${event.startTime} - ${event.endTime}</div>
      <div class="event-details">📍 ${event.venue || "Venue TBD"}</div>
      ${event.description ? `<div class="event-description">${escapeHtml(event.description)}</div>` : ""}
      ${event.registrationLink ? 
        `<a href="${event.registrationLink}" target="_blank" class="register-btn">Register Now</a>` : 
        `<button onclick="window.registerForEvent('${event.id}')" class="register-btn">Register</button>`
      }
    </div>
  `).join("");
}

async function loadSocietyEvents() {
  console.log("Loading society events for:", currentUser.uid);
  
  try {
    const q = query(collection(db, "events"), where("societyId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    const events = [];
    querySnapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("Loaded society events:", events.length);
    displaySocietyEvents(events);
  } catch (error) {
    console.error("Error loading society events:", error);
  }
}

function displaySocietyEvents(events) {
  const container = document.getElementById("societyEventsList");
  if (!container) return;
  
  if (events.length === 0) {
    container.innerHTML = "<p style='color: #666;'>You haven't created any events yet.</p>";
    return;
  }
  
  container.innerHTML = events.map(event => `
    <div class="event-card">
      <div class="event-title"><strong>${escapeHtml(event.title)}</strong></div>
      <div class="event-details">📅 ${event.date} | 🕐 ${event.startTime} - ${event.endTime}</div>
      <div class="event-details">📍 ${event.venue || "Venue TBD"}</div>
      <div class="event-details">👥 Registered: ${event.registeredUsers?.length || 0}</div>
      <button onclick="window.deleteEvent('${event.id}')" class="delete-btn">Delete Event</button>
    </div>
  `).join("");
}

async function createEvent() {
  console.log("Creating new event...");
  
  const eventData = {
    title: document.getElementById("eventTitle").value,
    description: document.getElementById("eventDescription").value,
    date: document.getElementById("eventDate").value,
    startTime: document.getElementById("eventStartTime").value,
    endTime: document.getElementById("eventEndTime").value,
    venue: document.getElementById("eventVenue").value,
    registrationLink: document.getElementById("eventRegistrationLink").value,
    societyId: currentUser.uid,
    societyName: currentUser.displayName,
    registeredUsers: [],
    createdAt: new Date().toISOString()
  };
  
  if (!eventData.title || !eventData.date || !eventData.startTime || !eventData.endTime) {
    alert("Please fill all required fields!");
    return;
  }
  
  try {
    const docRef = await addDoc(collection(db, "events"), eventData);
    console.log("Event created with ID:", docRef.id);
    alert("Event created successfully!");
    clearEventForm();
    await loadSocietyEvents();
  } catch (error) {
    console.error("Error creating event:", error);
    alert("Failed to create event. Please try again.");
  }
}

function clearEventForm() {
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDescription").value = "";
  document.getElementById("eventDate").value = "";
  document.getElementById("eventStartTime").value = "";
  document.getElementById("eventEndTime").value = "";
  document.getElementById("eventVenue").value = "";
  document.getElementById("eventRegistrationLink").value = "";
}

async function registerForEvent(eventId) {
  console.log("Registering for event:", eventId);
  
  if (!currentUser) {
    alert("Please login first!");
    return;
  }
  
  try {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      registeredUsers: arrayUnion({
        uid: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email,
        registeredAt: new Date().toISOString()
      })
    });
    alert("Successfully registered for the event!");
    await loadEvents();
  } catch (error) {
    console.error("Error registering for event:", error);
    alert("Failed to register. Please try again.");
  }
}

async function deleteEvent(eventId) {
  if (confirm("Are you sure you want to delete this event?")) {
    try {
      await deleteDoc(doc(db, "events", eventId));
      alert("Event deleted successfully!");
      await loadSocietyEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event.");
    }
  }
}

async function loadRegistrations() {
  console.log("Loading registrations...");
  
  try {
    const q = query(collection(db, "events"), where("societyId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    const events = [];
    querySnapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    
    displayRegistrations(events);
  } catch (error) {
    console.error("Error loading registrations:", error);
  }
}

function displayRegistrations(events) {
  const container = document.getElementById("registrationsList");
  if (!container) return;
  
  const eventsWithRegistrations = events.filter(e => e.registeredUsers?.length > 0);
  
  if (eventsWithRegistrations.length === 0) {
    container.innerHTML = "<p style='color: #666;'>No registrations yet.</p>";
    return;
  }
  
  container.innerHTML = eventsWithRegistrations.map(event => `
    <div class="registration-card">
      <div class="registration-event"><strong>${escapeHtml(event.title)}</strong> (${event.date})</div>
      <ul class="registration-users">
        ${event.registeredUsers.map(user => `
          <li>👤 ${escapeHtml(user.name)} - ${escapeHtml(user.email)}</li>
        `).join("")}
      </ul>
    </div>
  `).join("");
}

async function loadStudentData() {
  console.log("Loading student data...");
  await loadClasses();
  await loadEvents();
  await updateTimeline();
}

async function updateTimeline() {
  console.log("Updating timeline...");
  
  try {
    const classes = await loadClasses();
    const events = await loadEvents();
    
    const timelineItems = [
      ...classes.map(c => ({ ...c, type: "class", date: getNextDate(c.day) })),
      ...events.map(e => ({ ...e, type: "event" }))
    ];
    
    // Filter out past events/classes
    const today = new Date().toISOString().split('T')[0];
    const upcomingItems = timelineItems.filter(item => item.date >= today);
    
    // Sort by date and time
    upcomingItems.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.startTime}`);
      const dateB = new Date(`${b.date} ${b.startTime}`);
      return dateA - dateB;
    });
    
    console.log("Timeline items:", upcomingItems.length);
    displayTimeline(upcomingItems);
    checkClashes(upcomingItems);
  } catch (error) {
    console.error("Error updating timeline:", error);
  }
}

function getNextDate(day) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = new Date();
  const targetDay = days.indexOf(day);
  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0) daysToAdd += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  return nextDate.toISOString().split('T')[0];
}

function displayTimeline(items) {
  const container = document.getElementById("timelineView");
  if (!container) return;
  
  if (items.length === 0) {
    container.innerHTML = "<p style='color: #666;'>No upcoming events or classes. Add your schedule!</p>";
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="timeline-item" style="border-left-color: ${item.type === 'class' ? '#4CAF50' : '#667eea'}">
      <div class="timeline-time">
        <strong>${item.date}</strong><br>
        ${item.startTime} - ${item.endTime}
      </div>
      <div class="timeline-content">
        <div class="timeline-title">
          ${item.type === "class" ? "📚" : "🎪"} <strong>${escapeHtml(item.title)}</strong>
        </div>
        <div class="timeline-details">
          ${item.type === "class" ? 
            `📍 ${item.venue || "No venue"}` : 
            `📍 ${item.venue || "Venue TBD"} | ${item.registeredUsers?.length || 0} registered`
          }
        </div>
      </div>
    </div>
  `).join("");
}

function checkClashes(items) {
  const clashes = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      
      if (item1.date === item2.date) {
        if (item1.startTime < item2.endTime && item1.endTime > item2.startTime) {
          clashes.push({ item1, item2 });
        }
      }
    }
  }
  
  // Remove any existing clash notification
  const existingNotification = document.querySelector(".clash-notification");
  if (existingNotification) existingNotification.remove();
  
  if (clashes.length > 0) {
    const clashMessage = clashes.map(c => 
      `⚠️ "${c.item1.title}" and "${c.item2.title}" overlap on ${c.item1.date}!`
    ).join("<br>");
    
    const timelineContainer = document.getElementById("timelineView");
    if (timelineContainer) {
      const clashDiv = document.createElement("div");
      clashDiv.className = "clash-notification";
      clashDiv.style.cssText = "background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 10px; margin-bottom: 20px;";
      clashDiv.innerHTML = `
        <strong>⚠️ Schedule Conflicts Detected:</strong><br>
        ${clashMessage}
      `;
      timelineContainer.insertBefore(clashDiv, timelineContainer.firstChild);
    }
  }
}

async function logout() {
  console.log("Logging out...");
  try {
    await signOut(auth);
    console.log("Logged out successfully");
    location.reload();
  } catch (error) {
    console.error("Logout error:", error);
    location.reload();
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// Make functions globally available for onclick handlers
window.deleteClass = async (classId) => {
  if (confirm("Are you sure you want to remove this class?")) {
    try {
      await deleteDoc(doc(db, "classes", classId));
      alert("Class removed successfully!");
      await loadClasses();
      await updateTimeline();
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to remove class.");
    }
  }
};

window.registerForEvent = registerForEvent;
window.deleteEvent = deleteEvent;

console.log("CampusSync application initialized!");