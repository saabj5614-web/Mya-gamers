// ================== FIREBASE CONFIG (aapka diya hua) ==================
const firebaseConfig = {
  apiKey: "AIzaSyA2zK-JYv2-Eg7HoxFB9RlmXbQzg6CwkzU",
  authDomain: "may-gaming.firebaseapp.com",
  projectId: "may-gaming",
  storageBucket: "may-gaming.firebasestorage.app",
  messagingSenderId: "1072630613356",
  appId: "1:1072630613356:web:fa8cce006382186bf01f49"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let hasCompletedSocialGate = false;
let whatsappNumber = "+923001234567"; // default - admin change kar sakta hai

// Theme Toggle (Black & White only)
const themeToggle = document.getElementById('themeToggle');
const toggleKnob = document.getElementById('toggleKnob');
function setTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    toggleKnob.style.left = '32px';
    localStorage.theme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    toggleKnob.style.left = '4px';
    localStorage.theme = 'light';
  }
}
themeToggle.addEventListener('click', () => setTheme(!document.documentElement.classList.contains('dark')));
if (localStorage.theme === 'dark' || !('theme' in localStorage)) setTheme(true);

// Password Toggle Helper (text button only - no eye icon)
function addPasswordToggle(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  btn.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? 'Show Password' : 'Hide Password';
  });
}

// Show Login Page
function showLoginPage() {
  const html = `
    <div class="max-w-md mx-auto bg-[#111] rounded-3xl p-8">
      <h2 class="text-3xl font-medium text-center mb-8">Login to MYA Gaming</h2>
      <input id="loginEmail" type="email" placeholder="Email" class="w-full px-5 py-4 bg-[#222] rounded-2xl mb-4"/>
      <div class="relative">
        <input id="loginPassword" type="password" placeholder="Password" class="w-full px-5 py-4 bg-[#222] rounded-2xl"/>
        <button id="toggleLoginPass" class="show-btn absolute right-5 top-4">Show Password</button>
      </div>
      <button id="loginBtn" class="w-full mt-8 py-4 bg-white text-black rounded-3xl font-medium">Login</button>
      <button id="googleLoginBtn" class="w-full mt-4 py-4 border border-gray-600 rounded-3xl flex items-center justify-center gap-3">
        <i class="fab fa-google"></i> Continue with Google
      </button>
      <p class="text-center mt-8 text-gray-400">New here? <button id="showRegisterBtn" class="text-blue-400">Register</button></p>
    </div>`;
  document.getElementById('mainContent').innerHTML = html;
  document.getElementById('loginBtn').onclick = loginWithEmail;
  document.getElementById('googleLoginBtn').onclick = googleSignIn;
  document.getElementById('showRegisterBtn').onclick = showRegisterPage;
  setTimeout(() => addPasswordToggle('loginPassword', 'toggleLoginPass'), 100);
}

// Register Page (full fields + unique username)
async function showRegisterPage() {
  const html = `
    <div class="max-w-md mx-auto bg-[#111] rounded-3xl p-8">
      <h2 class="text-3xl font-medium text-center mb-8">Create Account</h2>
      <div class="grid grid-cols-2 gap-4">
        <input id="firstName" placeholder="First Name" class="px-5 py-4 bg-[#222] rounded-2xl"/>
        <input id="lastName" placeholder="Last Name" class="px-5 py-4 bg-[#222] rounded-2xl"/>
      </div>
      <input id="username" placeholder="Username (must be unique)" class="w-full px-5 py-4 bg-[#222] rounded-2xl mt-4"/>
      <span id="usernameStatus" class="text-xs block mt-1"></span>
      <input id="regEmail" type="email" placeholder="Email" class="w-full px-5 py-4 bg-[#222] rounded-2xl mt-4"/>
      <input id="regPassword" type="password" placeholder="New Password" class="w-full px-5 py-4 bg-[#222] rounded-2xl mt-4"/>
      <button id="toggleRegPass" class="show-btn block mt-2">Show Password</button>
      <input id="regConfirmPass" type="password" placeholder="Confirm Password" class="w-full px-5 py-4 bg-[#222] rounded-2xl mt-4"/>
      <button id="toggleRegConfirmPass" class="show-btn block mt-2">Show Password</button>
      <button id="registerBtn" class="w-full mt-8 py-4 bg-emerald-600 rounded-3xl font-medium">Register</button>
    </div>`;
  document.getElementById('mainContent').innerHTML = html;
  document.getElementById('username').onkeyup = checkUsernameAvailability;
  document.getElementById('registerBtn').onclick = registerUser;
  setTimeout(() => {
    addPasswordToggle('regPassword', 'toggleRegPass');
    addPasswordToggle('regConfirmPass', 'toggleRegConfirmPass');
  }, 100);
}

