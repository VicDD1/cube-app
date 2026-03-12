<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router' // Permet de lire l'URL
import CardArticle from '../components/CardArticle.vue'

const props = defineProps(['typeVelo', 'title', 'typeArticle'])
const route = useRoute() // Initialisation de route
const allData = ref([]) 
const loading = ref(true)

// --- États des Filtres ---
const filterPrice = ref(8000)
const selectedColors = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const isAccessoire = props.typeArticle === 'Accessoires'

    // 1. Définition des URLs (Vélos + Arbre des catégories)
    const urlArticles = isAccessoire
      ? 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Accessoire/GetAccessoires'
      : 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/VarianteVelo/GetVariantes'
    
    const urlCategories = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/CategorieVelo/GetCategories'

    // 2. On lance les deux appels API en même temps pour aller plus vite
    const [resArticles, resCategories] = await Promise.all([
      fetch(urlArticles),
      !isAccessoire ? fetch(urlCategories) : Promise.resolve({ json: () => [] })
    ])

const data = await resArticles.json()
    const categoriesData = await resCategories.json()
    const allCategories = categoriesData.$values || categoriesData || []

    const filterId = route.query.filterId ? Number(route.query.filterId) : null
    // On récupère le type qu'on vient d'envoyer depuis le header !
    const filterType = route.query.filterType 

    if (isAccessoire) {
      allData.value = data
    } else {
      
      // --- ÉTAPE A : Tri ULTRA STRICT Musculaire vs Électrique ---
      // On regarde carrément l'URL de ta page pour être sûr à 100% de là où on est
      const isRouteElectrique = route.path.includes('electrique')

      let velosTries = data.filter(v => {
        const typeVeloAPI = v.idModeleNavigation?.typeVelo?.toLowerCase() || ''
        
        // Si on est dans "Vélos Électriques", on DÉGAGE tout ce qui n'a pas le mot électrique
        if (isRouteElectrique && !typeVeloAPI.includes('electrique')) return false
        
        // Si on est dans "Vélos" (musculaires), on DÉGAGE tout ce qui a le mot électrique
        if (!isRouteElectrique && typeVeloAPI.includes('electrique')) return false
        
        return true
      })

      // --- ÉTAPE B : Tri intelligent par Catégorie OU par Modèle ---
      if (filterId) {
        
        if (filterType === 'modele') {
          // Cas n°1 : Tu as cliqué sur un MODÈLE (ex: Phenix). 
          // On ne garde QUE les vélos qui ont cet idModele précis. C'est direct.
          velosTries = velosTries.filter(v => v.idModeleNavigation?.idModele === filterId)
          
        } else {
          // Cas n°2 : Tu as cliqué sur une CATÉGORIE (ex: VTT ou Cross-Country).
          // On fait notre fameuse recherche d'arbre généalogique.
          let idsValides = [filterId]

          const trouverEnfants = (idParent) => {
            allCategories.forEach(cat => {
              const idParentAPI = cat.catIdCategorie 
              const idCat = cat.idCategorie 
              if (idParentAPI === idParent && !idsValides.includes(idCat)) {
                idsValides.push(idCat)
                trouverEnfants(idCat)
              }
            })
          }

          trouverEnfants(filterId)

          // On garde les vélos dont la catégorie fait partie des idsValides
          velosTries = velosTries.filter(v => idsValides.includes(v.idModeleNavigation?.idCategorie))
        }
      }

      allData.value = velosTries
    }
  } catch (error) {
    console.error("Erreur API :", error)
  } finally {
    loading.value = false
  }
}

