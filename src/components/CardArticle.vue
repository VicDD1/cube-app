<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '../stores/useStore'

const props = defineProps({
  article: { type: Object, required: true }
})

const appStore = useAppStore()
const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'

const inventaireRaw = ref([])
const loadingStock = ref(true)


const fetchRealStock = async () => {
  loadingStock.value = true
  try {
    const res = await fetch(`${API_BASE}/Articles/GetStock/${props.article.reference.trim()}`)
    const data = await res.json()
    
    inventaireRaw.value = data.articleInventaires?.$values || data.articleInventaires || []
  } catch (err) {
    console.error("Erreur stock card:", err)
  } finally {
    loadingStock.value = false
  }
}


const hasOnlineStock = computed(() => {
  return inventaireRaw.value.some(inv => (inv.quantiteStockEnLigne || 0) > 0)
})

const hasMagasinStock = computed(() => {
  if (appStore.magasinChoisi) {
    return inventaireRaw.value.some(inv => {
      const magasins = inv.inventaireMagasins?.$values || inv.inventaireMagasins || []
      return magasins.some(m => m.idMagasin === appStore.magasinChoisi.idMagasin && m.quantiteStockMagasin > 0)
    })
  }
  return inventaireRaw.value.some(inv => {
    const magasins = inv.inventaireMagasins?.$values || inv.inventaireMagasins || []
    return magasins.some(m => m.quantiteStockMagasin > 0)
  })
})

onMounted(fetchRealStock)

watch(() => props.article.reference, fetchRealStock)

const getImageUrl = (ref) => {
  const cleanRef = ref.trim()
  const folder = cleanRef.length === 6 ? 'VELOS' : 'ACCESSOIRES'
  return new URL(`../assets/images/${folder}/${cleanRef}/image_1.webp`, import.meta.url).href
}
</script>


<template>
  <RouterLink v-if="article" class="card-article" :to="{ name: 'visualize', params: { id: article.reference?.trim() }}" >
    
    <div class="image-container">
      <img :src="getImageUrl(article.reference)" :alt="article.nomArticle" loading="lazy">
    </div>
    
    <div class="card-content">
      <h3 class="nom">{{ article.nomArticle }}</h3>

      <div class="status-container">
        <div v-if="loadingStock" class="status-skeleton"></div>
        <template v-else>
          <div class="status-pill" :class="hasOnlineStock ? 'ok' : 'out'">
            <span class="dot"></span> En ligne
          </div>
          <div class="status-pill" :class="hasMagasinStock ? 'ok' : 'out'">
            <span class="dot"></span> Magasin
          </div>
        </template>
      </div>
      
      <div class="card-footer">
        <span class="prix">{{ article.prix?.toLocaleString() }} €</span>
        <div class="btn-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  </RouterLink>
</template><style scoped>

.card-article {
  background: #ffffff;
  text-decoration: none;
  color: #0f172a;
  display: flex;
  flex-direction: column;
  padding: 16px; 
  height: 100%;
  border-radius: 24px; 
  border: 1px solid #f1f5f9; 
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}


.card-article:hover {
  transform: translateY(-8px);
  border-color: transparent;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
}

.image-container {
  width: 100%;
  height: 220px;
  background: #f8fafc; 
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  overflow: hidden;
}

.image-container img {
  max-width: 85%;
  max-height: 85%;
  object-fit: contain;
  
}


.card-article:hover .image-container img {
  transform: none; 
}


.card-article:hover {
  transform: translateY(-4px); 
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06); 
  border-color: #e2e8f0;
}

.card-article:hover .nom {
  color: #00A3E0; 
}

.card-article:hover .btn-arrow {
  background: #00A3E0;
  color: #ffffff;
  
}

.card-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.nom {
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
  min-height: 2.6em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}

.card-article:hover .nom {
  color: #00A3E0;
}


.status-container {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.3s ease;
}


.status-pill.ok {
  background: #ecfdf5; 
  color: #059669;
}

.status-pill.ok .dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}


.status-pill.out {
  background: #fff1f2; 
  color: #e11d48;
}

.status-pill.out .dot {
  background: #fb7185;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}


.card-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
}

.prix {
  font-size: 1.4rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.03em;
}


.btn-arrow {
  width: 40px;
  height: 40px;
  background: #f1f5f9;
  color: #0f172a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-arrow svg {
  width: 18px;
  height: 18px;
}

.card-article:hover .btn-arrow {
  background: #00A3E0;
  color: #ffffff;
  transform: translateX(4px); 
}


.status-skeleton {
  width: 80px;
  height: 20px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>