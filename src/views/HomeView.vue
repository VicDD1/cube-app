<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Store, Truck, ShieldCheck, Headset, ArrowRight, LifeBuoy, MessageSquare } from 'lucide-vue-next'

// --- IMPORT DES ASSETS LOCAUX ---
import bg1 from '@/assets/images/1.webp'
import bg2 from '@/assets/images/2.webp'
import bg3 from '@/assets/images/3.webp'
import vtt from '@/assets/images/velo_vtt.webp'
import route from '@/assets/images/velo_route.webp'
import electrique from '@/assets/images/velo_electrique.webp'

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
    desc: "À l'occasion des Championnats du Monde de VTT disputés dans le Valais (Suisse), les pilotes ont réalisé un véritable exploit...",
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

// --- LOGIQUE SLIDER ---
let timer = null
const next = () => { currentIndex.value = (currentIndex.value + 1) % slides.length }
const prev = () => { currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length }

onMounted(() => { timer = setInterval(next, 5000) })
onUnmounted(() => { clearInterval(timer) })

// --- CATEGORIES ---
const categories = [
  { id: 1, titre: 'VTT & ENDURO', img: vtt, link: '/velos?filter=vtt' },
  { id: 2, titre: 'ROUTE & GRAVEL', img: route, link: '/velos?filter=route' },
  { id: 3, titre: 'E-BIKE HYBRID', img: electrique, link: '/velos-electriques' }
]
</script>

<template>
  <div class="main-container">
    
 

    <div class="hero-slider">
      <div class="top-gradient"></div>
      <transition-group name="fade" tag="div" class="slides-wrapper">
        <div 
          v-for="(slide, index) in slides" 
          :key="index"
          v-show="currentIndex === index"
          class="slide"
        >
          <img 
            :src="slide.image" 
            :alt="slide.titleSolid"
            class="slide-bg-img"
            :fetchpriority="index === 0 ? 'high' : 'auto'"
            :loading="index === 0 ? 'eager' : 'lazy'"
          />

          <div class="content">
            <div class="controls">
              <button @click="prev" class="arrow-btn" aria-label="Précédent">❮</button>
              <button @click="next" class="arrow-btn" aria-label="Suivant">❯</button>
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

    <section class="category-section">
      <h2 class="section-title">EXPLOREZ NOS GAMMES</h2>
      <div class="category-grid">
        <router-link 
          v-for="cat in categories" 
          :key="cat.id" 
          :to="cat.link" 
          class="category-card"
        >
          <img :src="cat.img" :alt="cat.titre" class="card-bg-img" loading="lazy" />
          <div class="card-content">
            <h3>{{ cat.titre }}</h3>
            <span class="btn-link">Découvrir <ArrowRight :size="18" /></span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="trust-bar">
      <h2 class="trust-title">ACHETEZ L’ESPRIT TRANQUILLE</h2>
      <div class="trust-items">
        <div class="trust-item">
          <Store :size="30" color="#11a3dd" />
          <div class="trust-text">
            <p class="highlight">LIVRABLE EN MAGASIN</p>
            <p class="sub">Gratuit dès 50 € d'achats</p>
          </div>
        </div>
        <div class="trust-item">
          <Truck :size="30" color="#11a3dd" />
          <div class="trust-text">
            <p class="bold">LIVRAISON À DOMICILE</p>
            <p class="sub">Gratuit dès 100 € d'achats</p>
          </div>
        </div>
        <div class="trust-item">
          <ShieldCheck :size="30" color="#11a3dd" />
          <div class="trust-text">
            <p class="bold">PAIEMENT SÉCURISÉ</p>
            <p class="sub">Transactions cryptées</p>
          </div>
        </div>
        <div class="trust-item">
          <Headset :size="30" color="#11a3dd" />
          <div class="trust-text">
            <p class="bold">SERVICE CLIENT</p>
            <p class="sub">Lun-Ven : 9h-18h</p>
          </div>
        </div>
      </div>
    </section>

    <section class="support-section">
      <div class="support-container">
        <div class="support-box">
          <div class="icon-wrapper">
            <LifeBuoy :size="35" color="#fff" />
          </div>
          <h3>BESOIN D'AIDE ?</h3>
          <p>Consultez notre FAQ pour trouver les réponses à vos questions sur les tailles et livraisons.</p>
          <a href="/aide" class="support-link">Accéder à l'aide</a>
        </div>
        
        <div class="support-box">
          <div class="icon-wrapper">
            <MessageSquare :size="35" color="#fff" />
          </div>
          <h3>NOUS CONTACTER</h3>
          <p>Notre équipe d'experts est à votre disposition pour vous conseiller dans votre choix.</p>
          <a href="/contact" class="support-link">Formulaire de contact</a>
        </div>
      </div>
    </section>
  </div>
