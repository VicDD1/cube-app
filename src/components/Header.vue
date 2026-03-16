<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Store, Search, User, ShoppingCart } from 'lucide-vue-next'
import StoreLocator from './StoreLocator.vue'

const baseUrl = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net'
const router = useRouter()

const navigationLinks = [
  { id: 'velos', label: 'VÉLOS', url: '/velos' },
  { id: 'electriques', label: 'VÉLOS ÉLECTRIQUES', url: '/velos-electriques' },
  { id: 'accessoires', label: 'ACCESSOIRES', url: '/accessoires' }
]

const activeMenuId = ref(null)
const mainCategories = ref([])
const subCategories = ref([])
const models = ref([])

const activeMainId = ref(null)
const activeSubId = ref(null)
let hoverTimeout = null

// --- GESTION DU MAGASIN ---
const storeLocatorRef = ref(null)
const magasinChoisi = ref(null)

const openStoreLocator = () => {
  storeLocatorRef.value?.toggle()
}

const handleStoreSelection = (magasin) => {
  console.log("Le Header a bien reçu le magasin :", magasin)
  magasinChoisi.value = magasin.nomAffiche
  // Tu pourras sauvegarder l'ID du magasin dans un store Pinia ou le localStorage ici plus tard
}
// --------------------------

const getId = (item) => item.idCategorieAccessoire || item.idCategorie || item.IdCategorie || item.IDCATEGORIE || item.idModele || item.IdModele || item.reference || item.Reference || item.id || Math.random()
const getName = (item) => item.nomCategorieAccessoire || item.nomCategorie || item.NomCategorie || item.NOMCATEGORIE || item.nomModele || item.NomModele || item.nom || item.Nom || 'Inconnu'

const navigateToFilter = (item) => {
  const name = getName(item)
  const id = getId(item)
  const isModele = item.idModele || item.IdModele || item.nomModele ? 'modele' : 'categorie'

  let path = '/velos'
  if (activeMenuId.value === 'electriques') path = '/velos-electriques'
  else if (activeMenuId.value === 'accessoires') path = '/accessoires'

  router.push({
    path: path,
    query: { filterName: name, filterId: id, filterType: isModele }
  })
  closeMenu()
}

const openMenu = async (id) => {
  if (activeMenuId.value === id) return
  
  activeMenuId.value = id
  mainCategories.value = []
  subCategories.value = []
  models.value = []
  activeMainId.value = null
  activeSubId.value = null

  try {
    const endpoint = id === 'accessoires' 
      ? '/api/CategorieAccessoire/GetMain' 
      : '/api/CategorieVelo/GetMain'

    const res = await fetch(`${baseUrl}${endpoint}`)
    const data = await res.json()
    mainCategories.value = data.$values || data.data || data
  } catch (e) {
    console.error(`Erreur API Main Categories pour ${id}:`, e)
  }
}

const loadSubCategories = async (id) => {
  if (!id || activeMainId.value === id) return
  activeMainId.value = id
  activeSubId.value = null
  models.value = []
  
  try {
    const endpoint = activeMenuId.value === 'accessoires'
      ? `/api/CategorieAccessoire/GetSubCategories/${id}`
      : `/api/CategorieVelo/GetSubCategories/${id}`

    const res = await fetch(`${baseUrl}${endpoint}`)
    const data = await res.json()
    subCategories.value = data.$values || data.data || data
  } catch (e) {
    console.error("Erreur API SubCategories:", e)
  }
}

const loadModels = async (id) => {
  if (!id || activeSubId.value === id) return
  activeSubId.value = id
  
  try {
    const endpoint = activeMenuId.value === 'accessoires'
      ? `/api/Accessoire/GetByCategory/${id}`
      : `/api/Modele/GetByCategory/${id}`

    const res = await fetch(`${baseUrl}${endpoint}`)
    const data = await res.json()
    let items = data.$values || data.data || data

    if (activeMenuId.value === 'electriques') {
      items = items.filter(m => {
        const type = m.typeVelo || m.TypeVelo || m.type || m.Type || ''
        return type.toLowerCase().includes('electrique') || type.toLowerCase().includes('électrique')
      })
    } else if (activeMenuId.value === 'velos') {
      items = items.filter(m => {
        const type = m.typeVelo || m.TypeVelo || m.type || m.Type || ''
        return !type.toLowerCase().includes('electrique') && !type.toLowerCase().includes('électrique')
      })
    }

    models.value = items
  } catch (e) {
    console.error("Erreur API Modeles/Articles:", e)
  }
}

