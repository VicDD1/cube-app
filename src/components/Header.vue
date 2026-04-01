<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Store, Search, User, ShoppingCart, X } from 'lucide-vue-next'
import StoreLocator from './StoreLocator.vue'
import { useAppStore } from '../stores/useStore'

const baseUrl = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net'
const router = useRouter()
const appStore = useAppStore()

const navigationLinks = [
  { id: 'velos', label: 'VÉLOS', url: '/velos', hasMenu: true },
  { id: 'electriques', label: 'VÉLOS ÉLECTRIQUES', url: '/velos-electriques', hasMenu: true },
  { id: 'accessoires', label: 'ACCESSOIRES', url: '/accessoires', hasMenu: true },
  { id: 'aide', label: 'AIDE & FAQ', url: '/aide', hasMenu: false },
  { id: 'contact', label : 'CONTACTEZ-NOUS', url: '/contact', hasMenu: false },
]

const activeMenuId = ref(null)
const mainCategories = ref([])
const subCategories = ref([])
const models = ref([])
const activeMainId = ref(null)
const activeSubId = ref(null)
const activeSubName = ref('')
let hoverTimeout = null

const storeLocatorRef = ref(null)


const isSearchOpen = ref(false)
const searchQuery = ref('')
const allArticles = ref([])
const isLoadingSearch = ref(false)
const searchInputRef = ref(null)


const getResultImage = (refStr) => {
  if (!refStr) return 'https://via.placeholder.com/50?text=?'
  const cleanRef = refStr.trim()
  const folder = cleanRef.length === 6 ? 'VELOS' : 'ACCESSOIRES'
  try {
    return new URL(`../assets/images/${folder}/${cleanRef}/image_1.webp`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/50?text=?'
  }
}

const toggleSearch = async () => {
  isSearchOpen.value = !isSearchOpen.value
  
  if (isSearchOpen.value) {
    nextTick(() => { searchInputRef.value?.focus() })

    if (allArticles.value.length === 0) {
      isLoadingSearch.value = true
      try {
        const res = await fetch(`${baseUrl}/api/Articles/GetArticles`)
        const data = await res.json()
        allArticles.value = data.$values || data.data || data || []
      } catch (e) {
        console.error("Erreur chargement articles:", e)
      } finally {
        isLoadingSearch.value = false
      }
    }
  } else {
    searchQuery.value = ''
  }
}

const closeSearch = () => {
  isSearchOpen.value = false
  searchQuery.value = ''
}

const filteredArticles = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase().trim()
  return allArticles.value.filter(a => 
    a.nomArticle?.toLowerCase().includes(query) || 
    a.reference?.toLowerCase().includes(query)
  ).slice(0, 6)
})

const goToArticle = (reference) => {
  closeSearch()
  router.push({ name: 'visualize', params: { id: reference.trim() } })
}


const handleStoreSelection = (magasin) => {
  if (appStore.setMagasin) appStore.setMagasin(magasin)
  else appStore.magasinChoisi = magasin
}

const openStoreLocator = () => { storeLocatorRef.value?.toggle() }
const getId = (item) => item.idCategorieAccessoire || item.idCategorie || item.idModele || item.reference || Math.random()
const getName = (item) => item.nomCategorieAccessoire || item.nomCategorie || item.nomModele || item.nomArticle || 'Inconnu'

const validElectricCats = ref(new Set())
const validMuscularCats = ref(new Set())

