<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Store, Search, User, ShoppingCart } from 'lucide-vue-next'
import StoreLocator from './StoreLocator.vue'
import { useAppStore } from '../stores/useStore'

const baseUrl = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net'
const router = useRouter()
const appStore = useAppStore()

// On indique 'hasMenu: false' pour empêcher le menu blanc de s'ouvrir sur Aide et Contact
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

// --- GESTION DU MAGASIN ---
const storeLocatorRef = ref(null)
const magasinChoisi = ref(null)

const openStoreLocator = () => {
  storeLocatorRef.value?.toggle()
}

const handleStoreSelection = (magasin) => {
  console.log("Global Store mis à jour avec :", magasin)
  appStore.setMagasin(magasin) 
}

const getId = (item) => item.idCategorieAccessoire || item.idCategorie || item.IdCategorie || item.IDCATEGORIE || item.idModele || item.IdModele || item.reference || item.Reference || item.id || Math.random()
const getName = (item) => item.nomCategorieAccessoire || item.nomCategorie || item.NomCategorie || item.NOMCATEGORIE || item.nomModele || item.NomModele || item.nom || item.Nom || 'Inconnu'

// 🔴 NOUVEAU : Mémoire intelligente des catégories valides (pour cacher les catégories vides)
const validElectricCats = ref(new Set())
const validMuscularCats = ref(new Set())

onMounted(async () => {
  try {
    // Le Header scanne tout le catalogue en fond pour savoir où sont rangés les vélos électriques et musculaires
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
        const isElec = type.includes('electrique') || type.includes('électrique') || type.includes('hybrid') || nom.includes('hybrid')
        
        if (isElec) elecSet.add(mod.idCategorie)
        else muscSet.add(mod.idCategorie)
      }
    })

    // On valide aussi les catégories "Parents" (ex: VTT) si elles contiennent une sous-catégorie valide
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
  } catch (e) { console.error("Erreur preload filtres Header:", e) }
})

const navigateToFilter = (item) => {
  const name = getName(item)
  const id = getId(item)
  const isModele = item.idModele || item.IdModele || item.nomModele ? 'modele' : 'categorie'

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

    // 🔴 FILTRAGE INTELLIGENT : On supprime les catégories principales vides
    if (id === 'electriques') items = items.filter(cat => validElectricCats.value.has(getId(cat)))
    else if (id === 'velos') items = items.filter(cat => validMuscularCats.value.has(getId(cat)))

    mainCategories.value = items
  } catch (e) { console.error(`Erreur API Main Categories :`, e) }
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

    // 🔴 FILTRAGE INTELLIGENT : On supprime les sous-catégories vides
    if (activeMenuId.value === 'electriques') items = items.filter(cat => validElectricCats.value.has(getId(cat)))
    else if (activeMenuId.value === 'velos') items = items.filter(cat => validMuscularCats.value.has(getId(cat)))

    subCategories.value = items
  } catch (e) { console.error("Erreur API SubCategories:", e) }
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
      const type = String(m.typeVelo || m.TypeVelo || m.type || m.Type || '').toLowerCase()
      const nom = String(m.nomModele || m.NomModele || m.nom || m.Nom || '').toLowerCase()
      return type.includes('electrique') || type.includes('électrique') || type.includes('hybrid') || nom.includes('hybrid')
    }

    if (activeMenuId.value === 'electriques') items = items.filter(isElectricBike)
    else if (activeMenuId.value === 'velos') items = items.filter(m => !isElectricBike(m))

    models.value = items
  } catch (e) { console.error("Erreur API Modeles:", e) }
}

const closeMenu = () => {
  activeMenuId.value = null
  activeMainId.value = null
  activeSubId.value = null
  activeSubName.value = ''
  subCategories.value = []
  models.value = []
}

