<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps(['typeVelo', 'title'])
const modelesAffichés = ref([])
const loading = ref(true)
const rawData = ref(null) // Pour le var_dump de la réponse brute

const fetchData = async () => {
  loading.value = true
  try {
    const url = `https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Modele/GetModeles`
    const response = await fetch(url)
    
    // Si la réponse n'est pas OK (ex: 404 ou 500)
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`)
    
    const tousLesModeles = await response.json()
    rawData.value = tousLesModeles // On stocke pour le debug
    
    // FILTRAGE : On compare typeVelo de l'API avec la prop reçue
    if (props.typeVelo) {
      modelesAffichés.value = tousLesModeles.filter(m => 
        m.typeVelo?.toLowerCase() === props.typeVelo.toLowerCase()
      )
    } else {
      modelesAffichés.value = tousLesModeles
    }
    
  } catch (error) {
    console.error("Erreur API :", error)
    rawData.value = { error: error.message, info: "Vérifie le CORS sur ton API Azure" }
  } finally {
    loading.value = false
  }
}

// Relance le filtrage si on change d'onglet/type
watch(() => props.typeVelo, fetchData)
onMounted(fetchData)
</script>

<template>
  <div class="container">
    <h1>{{ title }}</h1>

    <div class="debug-section">
 
    </div>
    <div v-if="loading" class="loader">
      Chargement des vélos...
    </div>
    
    <div v-else class="grid">
      <div v-for="modele in modelesAffichés" :key="modele.idModele" class="card">
        <h3>{{ modele.nomModele }}</h3>
        <p class="tag">Type : {{ modele.typeVelo }}</p>
        <p>ID: {{ modele.idModele }}</p>
      </div>
      
      <div v-if="modelesAffichés.length === 0" class="empty">
        <p>Désolé, aucun vélo trouvé pour "{{ typeVelo }}".</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  margin-top: 80px;
  padding: 20px;
  font-family: sans-serif;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

/* Style du Var Dump */
.debug-section {
  margin: 20px 0;
}

.var-dump {
  background: #1e1e1e;
  color: #76ff03;
  padding: 15px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 300px;
  border: 1px solid #333;
}

/* Style des cartes */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.card {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  background: white;
  transition: transform 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.card:hover {
  transform: translateY(-5px);
}

.tag {
  display: inline-block;
  background: #e1f5fe;
  color: #0288d1;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
}

.loader, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>