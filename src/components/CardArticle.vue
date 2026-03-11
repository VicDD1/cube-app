<script setup>
defineProps({
  velo: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="card-article">
    <div class="badge" :class="velo.idModeleNavigation?.typeVelo">
      {{ velo.idModeleNavigation?.typeVelo }}
    </div>

    <div class="image-container">
      <img 
        :src="velo.image || 'https://via.placeholder.com/400x300?text=Cube+Bike'" 
        :alt="velo.nomArticle"
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
        <strong>Couleur:</strong> {{ velo.idCouleurNavigation?.nomCouleur.trim() }}
      </p>
      
      <div class="card-footer">
        <span class="prix">{{ velo.prix.toLocaleString() }} €</span>
        <button class="btn-buy">Découvrir</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-article {
  background: #fff;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  position: relative;
  display: flex;
  flex-direction: column;
}

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

.image-container img {
  width: 100%;
  height: 220px;
  object-fit: contain;
  background: #f9f9f9;
  padding: 10px;
}

.card-content { padding: 1.2rem; flex-grow: 1; display: flex; flex-direction: column; }

.header-info { display: flex; justify-content: space-between; font-size: 0.7rem; color: #999; margin-bottom: 5px; }

.nom { font-size: 1.1rem; color: #222; margin: 0 0 10px 0; line-height: 1.3; min-height: 2.6rem; }

.specs { font-size: 0.85rem; color: #666; margin-bottom: 15px; flex-grow: 1; }

.card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; pt: 15px; }

.prix { font-size: 1.4rem; font-weight: 800; color: #2c3e50; }

.btn-buy { background: #2c3e50; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
</style>