import { auth, db, BACKEND_URL } from "./firebase-config.js";
import { 
  collection, doc, getDocs, setDoc, query, orderBy 
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { OfflineFashionMatcher } from "./matcher.js";
import { getLocalWeather } from "./weather.js";

const FASHION_CATEGORIES = {
  women: [
    "All", "Tops", "T-shirts", "Shirts", "Jeans", "Trousers", "Leggings", "Shorts", 
    "Skirts", "Dresses", "Gowns", "Sarees", "Kurtis", "Salwar suits", "Shoes", "Handbags", "Jewelry"
  ],
  men: [
    "All", "T-shirts", "Shirts", "Polo shirts", "Jeans", "Trousers", "Shorts", 
    "Suits", "Kurta", "Kurta pajama", "Sherwani", "Shoes", "Sneakers", "Watches"
  ],
  custom: ["All", "Tops", "Bottoms", "Ethnic", "Footwear", "Accessories"]
};

let currentUser = null;
let currentCollection = localStorage.getItem("preferred_collection") || "women";
let wardrobeItems = [];
let capturedBase64 = null;
window.demoActive = false;

window.addEventListener("DOMContentLoaded", async () => {
  setupCategories();
  
  const weather = await getLocalWeather();
  document.getElementById("weather-temp").innerText = `${weather.temp}°C`;

  auth.onAuthStateChanged(async (user) => {
    document.getElementById("splash-screen").style.display = "none";
    if (user) {
      currentUser = user;
      document.getElementById("auth-modal").classList.remove("active");
      document.getElementById("user-display-email").innerText = user.email;
      document.getElementById("user-display-name").innerText = user.displayName || "Fashion Enthusiast";
      if (user.photoURL) {
        const pic = document.getElementById("user-avatar-img");
        pic.src = user.photoURL;
        pic.style.display = "block";
        document.getElementById("user-avatar-initials").style.display = "none";
      }
      await loadWardrobe();
    } else if (!window.demoActive) {
      document.getElementById("auth-modal").classList.add("active");
    }
  });
});

function setupCategories() {
  const container = document.getElementById("category-pills");
  const selectElem = document.getElementById("item-category");
  container.innerHTML = "";
  selectElem.innerHTML = "";
  
  const list = FASHION_CATEGORIES[currentCollection] || FASHION_CATEGORIES.women;
  list.forEach((cat, idx) => {
    const chip = document.createElement("button");
    chip.className = `cat-chip ${idx === 0 ? "active" : ""}`;
    chip.innerText = cat;
    chip.onclick = () => filterByCategory(cat, chip);
    container.appendChild(chip);

    if (cat !== "All") {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.innerText = cat;
      selectElem.appendChild(opt);
    }
  });
  document.getElementById("collection-badge").innerText = currentCollection.toUpperCase();
}

export function updateFashionCollection(val) {
  currentCollection = val;
  localStorage.setItem("preferred_collection", val);
  setupCategories();
  renderGrid(wardrobeItems);
}
window.updateFashionCollection = updateFashionCollection;

export function switchView(name) {
  document.querySelectorAll(".app-view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById(`view-${name}`).classList.add("active");
  event.currentTarget.classList.add("active");
}
window.switchView = switchView;

async function loadWardrobe() {
  if (window.demoActive) {
    wardrobeItems = JSON.parse(localStorage.getItem("demo_wardrobe") || "[]");
    renderGrid(wardrobeItems);
    return;
  }
  if (!currentUser) return;
  try {
    const q = query(collection(db, "users", currentUser.uid, "wardrobe"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    wardrobeItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderGrid(wardrobeItems);
  } catch(e) {
    console.warn("Could not load from cloud, running in local store:", e);
  }
}

function renderGrid(items) {
  const grid = document.getElementById("wardrobe-items-container");
  grid.innerHTML = "";
  document.getElementById("wardrobe-count").innerText = items.length;

  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 2rem; color: var(--text-secondary);">
      No garments yet. Tap <strong>+ Add Clothes</strong> above to upload your first outfit photo.
    </div>`;
    return;
  }

  items.forEach(i => {
    const d = document.createElement("div");
    d.className = "clothing-card";
    d.innerHTML = `
      <img src="${i.imageUrl}" alt="${i.name}">
      <div class="clothing-info">
        <div class="item-title">${i.name}</div>
        <div class="item-meta">${i.category} • ${i.primaryColor}</div>
      </div>
    `;
    grid.appendChild(d);
  });
}

export function handleImageSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > 600) { h = Math.round((h * 600) / w); w = 600; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      capturedBase64 = canvas.toDataURL("image/jpeg", 0.7);

      document.getElementById("preview-img").src = capturedBase64;
      document.getElementById("preview-img").classList.remove("hidden");
      document.getElementById("picker-prompt").classList.add("hidden");
      recognizeGarment(capturedBase64.split(",")[1]);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
window.handleImageSelected = handleImageSelected;

async function recognizeGarment(b64) {
  document.getElementById("ai-analyzing-spinner").classList.remove("hidden");
  try {
    const res = await fetch(`${BACKEND_URL}/api/recognize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: b64 })
    });
    const d = await res.json();
    if (d.success && d.data) {
      document.getElementById("item-name").value = `${d.data.primaryColor || ""} ${d.data.category || ""}`.trim();
      document.getElementById("item-category").value = d.data.category || "Tops";
      document.getElementById("item-color").value = d.data.primaryColor || "";
    }
  } catch(e) {
    // If backend is not deployed, allow manual input
  }
  document.getElementById("ai-analyzing-spinner").classList.add("hidden");
}

