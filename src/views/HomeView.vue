<script setup>
import { ref } from 'vue'

import bg1 from '@/assets/images/1.webp'
import bg2 from '@/assets/images/2.webp'
import bg3 from '@/assets/images/3.webp'
import { Store, Truck, ShieldCheck, Headset } from 'lucide-vue-next'

const currentIndex = ref(0)

const slides = [
  {
    image: bg1,
    tag: 'NOUVELLE VIDÉO',
    titleSolid: 'LES ÉCHECS',
    titleOutline: "N'EXISTENT PAS",
    desc: 'La Haute Route Chamonix-Zermatt à VTT Enduro',
    linkText: 'Voir la vidéo'
  },
  {
    image: bg2,
    tag: 'PALMARÈS EXCEPTIONNEL',
    titleSolid: 'TROIS TITRES DE',
    titleOutline: 'CHAMPION DU MONDE !',
    desc: "À l'occasion des Championnats du Monde de VTT disputés dans le Valais (Suisse), les pilotes du CUBE Factory Racing ont réalisé un véritable exploit...",
    linkText: "Lire l'article"
  },
  {
    image: bg3,
    tag: 'NOUVEAUTÉ',
    titleSolid: 'NOUVELLE',
    titleOutline: 'COLLECTION',
    desc: "Découvrez notre nouvelle gamme de vélos pour repousser vos limites.",
    linkText: "Voir la gamme"
  }
]

// Fonctions pour changer de slide
const next = () => {
  currentIndex.value = (currentIndex.value + 1) % slides.length
}

const prev = () => {
  currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length
}
</script>

<template>
  <div>
    <div class="hero-slider">
      
      <div class="top-gradient"></div>

      <transition-group name="fade" tag="div" class="slides-wrapper">
        <div 
          v-for="(slide, index) in slides" 
          :key="index"
          v-show="currentIndex === index"
          class="slide"
          :style="{ backgroundImage: `url(${slide.image})` }"
        >
          <div class="content">
            
            <div class="controls">
              <button @click="prev" class="arrow-btn">❮</button>
              <button @click="next" class="arrow-btn">❯</button>
            </div>

            <p class="tag">{{ slide.tag }}</p>
            
            <h1 class="main-title">
              <span class="solid">{{ slide.titleSolid }}</span><br>
              <span class="outline">{{ slide.titleOutline }}</span>
            </h1>
            
            <p class="desc">{{ slide.desc }}</p>
            
            <a href="#" class="action-link">
              <span class="triangle">▶</span> {{ slide.linkText }}
            </a>
            
          </div>
        </div>
      </transition-group>

    </div>

    <section class="trust-bar">
      <h2 class="trust-title">ACHETEZ L’ESPRIT TRANQUILLE</h2>
      
      <div class="trust-items">
        <div class="trust-item">
          <Store :size="30" />
          <div class="trust-text">
            <p class="highlight">LIVRABLE EN MAGASIN</p>
            <p class="sub">Gratuit dès 50 € d'achats</p>
          </div>
        </div>

        <div class="trust-item">
          <Truck :size="30" />
          <div class="trust-text">
            <p class="bold">LIVRAISON À DOMICILE</p>
            <p class="sub">Gratuit dès 100 € d'achats</p>
          </div>
        </div>

        <div class="trust-item">
          <ShieldCheck :size="30" />
          <div class="trust-text">
            <p class="bold">PAIEMENT SÉCURISÉ</p>
          </div>
        </div>

        <div class="trust-item">
          <Headset :size="30" />
          <div class="trust-text">
            <p class="bold">SERVICE CLIENT EN LIGNE</p>
            <p class="sub">du lundi au vendredi 9h-18h</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Conteneur principal qui prend tout l'écran */
.hero-slider {
  position: relative;
  width: 100%;
  height: 100vh; /* Prend 100% de la hauteur de la fenêtre */
  overflow: hidden;
  background-color: #000;
}

/* Le fameux dégradé sous le header */
.top-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
  z-index: 10; /* Au-dessus des images, en dessous du header */
  pointer-events: none;
}

/* Les slides */
.slides-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center; /* Centre le contenu verticalement */
}

/* Contenu texte aligné à gauche */
.content {
  position: relative;
  z-index: 20;
  margin-left: 10%; /* Équivalent au padding gauche du header */
  max-width: 800px;
  color: white;
  font-family: Arial, sans-serif;
}

/* Boutons de navigation */
.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.arrow-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  color: white;
  width: 35px;
  height: 35px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s;
}

.arrow-btn:hover {
  border-color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

/* Textes */
.tag {
  font-weight: bold;
  font-size: 14px;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.main-title {
  font-size: 80px;
  line-height: 0.9;
  margin: 0 0 20px 0;
  font-style: italic;
  font-weight: 900;
  text-transform: uppercase;
}

.solid {
  color: white;
}

/* Astuce CSS pour le texte transparent avec contour */
.outline {
  color: transparent;
  -webkit-text-stroke: 2px white;
}

.desc {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 30px;
  max-width: 600px;
}

.action-link {
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.triangle {
  color: #e3000f; 
  font-size: 10px;
  margin-right: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.trust-bar {
  background-color: #f5f5f5;
  padding: 60px 20px;
  text-align: center;
  font-family: Arial, sans-serif;
}

.trust-title {
  font-size: 40px;
  font-weight: 900;
  font-style: italic;
  margin-bottom: 40px;
  text-transform: uppercase;
}

.trust-items {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 15px;
  text-align: left;
}

.trust-text p {
  margin: 0;
  font-size: 18px;
  text-transform: uppercase;
}

.trust-text .bold {
  font-weight: 800;
}

.trust-text .highlight {
  font-weight: 800;
  color: black;
  padding: 2px 4px;
  display: inline-block;
}

.trust-text .sub {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
  text-transform: none;
}
</style>