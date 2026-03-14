<script setup>
import { ref, onMounted } from 'vue'

const categories = ref([])
const isLoaded = ref(false)

// On va chercher toutes les catégories de vélos dans ton API
const fetchCategories = async () => {
  try {
    const res = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/CategorieVelo/GetCategories')
    const data = await res.json()

    const flatList = []
    
    // Fonction pour tout mettre à plat (parents et enfants)
    const extractCats = (cats) => {
      cats.forEach(c => {
        if (c && c.idCategorie && c.nomCategorie) {
          flatList.push({ 
            id: c.idCategorie, 
            nom: c.nomCategorie.trim().toLowerCase() 
          })
          if (c.inverseCatIdCategorieNavigation && c.inverseCatIdCategorieNavigation.length > 0) {
            extractCats(c.inverseCatIdCategorieNavigation)
          }
        }
      })
    }
    
    extractCats(data.$values || data || [])
    categories.value = flatList
    isLoaded.value = true
  } catch (error) {
    console.error("Erreur chargement catégories Footer :", error)
  }
}

// Fonction magique pour trouver l'ID d'après le nom exact
const getId = (nomCherche) => {
  const cat = categories.value.find(c => c.nom === nomCherche.toLowerCase())
  return cat ? cat.id : null
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <footer class="cube-footer">
    <div class="footer-columns">
      
      <div class="col">
        <h3>VÉLOS</h3>
        <ul v-if="isLoaded">
          <li v-if="getId('VTT')">
            <router-link :to="{ path: '/velos', query: { filterName: 'VTT', filterId: getId('VTT'), filterType: 'categorie' } }">VTT</router-link>
          </li>
          <li v-if="getId('Route')">
            <router-link :to="{ path: '/velos', query: { filterName: 'Route', filterId: getId('Route'), filterType: 'categorie' } }">Route</router-link>
          </li>
          <li v-if="getId('Ville et Campagne')">
            <router-link :to="{ path: '/velos', query: { filterName: 'Ville et Campagne', filterId: getId('Ville et Campagne'), filterType: 'categorie' } }">Ville et Campagne</router-link>
          </li>
          <li v-if="getId('Enfants')">
            <router-link :to="{ path: '/velos', query: { filterName: 'Enfants', filterId: getId('Enfants'), filterType: 'categorie' } }">Enfants</router-link>
          </li>
        </ul>
      </div>

      <div class="col">
        <h3>VÉLOS HYBRIDS</h3>
        <ul v-if="isLoaded">
          <li v-if="getId('VTTAE')">
            <router-link :to="{ path: '/velos-electriques', query: { filterName: 'VTTAE', filterId: getId('VTTAE'), filterType: 'categorie' } }">VTTAE</router-link>
          </li>
          <li v-if="getId('Ville et Campagne')">
            <router-link :to="{ path: '/velos-electriques', query: { filterName: 'Ville et Campagne', filterId: getId('Ville et Campagne'), filterType: 'categorie' } }">Ville et Campagne</router-link>
          </li>
          <li v-if="getId('Enfants')">
            <router-link :to="{ path: '/velos-electriques', query: { filterName: 'Enfants', filterId: getId('Enfants'), filterType: 'categorie' } }">Enfants</router-link>
          </li>
        </ul>
      </div>

      <div class="col">
        <h3>LÉGAL</h3>
        <ul>
          <li><a href="#">Politique de confidentialité et gestion des Cookies</a></li>
          <li><a href="#">Conditions Générales de Vente</a></li>
          <li><a href="#">Paramétrer les cookies</a></li>
        </ul>
      </div>

    </div>
  </footer>
</template>

<style scoped>
.cube-footer {
  background-color: #111;
  color: #999;
  padding: 60px 40px;
  font-family: Arial, sans-serif;
}

.footer-columns {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.col h3 {
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  font-style: italic;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.col li {
  margin-bottom: 12px;
}

.col a, .col router-link {
  color: #999;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.col a:hover, .col router-link:hover {
  color: #fff;
}
</style>