const closeMenu = () => {
  activeMenuId.value = null
  activeMainId.value = null
  activeSubId.value = null
  subCategories.value = []
  models.value = []
}

const startClear = () => {
  hoverTimeout = setTimeout(() => {
    activeMainId.value = null
    activeSubId.value = null
    subCategories.value = []
    models.value = []
  }, 150)
}

const cancelClear = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
}
</script>

<template>
  <header class="cube-header">
    <div class="main-nav">
      
      <div class="logo">
        <router-link to="/">
          <img src="@/assets/images/logo-cube-blanc.png" alt="CUBE" class="logo-img" />
        </router-link>
      </div>

      <nav class="nav-links">
        <div 
          v-for="nav in navigationLinks" 
          :key="nav.id"
          class="nav-item" 
          @mouseenter="openMenu(nav.id)" 
          @mouseleave="closeMenu"
        >
          <router-link :to="nav.url" class="main-link">{{ nav.label }}</router-link>
          
          <div v-if="activeMenuId === nav.id" class="mega-menu">
            
            <div class="menu-column">
              <ul 
                v-if="mainCategories.length > 0" 
                @mouseleave="startClear" 
                @mouseenter="cancelClear"
              >
                <li 
                  v-for="cat in mainCategories" 
                  :key="getId(cat)"
                  @mouseenter="loadSubCategories(getId(cat)); cancelClear()"
                  @click="navigateToFilter(cat)"
                  :class="{ active: activeMainId === getId(cat) }"
                >
                  {{ getName(cat) }}
                </li>
              </ul>
            </div>

            <div class="menu-column" v-if="subCategories.length > 0">
              <ul @mouseleave="startClear" @mouseenter="cancelClear">
                <li 
                  v-for="sub in subCategories" 
                  :key="getId(sub)"
                  @mouseenter="loadModels(getId(sub)); cancelClear()"
                  @click="navigateToFilter(sub)"
                  :class="{ active: activeSubId === getId(sub) }"
                >
                  {{ getName(sub) }}
                </li>
              </ul>
            </div>

            <div class="menu-column" v-if="models.length > 0">
              <ul @mouseleave="startClear" @mouseenter="cancelClear">
                <li 
                  v-for="modele in models" 
                  :key="getId(modele)"
                  @click="navigateToFilter(modele)"
                >
                  {{ getName(modele) }}
                </li>
              </ul>
            </div>

            <div class="menu-image" @mouseenter="startClear">
              <img src="@/assets/images/1.webp" alt="Menu CUBE">
            </div>

          </div>
        </div>
      </nav>

      <div class="nav-actions">
        <a href="#" class="shop-link" @click.prevent="openStoreLocator">
          {{ magasinChoisi ? magasinChoisi : 'CHOISIR UN MAGASIN' }} <Store :size="18" :stroke-width="2" />
        </a>
        <button class="icon-btn"><Search :size="20" :stroke-width="2" /></button>
        <router-link to="/connexion" class="icon-btn"><User :size="20" :stroke-width="2" /></router-link>
        <div class="cart-container">
          <button class="icon-btn"><ShoppingCart :size="20" :stroke-width="2" /></button>
          <span class="cart-badge">0</span>
        </div>
      </div>

    </div>
  </header>

  <StoreLocator ref="storeLocatorRef" @storeSelected="handleStoreSelection" />
</template>

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
  height: 90px;
  padding: 0 40px;
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
  gap: 15px;
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

.nav-item {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
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
  z-index: 100;
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

.menu-column li.active, .menu-column li:hover {
  color: #00a8e8;
}

.menu-image {
  margin-left: auto;
  width: 400px;
  height: 250px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.menu-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>