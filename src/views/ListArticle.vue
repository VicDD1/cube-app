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

// --- 1. EXTRACTION DES COULEURS (Dynamique selon les produits présents) ---
const availableColors = computed(() => {
  const colorsMap = new Map()
  
  allData.value.forEach(item => {
    const colorObj = item.idCouleurNavigation 
    if (colorObj && colorObj.nomCouleur) {
      const name = colorObj.nomCouleur.trim()
      if (!colorsMap.has(name)) {
        // On ajoute le # devant le code hexa s'il manque
        const rawHex = colorObj.hexaCouleur ? colorObj.hexaCouleur.trim() : 'dddddd'
        const cleanHex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`
        
        colorsMap.set(name, {
          nom: name,
          code: cleanHex
        })
      }
    }
  })
  return Array.from(colorsMap.values()).sort((a, b) => a.nom.localeCompare(b.nom))
})

// --- 2. FILTRAGE DYNAMIQUE ---
const modelesAffichés = computed(() => {
  return allData.value.filter(item => {
    const matchPrice = item.prix <= filterPrice.value
    const colorName = item.idCouleurNavigation?.nomCouleur?.trim()
    const matchColor = selectedColors.value.length === 0 || selectedColors.value.includes(colorName)
    return matchPrice && matchColor
  })
})

watch(() => props.typeVelo, fetchData)
onMounted(fetchData)
</script>

<template>
  <div class="shop-layout">
    <aside class="sidebar">
      <div class="filter-section">
        <h3 class="section-title">PRIX</h3>
        <input type="range" min="0" max="8000" step="100" v-model="filterPrice" class="price-slider">
        <div class="price-value">{{ filterPrice.toLocaleString() }} €</div>
      </div>

      <div v-if="availableColors.length > 0" class="filter-section" >
        <h3 class="section-title">COULEURS</h3>
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
              <span 
                class="color-circle" 
                :style="{ backgroundColor: color.code }"
                :title="color.nom"
              ></span>
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

    <div v-else class="vélos-grid">
      <CardArticle 
        v-for="item in modelesAffichés" 
        :key="item.reference" 
        :article="item" 
      />
    </div>


      <div v-if="loading" class="loader">Chargement des produits...</div>

      <div v-else class="products-grid">
        <CardArticle 
          v-for="velo in modelesAffichés" 
          :key="velo.reference" 
          :velo="velo" 
        />
      </div>

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

/* --- SIDEBAR --- */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 120px;
  height: fit-content;
}

.filter-section {
  max-height: 400px;
  padding-left: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 50px;
  padding-bottom: 30px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 900;
  text-transform: uppercase;
  font-style: italic;
  margin-bottom: 25px;
  letter-spacing: 1px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}



/* --- CUSTOM PRICE SLIDER --- */
.price-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
  margin: 20px 0;
}

.price-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #000;
  border: 4px solid #40E0D0;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.price-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.price-value {
  font-weight: 900;
  font-size: 1.4rem;
  font-style: italic;
  color: #000;
}

/* --- COLORS LIST --- */
.colors-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-item {
  position: relative;
}

/* On cache la checkbox par défaut pour un look plus moderne */
.hidden-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.color-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #888;
  transition: all 0.2s ease;
  padding: 4px 0;
}

.color-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 15px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Effet au survol */
.color-label:hover {
  color: #000;
  transform: translateX(5px);
}

/* Style quand coché */
.hidden-checkbox:checked + .color-label {
  color: #000;
}

.hidden-checkbox:checked + .color-label .color-circle {
  transform: scale(1.3);
  border: 2px solid #000;
  box-shadow: 0 0 0 3px rgba(64, 224, 208, 0.3); /* Halo cyan autour */
}

/* --- MAIN CONTENT --- */
.main-content {
  flex-grow: 1;
}

.list-header {
  margin-bottom: 50px;
  border-bottom: 2px solid #000;
  padding-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.list-header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  text-transform: uppercase;
  font-style: italic;
  margin: 0;
  letter-spacing: -1px;
}

.count {
  font-weight: 700;
  font-size: 0.9rem;
  color: #888;
  text-transform: uppercase;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 40px;
}

.loader, .empty {
  text-align: center;
  padding: 120px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #bbb;
  text-transform: uppercase;
  font-style: italic;
}
</style>