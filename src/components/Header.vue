<template>
  <header class="cube-header">
    <div class="main-nav">
      
      <div class="logo">
        <router-link to="/">
          <img src="@/assets/images/logo-cube-blanc.png" alt="CUBE" class="logo-img" />
        </router-link>
      </div>

      <nav class="nav-links">

        <router-link to="/velos">VÉLOS</router-link>
        <router-link to="/velos-electriques">VÉLOS ÉLECTRIQUES</router-link>
        <!-- <router-link to="/equipements">ÉQUIPEMENTS</router-link> -->
        <router-link to="/accessoires">ACCESSOIRES</router-link>
        <!-- <router-link to="/communaute">COMMUNAUTÉ</router-link>
        <router-link to="/promos">PROMOS</router-link> -->

        <div class="nav-item" @mouseenter="openMenu" @mouseleave="closeMenu">
          <router-link to="/velos" class="main-link">VÉLOS</router-link>
          
          <div v-if="isMenuOpen" class="mega-menu">
            
            <div class="menu-column">
              <ul v-if="mainCategories.length > 0">
                <li 
                  v-for="cat in mainCategories" 
                  :key="getId(cat) || Math.random()"
                  @mouseenter="loadSubCategories(getId(cat))"
                  :class="{ active: activeMainId === getId(cat) }"
                >
                  {{ getName(cat) === 'Inconnu' ? cat : getName(cat) }}
                </li>
              </ul>
              <p v-else style="color:red; font-size:12px;">Chargement ou Erreur API...</p>
            </div>

            <div class="menu-column" v-if="subCategories.length > 0">
              <ul>
                <li 
                  v-for="sub in subCategories" 
                  :key="getId(sub) || Math.random()"
                  @mouseenter="loadModels(getId(sub))"
                  :class="{ active: activeSubId === getId(sub) }"
                >
                  {{ getName(sub) === 'Inconnu' ? sub : getName(sub) }}
                </li>
              </ul>
            </div>

            <div class="menu-column" v-if="models.length > 0">
              <ul>
                <li v-for="modele in models" :key="getId(modele) || Math.random()">
                  {{ getName(modele) === 'Inconnu' ? modele : getName(modele) }}
                </li>
              </ul>
            </div>

            <div class="menu-image">
              <img src="@/assets/images/1.webp" alt="Vélos Cube">
            </div>

          </div>
        </div>

        <router-link to="/velos-electriques" class="main-link">VÉLOS ÉLECTRIQUES</router-link>
        <router-link to="/accessoires" class="main-link">ACCESSOIRES</router-link>

      </nav>

      <div class="nav-actions">
        <a href="#" class="shop-link">CHOISIR UN MAGASIN <Store :size="18" :stroke-width="2" /></a>
        <button class="icon-btn"><Search :size="20" :stroke-width="2" /></button>
        <button class="icon-btn"><User :size="20" :stroke-width="2" /></button>
        <div class="cart-container">
          <button class="icon-btn"><ShoppingCart :size="20" :stroke-width="2" /></button>
          <span class="cart-badge">0</span>
        </div>
      </div>

    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Store, Search, User, ShoppingCart } from 'lucide-vue-next'

// Ton API Azure
const baseUrl = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net'

const isMenuOpen = ref(false)
const mainCategories = ref([])
const subCategories = ref([])
const models = ref([])

const activeMainId = ref(null)
const activeSubId = ref(null)

// Helpers ultra-larges pour chopper l'ID et le Nom peu importe comment l'API les nomme
const getId = (item) => item?.id || item?.Id || item?.idCategorie || item?.IdCategorie || item?.idModele || null
const getName = (item) => item?.nom || item?.Nom || item?.libelle || item?.Libelle || item?.name || 'Inconnu'

onMounted(async () => {
  try {
    const res = await fetch(`${baseUrl}/api/CategorieVelo/GetMain`)
    const data = await res.json()
    console.log("🔥 REPONSE API GetMain :", data) // Regarde dans F12 !
    
    // Gère le cas où l'API C# renvoie les données dans un sous-objet (ex: $values)
    mainCategories.value = data.$values || data.data || data
  } catch (e) {
    console.error("Erreur API GetMain:", e)
  }
})

const openMenu = () => {
  isMenuOpen.value = true
}

const closeMenu = () => {
  isMenuOpen.value = false
  activeMainId.value = null
  activeSubId.value = null
  subCategories.value = []
  models.value = []
}

const loadSubCategories = async (id) => {
  if (!id || activeMainId.value === id) return
  activeMainId.value = id
  activeSubId.value = null
  models.value = []
  
  try {
    const res = await fetch(`${baseUrl}/api/CategorieVelo/GetSubCategories/${id}`)
    const data = await res.json()
    console.log("🔥 REPONSE API GetSubCategories :", data)
    subCategories.value = data.$values || data.data || data
  } catch (e) {
    console.error("Erreur API GetSubCategories:", e)
  }
}

const loadModels = async (id) => {
  if (!id || activeSubId.value === id) return
  activeSubId.value = id
  
  try {
    const res = await fetch(`${baseUrl}/api/Modele/GetByCategory/${id}`)
    const data = await res.json()
    console.log("🔥 REPONSE API Modeles :", data)
    models.value = data.$values || data.data || data
  } catch (e) {
    console.error("Erreur API GetByCategory:", e)
  }
}
</script>

<style scoped>
.cube-header {
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 100;
  font-family: Arial, sans-serif;
}

.main-nav {
  position: relative; 
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25px 40px;
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.main-nav:hover {
  background-color: #fff;
  border-bottom: 1px solid #eaeaea;
}

.nav-links {
  display: flex;
  gap: 25px;
  height: 100%;
}

.main-link, .shop-link, .icon-btn {
  text-decoration: none;
  color: #fff;
  font-weight: 800;
  font-style: italic;
  transition: color 0.3s ease;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.main-nav:hover .main-link,
.main-nav:hover .shop-link,
.main-nav:hover .icon-btn {
  color: #000;
}

.main-link:hover {
  color: #00a8e8 !important;
}

.logo-img {
  height: 35px;
  transition: filter 0.3s ease;
}

.main-nav:hover .logo-img {
  filter: invert(100%);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.shop-link { font-size: 12px; display: flex; align-items: center; gap: 5px; }
.icon-btn { background: none; border: none; cursor: pointer; padding: 0; display: flex; align-items: center; }
.cart-container { position: relative; display: flex; align-items: center; }
.cart-badge { position: absolute; top: -8px; right: -8px; background-color: #00a8e8; color: white; font-size: 10px; font-weight: bold; padding: 2px 5px; border-radius: 10px; }

/* MEGA MENU */
.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.mega-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
  display: flex;
  padding: 40px 10%; 
  box-sizing: border-box;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border-top: 1px solid #eaeaea;
  cursor: default;
}

.menu-column {
  min-width: 200px;
  border-left: 1px solid #eaeaea;
  padding: 0 30px;
}

.menu-column:first-child {
  border-left: none;
}

.menu-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-column li {
  padding: 10px 0;
  font-size: 13px;
  font-weight: 800;
  font-style: italic;
  color: #000;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.2s;
}

.menu-column li:hover, .menu-column li.active {
  color: #00a8e8;
}

.menu-image {
  margin-left: auto;
  width: 400px;
  height: 250px;
  overflow: hidden;
  background-color: #f5f5f5; /* Fond gris si l'image ne charge pas */
}

.menu-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>