</template><style scoped>
/* --- CONFIGURATION GLOBALE --- */
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Inter:wght@400;700;800&display=swap');

.main-container {
  background-color: #f8fafc;
  font-family: 'Helvetica Neue', Arial, sans-serif; /* Retour à ta police d'origine */
  overflow-x: hidden;
}

/* --- HERO SLIDER --- */
.hero-slider {
  position: relative; 
  width: 100%; 
  height: 100vh; 
  overflow: hidden;
  background-color: #0f172a;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.top-gradient {
  position: absolute; top: 0; left: 0; width: 100%; height: 200px;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, transparent 100%);
  z-index: 10; pointer-events: none;
}

.slide { position: absolute; inset: 0; display: flex; align-items: center; }

.slide-bg-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; z-index: 1; filter: brightness(0.7);
}

.content { 
  position: relative; 
  z-index: 20; 
  margin-left: 10%; 
  max-width: 800px; 
  color: white; 
}

/* --- LE TITRE (REPRIS EXACTEMENT DE TON ANCIEN CODE) --- */
.main-title { 
  font-family: 'Montserrat', sans-serif;
  font-size: 80px; 
  line-height: 1.1; /* Augmenté pour éviter que le haut/bas ne se touchent */
  margin: 0 0 20px 0;
  font-weight: 900; 
  text-transform: uppercase;
}


.tag { 
  font-weight: 800; 
  font-size: 14px; 
  letter-spacing: 1.5px; 
  margin-bottom: 15px; 
  color: #11a3dd;
}

.desc { 
  font-size: 18px; 
  line-height: 1.6; 
  margin-bottom: 35px; 
  max-width: 600px; 
  opacity: 0.9;
}

/* --- BOUTONS (STYLE ANCIEN AVEC BLUR) --- */
.controls { display: flex; gap: 15px; margin-bottom: 25px; }

.arrow-btn {
  background: rgba(255, 255, 255, 0.1); 
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%; color: white; width: 45px; height: 45px; 
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}
.arrow-btn:hover { background-color: #11a3dd; border-color: #11a3dd; transform: scale(1.05); }

.action-link {
  color: white; text-decoration: none; font-weight: bold; font-size: 16px;
  display: inline-flex; align-items: center;
  padding: 12px 24px; background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}
.action-link:hover { background: #11a3dd; }

.triangle { color: #11a3dd; font-size: 12px; margin-right: 10px; }

/* --- SECTIONS SUIVANTES (COPIÉ DE TON ANCIEN CODE) --- */
.category-section { padding: 100px 5%; }
.section-title { font-size: 36px; font-weight: 900; margin-bottom: 50px; text-align: center; color: #0f172a; text-transform: uppercase; }

.category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; max-width: 1400px; margin: 0 auto; }

.category-card {
  position: relative; height: 420px; border-radius: 24px; overflow: hidden;
  display: flex; align-items: flex-end; text-decoration: none; color: white;
  box-shadow: 0 15px 35px rgba(17, 163, 221, 0.1);
  transition: transform 0.4s ease;
}
.category-card::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 70%); z-index: 2;
}
.category-card:hover { transform: translateY(-10px); }

.card-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; transition: transform 0.6s ease; }
.category-card:hover .card-bg-img { transform: scale(1.08); }

.card-content { position: relative; z-index: 3; padding: 35px; width: 100%; }
.card-content h3 { font-size: 26px; font-weight: 800; margin: 0 0 12px 0; }

.btn-link {
  display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: bold;
  color: #11a3dd; background: rgba(255, 255, 255, 0.1); padding: 8px 16px; border-radius: 20px;
  backdrop-filter: blur(4px); text-transform: uppercase;
}

.trust-bar { 
  background: white; padding: 60px 40px; border-radius: 30px; margin: 0 5% 80px; 
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); text-align: center; 
}
.trust-items { display: flex; justify-content: center; gap: 50px; flex-wrap: wrap; }
.trust-item { display: flex; align-items: center; gap: 20px; text-align: left; }
.trust-text p { margin: 0; font-size: 16px; font-weight: 700; }
.trust-text .highlight { color: #11a3dd; }

.support-section { 
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 80px 20px; 
  border-radius: 40px 40px 0 0; color: #fff; 
}
.support-container { display: flex; max-width: 1000px; margin: 0 auto; gap: 40px; }
.support-box { 
  flex: 1; text-align: center; padding: 50px 30px; background: rgba(255, 255, 255, 0.03); 
  border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.05); 
}
.icon-wrapper { 
  display: inline-flex; width: 70px; height: 70px; border-radius: 50%; 
  background-color: #11a3dd; margin-bottom: 25px; align-items: center; justify-content: center; 
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .support-container { flex-direction: column; }
  .main-title { font-size: 50px; }
}
</style>