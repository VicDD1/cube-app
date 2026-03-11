<script setup>
import { RouterLink } from 'vue-router'

const props = defineProps({
  // Renommé de 'velo' à 'article' pour la polyvalence
  article: { type: Object, required: true }
})

const getImageUrl = (reference) => {
  if (!reference) return ''

  const ref = reference.trim()
  const folder = ref.length === 6 ? 'VELOS' : 'ACCESSOIRES'

  return new URL(`../assets/images/${folder}/${ref}/image_1.webp`, import.meta.url).href
}
</script>

<template>
  <RouterLink class="card-article" :to="{ name: 'visualize', params: { id: article.reference?.trim() }}" >

    <div class="image-container">
      <img 
        :src="article.image ? article.image : getImageUrl(article.reference)" 
        :alt="article.nomArticle"
        @error="(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Image+Indisponible'"
      >
    </div>
    
    <div class="card-content">
      <h3 class="nom">{{ article.nomArticle }}</h3>
      
      <div class="availability">
        <div class="status-item">
          <span class="dot green"></span> Disponible en ligne
        </div>
        <div class="status-item">
          <span class="dot green"></span> Disponible en magasins
        </div>
      </div>

      <div class="card-footer">
        <div class="price-container">
          <span class="prix">{{ article.prix?.toLocaleString() }} €</span>
        </div>
        <div class="btn-product">VOIR LE PRODUIT</div>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
.card-article {
  font-family: 'Inter', sans-serif;
  background: #fff;
  border-radius: 4px; /* Un très léger arrondi pour la modernité */
  
  /* AJOUT DU CADRE ICI */
  border: 1px solid #e0e0e0; 
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  padding: 20px;
  position: relative; /* Important pour le positionnement du badge */
}

/* EFFET AU SURVOL : Le cadre s'assombrit ou on ajoute une ombre */
.card-article:hover {
  border-color: #000; /* Le cadre devient noir au survol */
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); /* Petite ombre portée pour décoller la carte */
  transform: translateY(-5px); /* La carte monte légèrement */
}

/* --- Image --- */
.image-container {
  width: 100%;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
}

.card-article:hover img {
  transform: scale(1.05);
}

/* --- Content --- */
.card-content {
  text-align: center; /* Centré comme sur ton image */
}

.nom {
  font-size: 1.4rem;
  font-weight: 900;
  text-transform: uppercase;
  font-style: italic;
  margin-bottom: 20px;
  color: #000;
  letter-spacing: -0.5px;
}

/* --- Availability (Les points verts) --- */
.availability {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 30px;
  padding-left: 20%; /* Pour décaler un peu vers le centre */
}

.status-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #333;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 12px;
}

.dot.green {
  background-color: #7ED321;
}

/* --- Footer & Prix --- */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.prix {
  font-size: 1.8rem;
  font-weight: 900;
  color: #000;
}

/* --- Bouton style parallélogramme --- */
.btn-product {
  background: #000;
  color: #fff;
  border: none;
  padding: 12px 25px;
  font-weight: 900;
  font-style: italic;
  cursor: pointer;
  clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%); /* Crée l'effet penché */
  transition: background 0.3s ease;
}

.btn-product:hover {
  background: #333;
}

/* --- Badges --- */
badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 15px;
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  background: #f0f0f0;
  z-index: 10;
}


</style>