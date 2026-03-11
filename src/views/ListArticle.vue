<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps(['typeRecherche', 'title'])
const modelesAffichés = ref([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    // 1. On récupère la liste complète de TOUS les vélos
    const url = `https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Modele/GetModeles`
    const response = await fetch(url)
    const tousLesModeles = await response.json()
    
    // 2. On filtre pour ne garder que ceux qui correspondent au "typeVelo"
    // On utilise toLowerCase() pour éviter les erreurs de majuscules
    modelesAffichés.value = tousLesModeles.filter(m => 
      m.typeVelo?.toLowerCase() === props.typeRecherche.toLowerCase()
    )
  } catch (error) {
    console.error("Erreur API :", error)
  } finally {
    loading.value = false
  }
}

// Relance le filtrage si on change d'onglet
watch(() => props.typeRecherche, fetchData)
onMounted(fetchData)
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    
    <div v-if="loading">Recherche des vélos en cours...</div>
    
    <div v-else class="grid">
      <div v-for="modele in modelesAffichés" :key="modele.idModele" class="card">
        <h3>{{ modele.nomModele }}</h3>
        <p>Type détecté : {{ modele.typeVelo }}</p>
      </div>
      
      <div v-if="modelesAffichés.length === 0">
        Aucun vélo de type "{{ typeRecherche }}" trouvé.
      </div>
    </div>
  </div>
</template>

<style>
h1{
    margin-top: 100px;
}

</style>