const startClear = () => {
  hoverTimeout = setTimeout(() => { closeMenu() }, 400)
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
          @mouseenter="nav.hasMenu ? openMenu(nav.id) : closeMenu()" 
          @mouseleave="closeMenu"
        >
          <router-link :to="nav.url" class="main-link">{{ nav.label }}</router-link>
          
          <div v-if="nav.hasMenu && activeMenuId === nav.id" class="mega-menu">
            
            <div class="menu-column">
              <ul v-if="mainCategories.length > 0" @mouseleave="startClear" @mouseenter="cancelClear">
                <li 
                  v-for="cat in mainCategories" :key="getId(cat)"
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
                  v-for="sub in subCategories" :key="getId(sub)"
                  @mouseenter="loadModels(getId(sub), getName(sub)); cancelClear()"
                  @click="navigateToFilter(sub)"
                  :class="{ active: activeSubId === getId(sub) }"
                >
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
        <a href="#" class="shop-link" @click.prevent="openStoreLocator">
          {{ appStore.magasinChoisi ? appStore.magasinChoisi.nomAffiche : 'CHOISIR UN MAGASIN' }} 
          <Store :size="18" :stroke-width="2" />
        </a>
        <button class="icon-btn"><Search :size="20" :stroke-width="2" /></button>
        <router-link to="/connexion" class="icon-btn"><User :size="20" :stroke-width="2" /></router-link>
        <div class="cart-container">
          <button class="icon-btn"><ShoppingCart :size="20" :stroke-width="2" /></button>
          <span class="cart-badge">0</span>
        </div> </div> </div> </header>

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

/* 🔴 LE HEADER FONCÉ */
.main-nav {
  position: relative;
  display: flex;
  align-items: center;
  gap: 50px;
  height: 120px;
  padding: 0 40px;
  background-color: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.3s ease, border-bottom 0.3s ease;
}

.main-nav:hover {
  background-color: #111;
  border-bottom: 1px solid #222;
}

.nav-links {
  display: flex;
  gap: 15px;
  height: 100%;
  justify-content: left;
}

.main-link,
.shop-link,
.icon-btn {
  text-decoration: none;
  color: #fff;
  font-weight: 800;
  font-style: italic;
  transition: color 0.3s ease;
  font-size: 14px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.main-link {
  position: relative;
  padding-bottom: 6px;
}

.main-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0%;
  height: 3px;
  background-color: #00a8e8;
  transition: width 0.4s ease-in-out;
}

.nav-item:hover .main-link::after {
  width: 100%;
}

.main-link:hover,
.shop-link:hover,
.icon-btn:hover {
  color: #00a8e8 !important;
}

.logo-img {
  height: 45px;
  transition: filter 0.3s ease;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-left: auto;
}

.shop-link {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: #fff;
}

.cart-container {
  position: relative;
  display: flex;
  align-items: center;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #00a8e8;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
}

/* ⚪ LE MEGA-MENU BLANC */
.mega-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
  display: flex;
  padding: 60px 80px;
  min-height: 400px;
  box-sizing: border-box;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border-top: 1px solid #eaeaea;
  cursor: default;
  z-index: 100;
}

.menu-column {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid #eaeaea;
  padding: 0 40px;
}

.menu-column:first-child {
  border-left: none;
  padding-left: 20px;
}

.menu-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-column li {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 15px 14px 0;
  font-size: 15px;
  font-weight: 800;
  font-style: italic;
  color: #333;
  text-transform: uppercase;
  cursor: pointer;
  transition: padding-left 0.2s ease, color 0.2s ease;
}

.menu-column li::after {
  content: '›';
  font-size: 22px;
  color: #ddd;
  font-style: normal;
  font-weight: 400;
  transition: transform 0.2s ease, color 0.2s ease;
}

.menu-column li.active::after,
.menu-column li:hover::after {
  color: #00a8e8;
  transform: translateX(4px);
}

.menu-column li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  background-color: #00a8e8;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.menu-column li.active,
.menu-column li:hover {
  color: #00a8e8;
  padding-left: 15px;
}

.menu-column li.active::before,
.menu-column li:hover::before {
  opacity: 1;
}

.column-models {
  flex-grow: 1;
}

.models-header {
  margin-bottom: 25px;
}

.models-title {
  font-size: 20px;
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  color: #000;
  margin: 0;
  display: inline-block;
  border-bottom: 3px solid #00a8e8;
  padding-bottom: 5px;
}

.column-models ul {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 40px;
}

.column-models li {
  width: calc(50% - 20px);
  padding: 5px 0;
  font-size: 14px;
  font-weight: 500;
  font-style: normal;
  text-transform: none;
  color: #555;
}

.column-models li::before,
.column-models li::after {
  content: none;
  display: none;
}

.column-models li.active,
.column-models li:hover {
  padding-left: 0;
  color: #00a8e8;
}
</style>