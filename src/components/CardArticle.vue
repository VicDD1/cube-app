<script setup>
defineProps({
  velo: {
    type: Object,
    required: true
  }
})

// Fonction pour gérer les images locales dans le dossier assets
const getImageUrl = (reference) => {
  // On nettoie la référence au cas où il y aurait des espaces
  const ref = reference.trim();
  // On retourne le chemin. Note: Vite traite mieux les chemins via URL si c'est dynamique
  return new URL(`../assets/images/VELOS/${ref}/image_1.webp`, import.meta.url).href
}
</script>

<template>
  <div class="card-article">
    <div class="badge" :class="velo.idModeleNavigation?.typeVelo?.toLowerCase()">
      {{ velo.idModeleNavigation?.typeVelo }}
    </div>

    <div class="image-container">
      <img 
        :src="velo.image ? velo.image : getImageUrl(velo.reference)" 
        :alt="velo.nomArticle"
        @error="(e) => e.target.src = 'https://via.placeholder.com/220x220?text=Image+Indisponible'"
      >
    </div>
    
    <div class="card-content">
      <div class="header-info">
        <span class="ref">REF: {{ velo.reference.trim() }}</span>
        <span class="poids">{{ velo.poids }} kg</span>
      </div>

      <h3 class="nom">{{ velo.nomArticle }}</h3>
      
      <p class="specs">
        <strong>Cadre:</strong> {{ velo.idModeleNavigation?.materiauCadre }}<br>
        <strong>Couleur:</strong> {{ velo.idCouleurNavigation?.nomCouleur?.trim() }}
      </p>
      
      <div class="card-footer">
        <span class="prix">{{ velo.prix?.toLocaleString() }} €</span>
        <button class="btn-buy">Découvrir</button>
      </div>
    </div>
  </div>
</template>


<style scoped>
/* --- Structure globale de la carte --- */
.card-article {
  background: #fff;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  position: relative;
  display: flex;
  flex-direction: column;
  /* Optionnel : Tu peux aussi limiter la largeur maximale de la CARTE entière ici */
  /* max-width: 300px; */ 
}

/* --- Conteneur de l'image (Crucial pour la taille) --- */
.image-container {
  width: 100%;
  /* Fixe une hauteur maximale pour que toutes tes cartes aient la même hauteur d'image */
  height: 220px; 
  background: #f9f9f9;
  display: flex;
  align-items: center; /* Centre l'image verticalement si elle est plus petite */
  justify-content: center; /* Centre l'image horizontalement */
  padding: 15px; /* Un peu d'espace autour */
  overflow: hidden; /* Empêche tout débordement */
}

/* --- L'IMAGE ELLE-MÊME (LES MAX-SIZE SONT ICI) --- */
.image-container img {
  /* Ces deux lignes garantissent que l'image ne dépassera JAMAIS son conteneur */
  max-width: 100%;  /* Largeur max = largeur de .image-container */
  max-height: 100%; /* Hauteur max = hauteur de .image-container (220px ici) */

  /* Conserve les proportions de l'image sans la déformer */
  object-fit: contain; 
  
  /* Pour s'assurer que l'image ne s'agrandit pas si elle est plus petite que 100% */
  width: auto;
  height: auto;
}

/* --- Reste des styles (inchangé ou légèrement nettoyé) --- */
.badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  z-index: 1;
}
.badge.electrique { background: #e3f2fd; color: #1976d2; }
.badge.musculaire { background: #f1f8e9; color: #388e3c; }

.card-content { 
  padding: 1.2rem; 
  flex-grow: 1; 
  display: flex; 
  flex-direction: column; 
}

.header-info { 
  display: flex; 
  justify-content: space-between; 
  font-size: 0.7rem; 
  color: #999; 
  margin-bottom: 5px; 
}

.nom { 
  font-size: 1.1rem; 
  color: #222; 
  margin: 0 0 10px 0; 
  line-height: 1.3; 
  min-height: 2.6rem; /* Force 2 lignes de hauteur max pour l'alignement */
}

.specs { 
  font-size: 0.85rem; 
  color: #666; 
  margin-bottom: 15px; 
  flex-grow: 1; 
}

.card-footer { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-top: 1px solid #eee; 
  padding-top: 15px; /* Correction 'pt' -> 'padding-top' */
}

.prix { 
  font-size: 1.4rem; 
  font-weight: 800; 
  color: #2c3e50; 
}

.btn-buy { 
  background: #2c3e50; 
  color: white; 
  border: none; 
  padding: 10px 18px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 600; 
  transition: background 0.2s;
}
.btn-buy:hover { background: #455a64; }
</style>