onMounted(async () => {
  appStore.loadPersistedStore()
  const idClientActuel = appStore.user ? appStore.user.idClient : null
  appStore.updateCartCount(idClientActuel)

  try {
    const [resVars, resCats] = await Promise.all([
      fetch(`${baseUrl}/api/VarianteVelo/GetVariantes`),
      fetch(`${baseUrl}/api/CategorieVelo/GetCategories`)
    ])
    
    const dataVars = await resVars.json()
    const dataCats = await resCats.json()
    
    const allVars = dataVars.$values || dataVars.data || dataVars || []
    const allCats = dataCats.$values || dataCats.data || dataCats || []

    const elecSet = new Set()
    const muscSet = new Set()

    allVars.forEach(v => {
      const mod = v.idModeleNavigation
      if (mod && mod.idCategorie) {
        const type = String(mod.typeVelo || '').toLowerCase()
        const nom = String(mod.nomModele || '').toLowerCase()
        const isElec = type.includes('electrique') || type.includes('hybrid') || nom.includes('hybrid')
        if (isElec) elecSet.add(mod.idCategorie)
        else muscSet.add(mod.idCategorie)
      }
    })

    const propagate = (cats, targetSet) => {
      let hasValid = false
      const list = cats.$values || cats
      if (!Array.isArray(list)) return false

      list.forEach(c => {
        const id = c.idCategorie
        let childValid = false
        if (c.inverseCatIdCategorieNavigation) {
          childValid = propagate(c.inverseCatIdCategorieNavigation, targetSet)
        }
        if (childValid || targetSet.has(id)) {
          targetSet.add(id)
          hasValid = true
        }
      })
      return hasValid
    }

    propagate(allCats, elecSet)
    propagate(allCats, muscSet)

    validElectricCats.value = elecSet
    validMuscularCats.value = muscSet
  } catch (e) { console.error("Erreur preload:", e) }
})

const navigateToFilter = (item) => {
  const name = getName(item)
  const id = getId(item)
  const isModele = item.idModele ? 'modele' : 'categorie'

  let path = '/velos'
  if (activeMenuId.value === 'electriques') path = '/velos-electriques'
  else if (activeMenuId.value === 'accessoires') path = '/accessoires'

  router.push({ path: path, query: { filterName: name, filterId: id, filterType: isModele } })
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
  activeSubName.value = ''

  try {
    const endpoint = id === 'accessoires' ? '/api/CategorieAccessoire/GetMain' : '/api/CategorieVelo/GetMain'
    const res = await fetch(`${baseUrl}${endpoint}`)
    const data = await res.json()
    let items = data.$values || data.data || data || []

    if (id === 'electriques') items = items.filter(cat => validElectricCats.value.has(getId(cat)))
    else if (id === 'velos') items = items.filter(cat => validMuscularCats.value.has(getId(cat)))

    mainCategories.value = items
  } catch (e) { console.error(`Erreur Main Categories :`, e) }
}

const loadSubCategories = async (id) => {
  if (!id || activeMainId.value === id) return
  activeMainId.value = id
  activeSubId.value = null
  activeSubName.value = ''
  models.value = []
  
  try {
    const endpoint = activeMenuId.value === 'accessoires' ? `/api/CategorieAccessoire/GetSubCategories/${id}` : `/api/CategorieVelo/GetSubCategories/${id}`
    const res = await fetch(`${baseUrl}${endpoint}`)
    const data = await res.json()
    let items = data.$values || data.data || data || []

    if (activeMenuId.value === 'electriques') items = items.filter(cat => validElectricCats.value.has(getId(cat)))
    else if (activeMenuId.value === 'velos') items = items.filter(cat => validMuscularCats.value.has(getId(cat)))

    subCategories.value = items
  } catch (e) { console.error("Erreur SubCategories:", e) }
}

const loadModels = async (id, name) => {
  if (!id || activeSubId.value === id) return
  activeSubId.value = id
  activeSubName.value = name || ''
  
  try {
    const endpoint = activeMenuId.value === 'accessoires' ? `/api/Accessoire/GetByCategory/${id}` : `/api/Modele/GetByCategory/${id}`
    const res = await fetch(`${baseUrl}${endpoint}`)
    const data = await res.json()
    let items = data.$values || data.data || data || []

    const isElectricBike = (m) => {
      const type = String(m.typeVelo || '').toLowerCase()
      const nom = String(m.nomModele || '').toLowerCase()
      return type.includes('electrique') || type.includes('hybrid') || nom.includes('hybrid')
    }

    if (activeMenuId.value === 'electriques') items = items.filter(isElectricBike)
    else if (activeMenuId.value === 'velos') items = items.filter(m => !isElectricBike(m))

    models.value = items
  } catch (e) { console.error("Erreur Modeles:", e) }
}