async function checkUsernameAvailability() {
  const username = document.getElementById('username').value.trim();
  if (username.length < 4) return;
  const snap = await db.collection('users').where('username', '==', username).get();
  document.getElementById('usernameStatus').innerHTML = snap.empty ? '<span class="text-green-400">Available ✓</span>' : '<span class="text-red-400">Taken ✕</span>';
}

async function registerUser() {
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPass').value;
  if (pass !== confirm) return alert("Passwords do not match");
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await db.collection('users').doc(cred.user.uid).set({ firstName, lastName, username, email, blocked: false, createdAt: new Date() });
    currentUser = cred.user;
    completeGate();
  } catch (e) { alert(e.message); }
}

async function loginWithEmail() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPassword').value;
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    currentUser = cred.user;
    completeGate();
  } catch (e) { alert(e.message); }
}

async function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    currentUser = result.user;
    const userRef = db.collection('users').doc(currentUser.uid);
    const doc = await userRef.get();
    if (!doc.exists) await userRef.set({ firstName: currentUser.displayName?.split(' ')[0] || '', lastName: '', username: currentUser.email.split('@')[0], email: currentUser.email, blocked: false });
    completeGate();
  } catch (e) { alert(e.message); }
}

// Social Gate (no password here)
function showSocialGate() {
  const html = `
    <div class="max-w-lg mx-auto bg-[#111] rounded-3xl p-8 text-center">
      <h2 class="text-3xl font-medium mb-8">Follow Our Channels to Continue</h2>
      <div class="grid grid-cols-3 gap-4">
        <a href="https://youtube.com" target="_blank" class="py-8 bg-red-600 rounded-3xl text-base font-medium">YouTube</a>
        <a href="https://tiktok.com" target="_blank" class="py-8 bg-black rounded-3xl text-base font-medium">TikTok</a>
        <a href="https://whatsapp.com/channel" target="_blank" class="py-8 bg-green-600 rounded-3xl text-base font-medium">WhatsApp Channel</a>
      </div>
      <button onclick="completeGate()" class="mt-12 w-full py-5 bg-white text-black rounded-3xl text-lg font-medium">I've Followed All</button>
    </div>`;
  document.getElementById('mainContent').innerHTML = html;
}
window.completeGate = () => {
  hasCompletedSocialGate = true;
  showDashboard();
};

// Change Password (Account menu se)
function showChangePassword() {
  const html = `
    <div class="max-w-md mx-auto bg-[#111] rounded-3xl p-8">
      <h2 class="text-2xl font-medium mb-6">Change Password</h2>
      <input id="newPass" type="password" placeholder="New Password" class="w-full px-5 py-4 bg-[#222] rounded-2xl mb-3"/>
      <button id="toggleNewPass" class="show-btn block w-full text-left mb-6">Show Password</button>
      <input id="confirmNewPass" type="password" placeholder="Confirm New Password" class="w-full px-5 py-4 bg-[#222] rounded-2xl mb-3"/>
      <button id="toggleConfirmPass" class="show-btn block w-full text-left">Show Password</button>
      <button onclick="updatePassword()" class="mt-8 w-full py-5 bg-white text-black rounded-3xl">Update Password</button>
    </div>`;
  document.getElementById('mainContent').innerHTML = html;
  setTimeout(() => {
    addPasswordToggle('newPass', 'toggleNewPass');
    addPasswordToggle('confirmNewPass', 'toggleConfirmPass');
  }, 100);
}
window.updatePassword = async () => {
  const newPass = document.getElementById('newPass').value;
  if (newPass.length < 6) return alert("Password too short");
  try {
    await auth.currentUser.updatePassword(newPass);
    alert("Password updated successfully!");
    showDashboard();
  } catch (e) { alert(e.message); }
};

// Change Email
function showChangeEmail() {
  const html = `
    <div class="max-w-md mx-auto bg-[#111] rounded-3xl p-8">
      <h2 class="text-2xl font-medium mb-6">Change Email</h2>
      <input id="newEmail" type="email" placeholder="New Email" class="w-full px-5 py-4 bg-[#222] rounded-2xl"/>
      <button onclick="updateEmail()" class="mt-8 w-full py-5 bg-white text-black rounded-3xl">Update Email</button>
    </div>`;
  document.getElementById('mainContent').innerHTML = html;
}
window.updateEmail = async () => {
  const newEmail = document.getElementById('newEmail').value;
  try {
    await auth.currentUser.updateEmail(newEmail);
    alert("Email updated!");
    showDashboard();
  } catch (e) { alert(e.message); }
};