// ... Tes computed (availableColors et modelesAffichés) et tes filtres restent EXACTEMENT pareils ...
const availableColors = computed(() => { /* Ton code actuel */
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

const modelesAffichés = computed(() => { /* Ton code actuel */
  return allData.value.filter(item => {
    const itemPrice = item.prix || 0
    const matchPrice = itemPrice <= filterPrice.value
    const colorName = item.idCouleurNavigation?.nomCouleur?.trim()
    const matchColor = selectedColors.value.length === 0 || selectedColors.value.includes(colorName)
    return matchPrice && matchColor
  })
})

const resetFilters = () => {
  filterPrice.value = 8000
  selectedColors.value = []
}

// On relance la recherche si on change de page, MAIS AUSSI si on clique sur un nouveau lien du header
watch([() => props.typeVelo, () => route.query.filterId], fetchData)

onMounted(fetchData)
</script>

<template>
  <div class="shop-layout">
    <aside class="sidebar">
      <div class="sidebar-top">
        <h2 class="sidebar-main-title">Filtres</h2>
        <button v-if="selectedColors.length > 0 || filterPrice < 8000" @click="resetFilters" class="btn-reset">Réinitialiser</button>
      </div>

      <div class="filter-section">
        <h3 class="section-title">Budget</h3>
        <input type="range" min="0" max="8000" step="100" v-model="filterPrice" class="price-slider">
        <div class="price-value">{{ filterPrice.toLocaleString() }} €</div>
      </div>

      <div v-if="availableColors.length > 0" class="filter-section scrollable">
        <h3 class="section-title">Couleurs</h3>
        <div class="colors-list">
          <div v-for="color in availableColors" :key="color.nom" class="color-item">
            <input 
              type="checkbox" 
              :id="'color-' + color.nom" 
              :value="color.nom" 
              v-model="selectedColors"
              class="hidden-checkbox"
            >
            <label :for="'color-' + color.nom" class="color-label">
              <span class="color-circle" :style="{ backgroundColor: color.code }"></span>
              <span class="color-name">{{ color.nom }}</span>
            </label>
          </div>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="list-header">
        <h1>{{ title }}</h1>
        <p v-if="!loading" class="count">{{ modelesAffichés.length }} modèles trouvés</p>
      </header>

      <div v-if="loading" class="loader">Chargement des produits...</div>

      <div class="products-grid">
  <CardArticle 
    v-for="item in modelesAffichés" 
    :key="item.reference" 
    :article="item"  /></div>

      <div v-if="!loading && modelesAffichés.length === 0" class="empty">
        Aucun article ne correspond à vos critères de recherche.
      </div>
    </main>
    
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

.shop-layout {
  display: flex;
  max-width: 1700px;
  margin: 100px auto 0;
  gap: 80px;
  padding: 0 40px;
  font-family: 'Inter', sans-serif;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 120px;
  height: fit-content;
}

.sidebar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.sidebar-main-title {
  font-size: 1.2rem;
  font-weight: 900;
  text-transform: uppercase;
  font-style: italic;
}

.btn-reset {
  background: none;
  border: none;
  color: #40E0D0;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.7rem;
  cursor: pointer;
  text-decoration: underline;
}

.filter-section {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-section.scrollable {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

/* Custom Scrollbar */
.filter-section::-webkit-scrollbar { width: 4px; }
.filter-section::-webkit-scrollbar-track { background: #f1f1f1; }
.filter-section::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }

.section-title {
  font-size: 0.85rem;
  font-weight: 900;
  text-transform: uppercase;
  font-style: italic;
  margin-bottom: 20px;
  letter-spacing: 1px;
}

.price-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.price-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #000;
  border: 3px solid #40E0D0;
  border-radius: 50%;
  cursor: pointer;
}

.price-value {
  margin-top: 10px;
  font-weight: 900;
  font-size: 1.3rem;
  font-style: italic;
}

.colors-list { display: flex; flex-direction: column; gap: 10px; }

.hidden-checkbox { position: absolute; opacity: 0; }

.color-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 0;
  transition: transform 0.2s ease;
}

.color-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 15px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.color-name {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #888;
}

.hidden-checkbox:checked + .color-label .color-name { color: #000; }
.hidden-checkbox:checked + .color-label .color-circle {
  transform: scale(1.2);
  border: 2px solid #000;
}

.main-content { flex-grow: 1; }

.list-header {
  margin-bottom: 50px;
  border-bottom: 2px solid #000;
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.list-header h1 { font-size: 2.5rem; font-weight: 900; text-transform: uppercase; font-style: italic; margin: 0; }

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 40px;
}

.loader, .empty { text-align: center; padding: 100px 0; font-size: 1.1rem; font-weight: 700; color: #bbb; text-transform: uppercase; }
</style>