export async function saveClothingItem(e) {
  e.preventDefault();
  if (!capturedBase64) return alert("Please capture or choose an image first");

  const item = {
    id: "item_" + Date.now(),
    name: document.getElementById("item-name").value,
    category: document.getElementById("item-category").value,
    primaryColor: document.getElementById("item-color").value,
    imageUrl: capturedBase64,
    createdAt: Date.now()
  };

  if (currentUser && !window.demoActive) {
    try {
      await setDoc(doc(db, "users", currentUser.uid, "wardrobe", item.id), item);
    } catch(err) {
      console.warn("Saving locally:", err);
    }
  }

  wardrobeItems.unshift(item);
  if (window.demoActive) {
    localStorage.setItem("demo_wardrobe", JSON.stringify(wardrobeItems));
  }
  renderGrid(wardrobeItems);
  closeUploadModal();
}
window.saveClothingItem = saveClothingItem;

export async function generateDailyOutfit() {
  const occasion = document.getElementById("stylist-occasion").value;
  if (wardrobeItems.length === 0) {
    return alert("Please upload at least 1 or 2 garments to your wardrobe first!");
  }

  let rec = null;
  let isGemini = false;

  try {
    const res = await fetch(`${BACKEND_URL}/api/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occasion, wardrobe: wardrobeItems })
    });
    const data = await res.json();
    if (data.success && data.outfit) {
      rec = data.outfit;
      isGemini = true;
    }
  } catch(e) {}

  if (!rec) {
    rec = OfflineFashionMatcher.generateOutfit(wardrobeItems, occasion);
  }

  document.getElementById("ai-outfit-result").classList.remove("hidden");
  document.getElementById("ai-engine-tag").className = isGemini ? "tag-gemini" : "tag-offline";
  document.getElementById("ai-engine-tag").innerText = isGemini ? "✨ Gemini Intelligence" : "⚙️ Smart Rule Matcher";
  document.getElementById("ai-outfit-title").innerText = rec.outfitName;
  document.getElementById("ai-outfit-harmony").innerText = rec.colorCoordination;
  document.getElementById("ai-outfit-notes").innerText = rec.matchingExplanation;
  document.getElementById("ai-outfit-missing").innerText = rec.missingItemSuggestion || "None. Your look is complete!";

  const container = document.getElementById("ai-curated-items");
  container.innerHTML = "";
  wardrobeItems.filter(i => rec.selectedItemIds.includes(i.id)).forEach(i => {
    const thumb = document.createElement("img");
    thumb.className = "curated-thumbnail";
    thumb.src = i.imageUrl;
    container.appendChild(thumb);
  });
}
window.generateDailyOutfit = generateDailyOutfit;

export async function sendChatMessage() {
  const inp = document.getElementById("chat-input-field");
  const msg = inp.value.trim();
  if (!msg) return;

  inp.value = "";
  appendMsg(msg, "user");

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, wardrobe: wardrobeItems })
    });
    const d = await res.json();
    appendMsg(d.reply || "Pairing light neutrals with dark bottom garments creates timeless symmetry.", "model");
  } catch {
    appendMsg("Stylist tip: A monochromatic look (similar color top & bottom) flatters any occasion!", "model");
  }
}
window.sendChatMessage = sendChatMessage;

function appendMsg(t, s) {
  const c = document.getElementById("chat-messages");
  const div = document.createElement("div");
  div.className = `chat-msg ${s}`;
  div.innerText = t;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

export function openUploadModal() { 
  document.getElementById("upload-modal").classList.add("active"); 
}
export function closeUploadModal() {
  document.getElementById("upload-modal").classList.remove("active");
  document.getElementById("preview-img").classList.add("hidden");
  document.getElementById("picker-prompt").classList.remove("hidden");
  capturedBase64 = null;
}
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;

export function enableDemoMode() {
  window.demoActive = true;
  document.getElementById("auth-modal").classList.remove("active");
  loadWardrobe();
}
window.enableDemoMode = enableDemoMode;