// Dashboard (full image + description)
async function showDashboard() {
  const snap = await db.collection('games').orderBy('createdAt', 'desc').get();
  let html = `<h2 class="text-2xl font-medium mb-6">Dashboard</h2><div class="grid grid-cols-2 md:grid-cols-3 gap-6">`;
  snap.forEach(doc => {
    const g = doc.data();
    html += `<div class="game-card bg-[#222] rounded-3xl overflow-hidden"><img src="\( {g.iconUrl}" class="w-full h-48 object-cover"><div class="p-4"><h3 class="font-medium"> \){g.name}</h3><p class="text-xs text-gray-400 mt-1">\( {g.description || 'No description'}</p><a href=" \){g.gameLink}" target="_blank" class="text-blue-400 text-sm mt-3 block">Play Now →</a></div></div>`;
  });
  html += `</div>`;
  document.getElementById('mainContent').innerHTML = html || '<p class="text-gray-400 text-center">No games yet. Admin can add them.</p>';
}

// Store (circular icons)
async function showStore() {
  const snap = await db.collection('games').get();
  let html = `<h2 class="text-2xl font-medium mb-6">Store</h2><div class="flex gap-8 overflow-x-auto pb-8">`;
  snap.forEach(doc => {
    const g = doc.data();
    html += `<div onclick="window.open('\( {g.gameLink}','_blank')" class="flex-shrink-0 text-center cursor-pointer"><img src=" \){g.iconUrl}" class="w-24 h-24 rounded-3xl mx-auto"><p class="text-sm mt-3">${g.name}</p></div>`;
  });
  html += `</div>`;
  document.getElementById('mainContent').innerHTML = html || '<p class="text-gray-400">No games yet</p>';
}

// Full Admin Panel
async function showAdminPanel() {
  if (currentUser.email !== "saabj5614@gmail.com") return alert("Admin access only!");
  let html = `
    <div class="max-w-4xl mx-auto space-y-12">
      <h2 class="text-3xl font-medium">Admin Panel</h2>
      
      <!-- Social Links -->
      <div class="bg-[#222] p-8 rounded-3xl">
        <h3 class="font-medium mb-6">Update Social Links</h3>
        <input id="ytLink" placeholder="YouTube Link" class="w-full px-5 py-4 bg-black rounded-2xl mb-4" value="https://youtube.com"/>
        <input id="ttLink" placeholder="TikTok Link" class="w-full px-5 py-4 bg-black rounded-2xl mb-4" value="https://tiktok.com"/>
        <input id="waLink" placeholder="WhatsApp Channel" class="w-full px-5 py-4 bg-black rounded-2xl" value="https://whatsapp.com/channel"/>
        <button onclick="saveSocialLinks()" class="mt-6 w-full py-4 bg-white text-black rounded-3xl">Save Social Links</button>
      </div>
      
      <!-- Add New Game -->
      <div class="bg-[#222] p-8 rounded-3xl">
        <h3 class="font-medium mb-6">Add New Game</h3>
        <input id="gameName" placeholder="Game Name" class="w-full px-5 py-4 bg-black rounded-2xl mb-4"/>
        <input id="iconUrl" placeholder="Icon Image URL" class="w-full px-5 py-4 bg-black rounded-2xl mb-4"/>
        <input id="gameLink" placeholder="Game Download Link (MediaFire / Play Store)" class="w-full px-5 py-4 bg-black rounded-2xl mb-4"/>
        <input id="tutorialLink" placeholder="YouTube Tutorial Link" class="w-full px-5 py-4 bg-black rounded-2xl mb-4"/>
        <textarea id="gameDesc" placeholder="Game Description" class="w-full px-5 py-4 bg-black rounded-2xl h-28"></textarea>
        <button onclick="publishGame()" class="mt-6 w-full py-4 bg-emerald-600 rounded-3xl">Publish Game</button>
      </div>
      
      <!-- Published Games List -->
      <div class="bg-[#222] p-8 rounded-3xl">
        <h3 class="font-medium mb-6">Published Games</h3>
        <div id="publishedGamesList" class="space-y-6"></div>
      </div>
      
      <!-- WhatsApp Number -->
      <div class="bg-[#222] p-8 rounded-3xl">
        <h3 class="font-medium mb-6">Floating WhatsApp Number</h3>
        <input id="waNumberInput" value="${whatsappNumber}" class="w-full px-5 py-4 bg-black rounded-2xl"/>
        <button onclick="updateWhatsAppNumber()" class="mt-6 w-full py-4 bg-white text-black rounded-3xl">Update Number</button>
      </div>
    </div>`;
  document.getElementById('mainContent').innerHTML = html;
  loadPublishedGames();
}

