<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import CardArticle from '../components/CardArticle.vue'

const props = defineProps(['typeVelo', 'title', 'typeArticle'])
const allData = ref([]) 
const loading = ref(true)

// --- États des Filtres ---
const filterPrice = ref(8000)
const selectedColors = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const isAccessoire = props.typeArticle === 'Accessoires'
    
    const url = isAccessoire 
      ? 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Accessoire/GetAccessoires'
      : 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/VarianteVelo/GetVariantes'

    const response = await fetch(url)
    const data = await response.json()

    // CORRECTION ICI : .value au lieu de .ref
    if (isAccessoire) {
      allData.value = data
    } else if (props.typeVelo) {
      allData.value = data.filter(v => 
        v.idModeleNavigation?.typeVelo?.toLowerCase() === props.typeVelo.toLowerCase()
      )
    } else {
      allData.value = data
    }
  } catch (error) {
    console.error("Erreur API :", error)
  } finally {
    loading.value = false
  }
}

// --- 1. Extraction des couleurs (Calculé) ---
const availableColors = computed(() => {
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

// --- 2. Filtrage Dynamique (Calculé) ---
const modelesAffichés = computed(() => {
  return allData.value.filter(item => {
    // Vérification de sécurité sur le prix
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

watch(() => props.typeVelo, fetchData)
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