const closeMenu = () => {
  activeMenuId.value = null
  activeMainId.value = null
  activeSubId.value = null
  activeSubName.value = ''
  subCategories.value = []
  models.value = []
}

const startClear = () => { hoverTimeout = setTimeout(() => { closeMenu() }, 400) }
const cancelClear = () => { if (hoverTimeout) clearTimeout(hoverTimeout) }
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
          @mouseenter="nav.hasMenu ? openMenu(nav.id) : closeMenu()" 
          @mouseleave="closeMenu"
        >
          <router-link :to="nav.url" class="main-link">{{ nav.label }}</router-link>
          
          <div v-if="nav.hasMenu && activeMenuId === nav.id" class="mega-menu">
            <div class="menu-column">
              <ul v-if="mainCategories.length > 0" @mouseleave="startClear" @mouseenter="cancelClear">
                <li v-for="cat in mainCategories" :key="getId(cat)" @mouseenter="loadSubCategories(getId(cat)); cancelClear()" @click="navigateToFilter(cat)" :class="{ active: activeMainId === getId(cat) }">
                  {{ getName(cat) }}
                </li>
              </ul>
            </div>

            <div class="menu-column" v-if="subCategories.length > 0">
              <ul @mouseleave="startClear" @mouseenter="cancelClear">
                <li v-for="sub in subCategories" :key="getId(sub)" @mouseenter="loadModels(getId(sub), getName(sub)); cancelClear()" @click="navigateToFilter(sub)" :class="{ active: activeSubId === getId(sub) }">
                  {{ getName(sub) }}
                </li>
              </ul>
            </div>

            <div class="menu-column column-models" v-if="models.length > 0">
              <div class="models-header">
                <h3 class="models-title">{{ activeSubName }}</h3>
              </div>
              <ul @mouseleave="startClear" @mouseenter="cancelClear">
                <li v-for="modele in models" :key="getId(modele)" @click="navigateToFilter(modele)">
                  {{ getName(modele) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div class="nav-actions">
        
        <div class="search-animated-container" :class="{ 'is-open': isSearchOpen }">
          <button class="search-trigger icon-btn" @click="toggleSearch">
            <X v-if="isSearchOpen" :size="18" :stroke-width="2" />
            <Search v-else :size="18" :stroke-width="2" />
          </button>
          
          <input 
            ref="searchInputRef"
            v-model="searchQuery" 
            type="text" 
            class="search-input-expanding" 
            placeholder="Recherche..." 
            @keydown.esc="closeSearch"
          />

          <div v-if="isSearchOpen && (searchQuery.length > 0 || isLoadingSearch)" class="search-results-dropdown">
            <div v-if="isLoadingSearch" class="search-msg">Chargement...</div>
            <ul v-else-if="filteredArticles.length > 0" class="search-results">
              <li v-for="item in filteredArticles" :key="item.reference" @click="goToArticle(item.reference)">
                
                <div class="res-left">
                  <img 
                    :src="getResultImage(item.reference)" 
                    alt="Visuel produit" 
                    class="res-img" 
                    @error="(e) => e.target.style.display = 'none'"
                  />
                  <div class="res-info">
                    <span class="res-name">{{ item.nomArticle }}</span>
                    <span class="res-ref">{{ item.reference.trim() }}</span>
                  </div>
                </div>
                
                <span class="res-price">{{ item.prix }} €</span>
              </li>
            </ul>
            <div v-else-if="searchQuery" class="search-msg">Aucun résultat.</div>
          </div>
        </div>

        <a href="#" class="shop-link" @click.prevent="openStoreLocator">
          {{ appStore.magasinChoisi ? appStore.magasinChoisi.nomAffiche : 'CHOISIR UN MAGASIN' }} <Store :size="18" :stroke-width="2" />
        </a>

        <router-link :to="appStore.user ? '/profil' : '/connexion'" class="icon-btn profile-btn">
          <span v-if="appStore.user" class="user-name">
            {{ appStore.user.prenomClient }} {{ appStore.user.nomClient }}
          </span>
          <User v-else :size="20" :stroke-width="2" />
        </router-link>
        
        <router-link to="/panier" class="cart-container-btn">
          <button class="icon-btn"><ShoppingCart :size="20" :stroke-width="2" /></button>
          <span v-if="appStore.cartItemCount > 0" class="cart-badge">{{ appStore.cartItemCount }}</span>
        </router-link>
      </div>

    </div>
  </header>

  <StoreLocator ref="storeLocatorRef" @storeSelected="handleStoreSelection" />
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800;900&display=swap');

.cube-header {
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 100;
  font-family: 'Inter', sans-serif;
}


.profile-btn {
  display: flex;
  align-items: center;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}


.main-nav {
  position: relative;
  display: flex;
  align-items: center;
  gap: 30px;
  height: 100px;
  padding: 0 50px;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-nav:hover {
  background-color: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid #eaeaea;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
}

.nav-links { display: flex; gap: 20px; height: 100%; }
.nav-item { display: flex; align-items: center; height: 100%; padding: 0 10px; }

.main-link, .shop-link, .icon-btn {
  text-decoration: none;
  color: #fff;
  font-weight: 900; 
  font-style: italic;
  transition: all 0.3s ease;
  font-size: 0.95rem; 
  text-transform: uppercase;
}

.main-nav:hover .main-link, .main-nav:hover .shop-link, .main-nav:hover .icon-btn { color: #1a1a1a; }
.main-link:hover, .shop-link:hover { color: #00a8e8 !important; }
.icon-btn:hover { color: #00a8e8 !important; transform: scale(1.1); }

.main-link { position: relative; padding-bottom: 6px; }
.main-link::after {
  content: ''; position: absolute; bottom: 0; left: 0; width: 0%; height: 3px;
  background-color: #00a8e8; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px;
}
.nav-item:hover .main-link::after { width: 100%; }

.logo-img { height: 40px; transition: filter 0.4s ease, transform 0.3s ease; }
.main-nav:hover .logo-img { filter: invert(100%); }
.logo-img:hover { transform: scale(1.05); }

.nav-actions { display: flex; align-items: center; gap: 15px; margin-left: auto; }

.shop-link {
  font-size: 0.8rem; display: flex; align-items: center; gap: 8px;
  background: rgba(255, 255, 255, 0.1); padding: 8px 16px; border-radius: 50px; border: 1px solid transparent;
}
.main-nav:hover .shop-link { background: #f5f5f5; }
.shop-link:hover { background: #00a8e815 !important; border-color: #00a8e830; }

.icon-btn { background: none; border: none; cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; }


.search-animated-container {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 5px 10px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  margin-right: 15px;
}

.main-nav:hover .search-animated-container {
  background: rgba(0, 0, 0, 0.05);
}

.search-animated-container.is-open {
  background: rgba(255, 255, 255, 0.2);
}

.main-nav:hover .search-animated-container.is-open {
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.search-input-expanding {
  width: 0;
  opacity: 0;
  border: none;
  background: transparent;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 0;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
}

.main-nav:hover .search-input-expanding {
  color: #1a1a1a;
}

.search-input-expanding::placeholder {
  color: rgba(255,255,255,0.6);
}
.main-nav:hover .search-input-expanding::placeholder {
  color: #aaa;
}

.search-animated-container.is-open .search-input-expanding {
  width: 400px;
  opacity: 1;
  padding: 5px 20px 5px 10px;
}


.search-results-dropdown {
  position: absolute;
  top: calc(100% + 20px);
  right: 0;
  width: 750px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.15);
  border: 1px solid #eaeaea;
  padding: 25px;
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.search-msg { 
  padding: 20px; 
  font-size: 1rem; 
  color: #888; 
  text-align: center; 
  font-style: italic; 
}


.search-results { 
  list-style: none; 
  padding: 0; 
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.search-results li {
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  padding: 15px; 
  border: 1px solid #f0f0f0; 
  cursor: pointer; 
  transition: all 0.2s ease; 
  border-radius: 8px;
}

.search-results li:hover { 
  background: #fdfdfd;
  border-color: #00a8e8;
  box-shadow: 0 5px 15px rgba(0, 168, 232, 0.1);
  transform: translateY(-2px);
}

.res-left { display: flex; align-items: center; gap: 20px; }
.res-img { 
  width: 70px; 
  height: 70px; 
  object-fit: contain; 
  border-radius: 6px; 
  background: #f9f9f9; 
  padding: 5px; 
}

.res-info { display: flex; flex-direction: column; }
.res-name { 
  font-weight: 900; 
  color: #1a1a1a; 
  font-size: 0.95rem; 
  margin-bottom: 6px; 
  text-transform: uppercase; 
  line-height: 1.2;
}
.res-ref { font-size: 0.75rem; color: #888; font-weight: 700; }
.res-price { font-weight: 900; font-style: italic; color: #00a8e8; font-size: 1.15rem; white-space: nowrap; }


.cart-container-btn { position: relative; display: flex; align-items: center; text-decoration: none; }
.cart-badge {
  position: absolute; top: -2px; right: -5px; background-color: #00a8e8; color: white;
  font-size: 0.65rem; font-weight: 900; padding: 2px 6px; border-radius: 12px;
  border: 2px solid transparent; transition: border-color 0.3s ease;
}
.main-nav:hover .cart-badge { border-color: #fff; }


.mega-menu {
  position: absolute; top: 100%; left: 0; width: 100%; background-color: #fff;
  display: flex; padding: 50px 80px 70px; min-height: 400px; box-sizing: border-box;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.1); border-top: 1px solid #eaeaea;
  cursor: default; z-index: 100; animation: slideDownMenu 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: top center;
}

@keyframes slideDownMenu {
  from { opacity: 0; transform: scaleY(0.95) translateY(-10px); }
  to { opacity: 1; transform: scaleY(1) translateY(0); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-column { width: 320px; flex-shrink: 0; border-left: 1px solid #f0f0f0; padding: 0 40px; }
.menu-column:first-child { border-left: none; padding-left: 20px; }
.menu-column ul { list-style: none; padding: 0; margin: 0; }
.menu-column li {
  position: relative; display: flex; justify-content: space-between; align-items: center;
  padding: 12px 15px 12px 0; font-size: 0.95rem; font-weight: 800; font-style: italic;
  color: #444; text-transform: uppercase; cursor: pointer; transition: all 0.2s ease;
}
.menu-column li::after { content: '›'; font-size: 1.5rem; color: #ccc; font-style: normal; font-weight: 400; transition: all 0.2s ease; }
.menu-column li.active, .menu-column li:hover { color: #00a8e8; padding-left: 12px; }
.menu-column li.active::after, .menu-column li:hover::after { color: #00a8e8; transform: translateX(6px); }
.menu-column li::before {
  content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 0; background-color: #00a8e8; transition: height 0.2s ease; border-radius: 4px;
}
.menu-column li.active::before, .menu-column li:hover::before { height: 60%; }

.column-models { flex-grow: 1; }
.models-header { margin-bottom: 25px; }
.models-title {
  font-size: 1.25rem; font-weight: 900; font-style: italic; text-transform: uppercase;
  color: #1a1a1a; margin: 0; display: inline-block; border-bottom: 3px solid #00a8e8; padding-bottom: 8px;
}
.column-models ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px 30px; }
.column-models li { padding: 8px 0; font-size: 0.95rem; font-weight: 500; font-style: normal; text-transform: capitalize; color: #666; }
.column-models li::before, .column-models li::after { display: none; }
.column-models li.active, .column-models li:hover { padding-left: 0; color: #00a8e8; font-weight: 700; }
</style>