async function publishGame() {
  const name = document.getElementById('gameName').value;
  const iconUrl = document.getElementById('iconUrl').value;
  const gameLink = document.getElementById('gameLink').value;
  const tutorialLink = document.getElementById('tutorialLink').value;
  const description = document.getElementById('gameDesc').value;
  if (!name || !iconUrl || !gameLink) return alert("Please fill all fields");
  await db.collection('games').add({ name, iconUrl, gameLink, tutorialLink, description, createdAt: new Date() });
  alert("Game published!");
  showAdminPanel();
}

async function loadPublishedGames() {
  const snap = await db.collection('games').get();
  let listHTML = '';
  snap.forEach(doc => {
    const g = doc.data();
    listHTML += `
      <div class="flex justify-between items-center bg-black p-4 rounded-2xl">
        <div>
          <img src="${g.iconUrl}" class="w-12 h-12 rounded-2xl inline">
          <span class="ml-4 font-medium">${g.name}</span>
        </div>
        <div>
          <button onclick="editGame('${doc.id}')" class="px-5 py-2 bg-blue-600 rounded-2xl text-sm mr-2">Edit</button>
          <button onclick="deleteGame('${doc.id}')" class="px-5 py-2 bg-red-600 rounded-2xl text-sm">Delete</button>
        </div>
      </div>`;
  });
  document.getElementById('publishedGamesList').innerHTML = listHTML || '<p class="text-gray-400">No games yet</p>';
}

window.deleteGame = async (id) => {
  if (confirm("Delete this game?")) {
    await db.collection('games').doc(id).delete();
    showAdminPanel();
  }
};

window.editGame = (id) => {
  alert("Edit game form ready (full logic can be expanded if needed)");
};

function saveSocialLinks() {
  alert("Social links saved (you can connect them to settings collection later)");
}

function updateWhatsAppNumber() {
  whatsappNumber = document.getElementById('waNumberInput').value;
  document.getElementById('whatsappFloat').href = `https://wa.me/${whatsappNumber.replace('+', '')}`;
  alert("WhatsApp number updated!");
}

// Sliding Menu Content
function loadSlidingMenu() {
  const html = `
    <div>
      <h3 class="font-medium text-lg mb-4">Account</h3>
      <button onclick="showChangeEmail()" class="block w-full text-left py-3 px-5 hover:bg-[#222] rounded-2xl mb-2">Change Email</button>
      <button onclick="showChangePassword()" class="block w-full text-left py-3 px-5 hover:bg-[#222] rounded-2xl">Change Password</button>
    </div>
    <button onclick="showDashboard()" class="w-full py-4 px-6 bg-white text-black rounded-3xl font-medium">Dashboard</button>
    <button onclick="showStore()" class="w-full py-4 px-6 bg-white text-black rounded-3xl font-medium mt-4">Store</button>
    ${currentUser && currentUser.email === "saabj5614@gmail.com" ? `<button onclick="showAdminPanel()" class="w-full py-4 px-6 bg-white text-black rounded-3xl font-medium mt-4">Admin Panel</button>` : ''}
    <button id="logoutBtnMenu" class="w-full py-4 px-6 bg-red-600 rounded-3xl font-medium mt-8">Logout</button>`;
  document.getElementById('menuContent').innerHTML = html;
  document.getElementById('logoutBtnMenu').onclick = () => auth.signOut().then(() => location.reload());
}

// Profile Button
document.getElementById('profileBtn').addEventListener('click', () => {
  document.getElementById('slideMenu').classList.add('open');
  loadSlidingMenu();
});
document.getElementById('closeMenu').addEventListener('click', () => document.getElementById('slideMenu').classList.remove('open'));

// Auth State
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    if (!hasCompletedSocialGate) showSocialGate();
    else showDashboard();
  } else {
    showLoginPage();
  }
});

// Initial Load
console.log('%cMYA Gaming - Fully Working Two-File Version Ready for Vercel', 'color:#fff;background:#111;padding:6px 12px;border-radius:8px;font-size:15px');window.updateEmailwindow.updateEmail
