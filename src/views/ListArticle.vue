<script setup>
import { ref, onMounted, watch } from 'vue'
import CardArticle from '../components/CardArticle.vue'

// Ajoute bien 'typeArticle' dans les props reçues
const props = defineProps(['typeVelo', 'title', 'typeArticle'])
const modelesAffichés = ref([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    let url = ''
    // 1. Choix de l'URL selon si c'est Accessoires ou Vélos
    if (props.typeArticle === 'Accessoires') {
      url = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Accessoire/GetAccessoires'
    } else {
      url = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/VarianteVelo/GetVariantes'
    }

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)
    const data = await response.json()

    // 2. Filtrage (Uniquement pour les vélos, car les accessoires n'ont pas de typeVelo)
    if (props.typeArticle !== 'Accessoires' && props.typeVelo) {
      modelesAffichés.value = data.filter(v => 
        v.idModeleNavigation?.typeVelo?.toLowerCase() === props.typeVelo.toLowerCase()
      )
    } else {
      modelesAffichés.value = data
    }
  } catch (error) {
    console.error("Erreur API :", error)
  } finally {
    loading.value = false
  }
}

watch(() => props.typeVelo, fetchData)
onMounted(fetchData)
</script>

<template>
  <div class="container">
    <header class="list-header">
      <h1>{{ title }}</h1>
      <p v-if="!loading" class="count">{{ modelesAffichés.length }} modèles trouvés</p>
    </header>

    <div v-if="loading" class="loader">Chargement des vélos...</div>

    <div v-else class="vélos-grid">
      <CardArticle 
        v-for="velo in modelesAffichés" 
        :key="velo.reference" 
        :velo="velo" 
      />
    </div>

    <div v-if="!loading && modelesAffichés.length === 0" class="empty">
      Aucun vélo de type "{{ typeVelo }}" n'est disponible pour le moment.
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 1200px; margin: 0 auto; padding: 20px; }
.list-header { margin-top: 80px; margin-bottom: 30px; border-bottom: 2px solid #f0f0f0; pb: 10px; }
.count { color: #888; font-style: italic; }
.vélos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2.5rem;
}
.loader, .empty { text-align: center; padding: 50px; font-size: 1.2rem; color: #666; }
</style>