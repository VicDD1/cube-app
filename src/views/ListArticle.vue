<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import CardArticle from '../components/CardArticle.vue'


import imgVeloElec from '../assets/images/velo_electrique.webp'
import imgVeloMusc from '../assets/images/velo_route.webp'
import imgAccessoires from '../assets/images/accessoires-de-velo.webp'

const props = defineProps(['typeVelo', 'title', 'typeArticle'])
const route = useRoute()
const allData = ref([]) 
const loading = ref(true)


const heroImage = computed(() => {
  if (props.typeArticle === 'Accessoires') return imgAccessoires
  
  const titleLower = props.title?.toLowerCase() || ''
  if (titleLower.includes('electrique') || titleLower.includes('électrique')) {
    return imgVeloElec
  }
  
  return imgVeloMusc
})


const shopContainer = ref(null) 
const scrollToShop = () => {
  if (shopContainer.value) {
    shopContainer.value.scrollIntoView({ behavior: 'smooth' })
  }
}


const maxPrice = ref(8000)
const filterPrice = ref(8000)
const selectedColors = ref([])
const selectedCategories = ref([])
const searchQuery = ref('')
const categoriesMap = ref(new Map())
const allRawCategories = ref([]) 


const showAllColors = ref(false)
const COLORS_LIMIT = 5


const currentPage = ref(1)
const itemsPerPage = 15


const fetchCategories = async () => {
  try {
    const isAccessoire = props.typeArticle === 'Accessoires'
    const url = isAccessoire
      ? 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/CategorieAccessoire/GetCategories'
      : 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/CategorieVelo/GetCategories'

    const res = await fetch(url)
    const data = await res.json()

    const newMap = new Map()
    const flatCategories = []

    const extractCats = (cats) => {
      cats.forEach(c => {
        if (c && c.idCategorie && c.nomCategorie) {
          newMap.set(c.idCategorie, c.nomCategorie.trim())
          flatCategories.push(c)
          
          if (c.inverseCatIdCategorieNavigation && c.inverseCatIdCategorieNavigation.length > 0) {
            extractCats(c.inverseCatIdCategorieNavigation)
          }
        }
      })
    }
    
    extractCats(data.$values || data || [])
    categoriesMap.value = newMap
    allRawCategories.value = flatCategories
  } catch (error) {
    console.error("Erreur API Catégories :", error)
  }
}


const fetchData = async () => {
  loading.value = true
  try {
    const isAccessoire = props.typeArticle === 'Accessoires'

    const urlArticles = isAccessoire
      ? 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Accessoire/GetAccessoires'
      : 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/VarianteVelo/GetVariantes'

    const response = await fetch(urlArticles)
    const data = await response.json()
    const rawData = data.$values || data || []

    if (isAccessoire) {
      allData.value = rawData
    } else {
      allData.value = rawData.filter(v => {
        const modele = v.idModeleNavigation
        if (!modele) return false

        const typeVeloData = modele.typeVelo?.toLowerCase() || ''
        const titleLower = props.title?.toLowerCase() || ''

        if (props.typeVelo) {
          return typeVeloData === props.typeVelo.toLowerCase()
        }

        if (titleLower.includes('electrique') || titleLower.includes('électrique')) {
          return typeVeloData.includes('electrique') || typeVeloData.includes('électrique')
        }

        return !typeVeloData.includes('electrique') && !typeVeloData.includes('électrique')
      })
    }

    if (allData.value.length > 0) {
      const highestPrice = Math.max(...allData.value.map(item => item.prix || 0))
      maxPrice.value = Math.ceil(highestPrice / 10) * 10
    } else {
      maxPrice.value = isAccessoire ? 300 : 8000
    }
    
    filterPrice.value = maxPrice.value

  } catch (error) {
    console.error("Erreur API :", error)
    allData.value = []
  } finally {
    loading.value = false
  }
}


