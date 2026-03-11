<script setup>
import { ref, onMounted, watch } from 'vue'
import CardArticle from '../components/CardArticle.vue'

const props = defineProps(['typeVelo', 'title'])
const modelesAffichés = ref([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const url = `https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/VarianteVelo/GetVariantes`
    const response = await fetch(url)
    
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)
    
    const variantes = await response.json()
    
    // On filtre en allant chercher le type dans l'objet de navigation du modèle
    if (props.typeVelo) {
      modelesAffichés.value = variantes.filter(v => 
        v.idModeleNavigation?.typeVelo?.toLowerCase() === props.typeVelo.toLowerCase()
      )
    } else {
      modelesAffichés.value = variantes
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