const availableCategories = computed(() => {
  if (!allData.value || categoriesMap.value.size === 0) return []
  const catsFound = new Map()

  allData.value.forEach(item => {
    const isAccessoire = props.typeArticle === 'Accessoires'
    const idCat = isAccessoire ? item.idCategorie : item.idModeleNavigation?.idCategorie

    if (idCat && categoriesMap.value.has(idCat)) {
      if (!catsFound.has(idCat)) {
        catsFound.set(idCat, { id: idCat, nom: categoriesMap.value.get(idCat) })
      }
    }
  })
  return Array.from(catsFound.values()).sort((a, b) => a.nom.localeCompare(b.nom))
})


const availableColors = computed(() => {
  if (!allData.value) return []
  const colorsMap = new Map()
  allData.value.forEach(item => {
    const colorObj = item.idCouleurNavigation 
    if (colorObj && colorObj.nomCouleur) {
      const name = colorObj.nomCouleur.trim()
      if (!colorsMap.has(name)) {
        const rawHex = colorObj.hexaCouleur ? colorObj.hexaCouleur.trim() : 'dddddd'
        const cleanHex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`
        colorsMap.set(name, { nom: name, code: cleanHex })
      }
    }
  })
  return Array.from(colorsMap.values()).sort((a, b) => a.nom.localeCompare(b.nom))
})

const displayedColors = computed(() => {
  if (!availableColors.value) return []
  return showAllColors.value ? availableColors.value : availableColors.value.slice(0, COLORS_LIMIT)
})


const resetFilters = () => {
  filterPrice.value = maxPrice.value
  selectedColors.value = []
  selectedCategories.value = []
  searchQuery.value = ''
  showAllColors.value = false
  currentPage.value = 1
}


const syncFiltersFromUrl = () => {
  filterPrice.value = maxPrice.value
  selectedColors.value = []
  searchQuery.value = ''
  showAllColors.value = false
  currentPage.value = 1
  
  const fId = Number(route.query.filterId)
  if (route.query.filterType === 'categorie' && fId) {
    selectedCategories.value = [fId]
  } else {
    selectedCategories.value = []
  }
}


const modelesAffichés = computed(() => {
  if (!allData.value || !Array.isArray(allData.value)) return []

  let baseList = allData.value

  if (route.query.filterType === 'modele' && route.query.filterId && selectedCategories.value.length === 0) {
    const fId = Number(route.query.filterId)
    baseList = baseList.filter(item => item.idModeleNavigation?.idModele === fId)
  }

  let idsValides = [...selectedCategories.value]
  
  if (idsValides.length > 0) {
    const trouverEnfants = (idParent) => {
      allRawCategories.value.forEach(cat => {
        if (cat.catIdCategorie === idParent && !idsValides.includes(cat.idCategorie)) {
          idsValides.push(cat.idCategorie)
          trouverEnfants(cat.idCategorie) 
        }
      })
    }
    selectedCategories.value.forEach(id => trouverEnfants(id))
  }

  return baseList.filter(item => {
    const itemPrice = item.prix || 0
    const matchPrice = itemPrice <= filterPrice.value
    
    const colorName = item.idCouleurNavigation?.nomCouleur?.trim()
    const matchColor = selectedColors.value.length === 0 || selectedColors.value.includes(colorName)

    const isAccessoire = props.typeArticle === 'Accessoires'
    const idCat = isAccessoire ? item.idCategorie : item.idModeleNavigation?.idCategorie
    
    const matchCategory = idsValides.length === 0 || idsValides.includes(idCat)

    const searchTerm = searchQuery.value.toLowerCase().trim()
    const itemName = item.idModeleNavigation?.nomModele?.toLowerCase() || item.nom?.toLowerCase() || ''
    const itemRef = item.reference?.toLowerCase() || ''
    const matchSearch = searchTerm === '' || itemName.includes(searchTerm) || itemRef.includes(searchTerm)
    
    return matchPrice && matchColor && matchCategory && matchSearch
  })
})


const totalPages = computed(() => Math.ceil(modelesAffichés.value.length / itemsPerPage))

const paginatedModeles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return modelesAffichés.value.slice(start, end)
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    scrollToShop()
  }
}


watch(modelesAffichés, () => {
  currentPage.value = 1
})


const recommandations = computed(() => {
  if (!allData.value || allData.value.length === 0) return []
  return allData.value.slice(0, 4)
})


watch(() => props.title, fetchData)

watch(() => props.typeArticle, async () => {
  await fetchCategories()
  await fetchData()
  syncFiltersFromUrl()
})

watch(() => props.typeVelo, async () => {
  await fetchData()
  syncFiltersFromUrl()
})

watch(() => route.query, () => {
  syncFiltersFromUrl()
})

onMounted(async () => {
  await fetchCategories()
  await fetchData()
  syncFiltersFromUrl()
})
</script>

<template>
  <div class="page-wrapper">
    <div class="hero-banner" :style="{ backgroundImage: `url(${heroImage})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title">{{ title }}</h1>
        <button @click="scrollToShop" class="btn-hero">
          Voir tous les {{ typeArticle === 'Accessoires' ? 'accessoires' : 'vélos' }}
        </button>
      </div>
    </div>

    <div class="shop-layout-container" ref="shopContainer">
      <header class="list-header">
        <div class="header-left"></div>
        
        <div class="header-center">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="RECHERCHER UN MODÈLE, UNE RÉF..." 
              class="search-input-top"
            >
            <span v-if="searchQuery" @click="searchQuery = ''" class="clear-search">✕</span>
          </div>
        </div>

        <div class="header-right">
          <p v-if="!loading && modelesAffichés" class="count">
            {{ modelesAffichés.length }} modèles
          </p>
        </div>
      </header>

      <div class="shop-layout">
        <aside class="sidebar" aria-label="Filtres du catalogue">
          <div class="sidebar-top">
            <h2 class="sidebar-main-title">Filtres</h2>
            <button v-if="selectedColors.length > 0 || selectedCategories.length > 0 || filterPrice < maxPrice || searchQuery !== ''" 
                    @click="resetFilters" 
                    class="btn-reset"
                    aria-label="Réinitialiser tous les filtres">
              Réinitialiser
            </button>
          </div>

          <fieldset class="filter-section">
            <legend class="section-title">Budget</legend>
            <input 
              type="range" 
              min="0" 
              :max="maxPrice" 
              :step="maxPrice > 1000 ? 100 : 10" 
              v-model="filterPrice" 
              class="price-slider"
              aria-label="Définir le budget maximum"
            >
            <div class="price-value" aria-live="polite">{{ filterPrice.toLocaleString() }} €</div>
          </fieldset>

          <fieldset v-if="availableCategories.length > 0" class="filter-section">
            <legend class="section-title">Catégories</legend>
            <div class="colors-list">
              <div v-for="cat in availableCategories" :key="cat.id" class="category-item">
                <input 
                  type="checkbox" 
                  :id="'cat-' + cat.id" 
                  :value="cat.id" 
                  v-model="selectedCategories"
                  class="custom-checkbox"
                >
                <label :for="'cat-' + cat.id" class="checkbox-label">
                  {{ cat.nom }}
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset v-if="availableColors.length > 0" class="filter-section">
            <legend class="section-title">Couleurs</legend>
            <div class="colors-list">
              <div v-for="color in displayedColors" :key="color.nom" class="color-item">
                <input 
                  type="checkbox" 
                  :id="'color-' + color.nom" 
                  :value="color.nom" 
                  v-model="selectedColors"
                  class="sr-only" 
                >
                <label :for="'color-' + color.nom" class="color-label">
                  <span class="color-circle" :style="{ backgroundColor: color.code }" aria-hidden="true"></span>
                  <span class="color-name">{{ color.nom }}</span>
                </label>
              </div>
            </div>
            
            <button 
              v-if="availableColors.length > COLORS_LIMIT" 
              @click="showAllColors = !showAllColors" 
              class="btn-toggle-colors"
              :aria-expanded="showAllColors"
            >
              {{ showAllColors ? '- Voir moins' : '+ Voir plus' }}
            </button>
          </fieldset>
        </aside>

        <main class="main-content">
          <div v-if="loading" class="loader">Chargement des produits...</div>

          <div v-else class="products-container">
            <div class="products-grid">
              <CardArticle 
                v-for="item in paginatedModeles" 
                :key="item.reference" 
                :article="item" 
              />
            </div>

            <div v-if="totalPages > 1" class="pagination-wrapper">
              <button 
                class="page-btn nav-btn" 
                :disabled="currentPage === 1" 
                @click="goToPage(currentPage - 1)"
              >
                &#10216; Précédent
              </button>
              
              <div class="page-numbers">
                <button 
                  v-for="page in totalPages" 
                  :key="page"
                  @click="goToPage(page)"
                  :class="['page-btn number-btn', { active: currentPage === page }]"
                >
                  {{ page }}
                </button>
              </div>

              <button 
                class="page-btn nav-btn" 
                :disabled="currentPage === totalPages" 
                @click="goToPage(currentPage + 1)"
              >
                Suivant &#10217;
              </button>
            </div>
          </div>

          <div v-if="!loading && modelesAffichés.length === 0" class="no-results-container">
            <div class="empty-message">
              <h2>Oups ! Aucun article ne correspond.</h2>
              <p>Peut-être qu'un autre style pourrait vous plaire ?</p>
              <button @click="resetFilters" class="btn-clear-search">Voir tout le catalogue</button>
            </div>

            <div class="recommendations-section">
              <h3 class="rec-title">Nos coups de cœur pour vous</h3>
              <div class="products-grid">
                <CardArticle 
                  v-for="item in recommandations" 
                  :key="'rec-' + item.reference" 
                  :article="item" 
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');


.page-wrapper { width: 100%; }
.hero-banner {
  position: relative; width: 100%; height: 100vh;
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
}
.hero-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4);
}
.hero-content {
  position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 30px;
}
.hero-title {
  color: #ffffff; font-family: 'Inter', sans-serif; font-size: 4.5rem; font-weight: 900;
  text-transform: uppercase; font-style: italic; text-align: center; text-shadow: 2px 4px 10px rgba(0, 0, 0, 0.6);
  letter-spacing: 2px; margin: 0; padding: 0 20px;
}
.btn-hero {
  background-color: #ffffff; color: #000000; border: none; padding: 15px 40px; border-radius: 50px;
  font-family: 'Inter', sans-serif; font-size: 1rem; font-weight: 900; text-transform: uppercase;
  font-style: italic; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
.btn-hero:hover { background-color: #00A3E0; color: #ffffff; transform: translateY(-2px); }


.shop-layout-container { max-width: 1700px; margin: 60px auto 0; padding: 0 40px; font-family: 'Inter', sans-serif; }
.shop-layout { display: flex; margin-top: 50px; gap: 80px; align-items: flex-start; }


.list-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 25px; }
.header-left, .header-right { flex: 0 0 250px; }
.header-right { text-align: right; }
.header-center { flex: 1; display: flex; justify-content: center; }
.search-box { position: relative; width: 100%; max-width: 450px; }
.search-input-top { width: 100%; padding: 12px 25px; border: 1.5px solid #000; border-radius: 50px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; outline: none; text-align: center; transition: all 0.3s ease; }
.search-input-top:focus { border-color: #00A3E0; box-shadow: 0 4px 15px rgba(0, 163, 224, 0.15); }
.count { font-weight: 700; text-transform: uppercase; font-size: 0.85rem; color: #555; margin: 0; }
.clear-search { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #555; }


.sidebar { 
  width: 310px; flex-shrink: 0; position: relative; 
  background-color: #f0f0f0; padding: 40px 30px; border-radius: 25px; 
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); height: fit-content; overflow: visible; 
}
.sidebar-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; }
.sidebar-main-title { font-size: 1.2rem; font-weight: 900; text-transform: uppercase; font-style: italic; margin: 0; }

.btn-reset { background: none; border: none; color: #00A3E0; text-transform: uppercase; font-weight: 700; font-size: 0.7rem; cursor: pointer; text-decoration: underline; padding: 0; }
.filter-section { margin-bottom: 35px; padding-bottom: 25px; border-bottom: 1px solid #e0e0e0; }
.filter-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.section-title { font-size: 0.85rem; font-weight: 900; text-transform: uppercase; font-style: italic; margin-bottom: 20px; margin-top: 0; }


.category-item { display: flex; align-items: center; margin-bottom: 12px; }
.custom-checkbox { margin-right: 12px; accent-color: #000; width: 16px; height: 16px; cursor: pointer; }
.checkbox-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #555; cursor: pointer; transition: color 0.2s ease; }
.custom-checkbox:checked + .checkbox-label { color: #000; }


.price-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; outline: none; }
.price-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #000; border: 3px solid #00A3E0; border-radius: 50%; cursor: pointer; }
.price-value { margin-top: 15px; font-weight: 900; font-size: 1.3rem; font-style: italic; }


.colors-list { display: flex; flex-direction: column; gap: 10px; }
.color-item { position: relative; }
.color-label { display: flex; align-items: center; cursor: pointer; padding: 4px 0; }
.color-circle { width: 22px; height: 22px; border-radius: 50%; margin-right: 15px; border: 1px solid rgba(0, 0, 0, 0.1); transition: transform 0.2s ease; }
.color-name { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #555; transition: color 0.2s ease; }
.sr-only:checked + .color-label .color-name { color: #000; }
.sr-only:checked + .color-label .color-circle { transform: scale(1.2); border: 2px solid #000; }

.btn-toggle-colors {
  background-color: #00A3E0; color: #ffffff; border: none; width: 100%; height: 45px; border-radius: 50px;
  font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 900; text-transform: uppercase;
  font-style: italic; letter-spacing: 1px; cursor: pointer; margin-top: 25px; transition: all 0.3s ease;
  display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 15px rgba(0, 163, 224, 0.2);
}
.btn-toggle-colors:hover { background-color: #0089bd; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 163, 224, 0.3); }


.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
fieldset { border: none; margin: 0; padding: 0; }
legend { padding: 0; width: 100%; }
.sr-only:focus-visible + .color-label, .custom-checkbox:focus-visible, .price-slider:focus-visible, .btn-reset:focus-visible, .btn-toggle-colors:focus-visible {
  outline: 3px solid #00A3E0; outline-offset: 4px; border-radius: 4px;
}


.main-content { flex-grow: 1; display: flex; flex-direction: column; }
.products-container { display: flex; flex-direction: column; min-height: 800px; justify-content: space-between; }
.products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 40px; margin-bottom: 60px; }
.loader { text-align: center; padding: 100px 0; font-size: 1.1rem; font-weight: 700; color: #bbb; text-transform: uppercase; }

.pagination-wrapper { 
  display: flex; justify-content: center; align-items: center; gap: 20px; margin: 40px 0 80px; 
}
.page-numbers { display: flex; gap: 8px; }
.page-btn {
  background: #f0f0f0; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer;
  font-family: 'Inter', sans-serif; font-weight: 700; color: #333; transition: all 0.2s ease;
}
.page-btn:hover:not(:disabled) { background: #e0e0e0; }
.page-btn.active { background: #000; color: #fff; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.number-btn { width: 40px; padding: 10px 0; text-align: center; }
.nav-btn { text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }


.no-results-container { text-align: center; padding: 40px 0; }
.empty-message { margin-bottom: 80px; background: #f9f9f9; padding: 40px; border-radius: 20px; }
.empty-message h2 { font-weight: 900; text-transform: uppercase; font-style: italic; font-size: 1.5rem; margin-bottom: 10px; margin-top: 0; }
.empty-message p { color: #888; margin-bottom: 20px; }
.btn-clear-search { background: #000; color: #fff; border: none; padding: 12px 25px; border-radius: 50px; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; cursor: pointer; transition: background 0.3s ease; }
.btn-clear-search:hover { background: #00A3E0; }
.rec-title { text-align: left; font-weight: 900; text-transform: uppercase; font-style: italic; font-size: 1.2rem; margin-bottom: 30px; border-left: 5px solid #00A3E0; padding-left: 15px; }
</style>