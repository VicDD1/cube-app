<script setup>
import { ref } from 'vue'

import bg1 from '@/assets/images/1.webp'
import bg2 from '@/assets/images/2.webp'
import bg3 from '@/assets/images/3.webp'
import { Store, Truck, ShieldCheck, Headset, ArrowRight, LifeBuoy, MessageSquare } from 'lucide-vue-next'

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

const next = () => {
  currentIndex.value = (currentIndex.value + 1) % slides.length
}

const prev = () => {
  currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length
}
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

    <section class="category-section">
      <h2 class="section-title">EXPLOREZ NOS GAMMES</h2>
      <div class="category-grid">
        
        <a href="/velo" class="category-card">
          <div class="card-bg" style="background-image: url('https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=800');"></div>
          <div class="card-content">
            <h3>VÉLOS MUSCULAIRES</h3>
            <span class="btn-link">Découvrir <ArrowRight :size="18" /></span>
          </div>
        </a>

        <a href="/velos-electriques" class="category-card">
          <div class="card-bg" style="background-image: url('https://images.unsplash.com/photo-1571188654248-7a89213915f7?auto=format&fit=crop&q=80&w=800');"></div>
          <div class="card-content">
            <h3>VÉLOS ÉLECTRIQUES</h3>
            <span class="btn-link">Découvrir <ArrowRight :size="18" /></span>
          </div>
        </a>

        <a href="/accessoires" class="category-card">
          <div class="card-bg" style="background-image: url('https://www.bike.tn/wp-content/uploads/2025/03/Liste-accessoires-indispensables-velo.jpg');"></div>
          <div class="card-content">
            <h3>ACCESSOIRES</h3>
            <span class="btn-link">Découvrir <ArrowRight :size="18" /></span>
          </div>
        </a>

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
          </div>
        </div>
        <div class="trust-item">
          <Headset :size="30" color="#11a3dd" />
          <div class="trust-text">
            <p class="bold">SERVICE CLIENT EN LIGNE</p>
            <p class="sub">du lundi au vendredi 9h-18h</p>
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
          <p>Consultez notre FAQ pour trouver les réponses à vos questions sur les tailles, les livraisons et les retours.</p>
          <a href="/aide" class="support-link">Accéder à l'aide</a>
        </div>
        
        <div class="support-box">
          <div class="icon-wrapper">
            <MessageSquare :size="35" color="#fff" />
          </div>
          <h3>NOUS CONTACTER</h3>
          <p>Notre équipe d'experts est à votre disposition pour vous conseiller et vous accompagner dans votre choix.</p>
          <a href="/contact" class="support-link">Formulaire de contact</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Couleurs globales et fond */
.main-container {
  background-color: #f8fafc; /* Bleu très très clair pour le fond global */
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

/* --- HERO SLIDER --- */
.hero-slider {
  position: relative; width: 100%; height: 100vh; overflow: hidden;
  background-color: #0f172a; /* Bleu marine foncé */
  border-bottom-left-radius: 40px; /* Moins carré */
  border-bottom-right-radius: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.top-gradient {
  position: absolute; top: 0; left: 0; width: 100%; height: 200px;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.8) 0%, transparent 100%);
  z-index: 10; pointer-events: none;
}

.slides-wrapper { position: relative; width: 100%; height: 100%; }

.slide {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover; background-position: center;
  display: flex; align-items: center;
}

.content {
  position: relative; z-index: 20; margin-left: 10%;
  max-width: 800px; color: white;
}

.controls { display: flex; gap: 15px; margin-bottom: 25px; }

.arrow-btn {
  background: rgba(255, 255, 255, 0.1); 
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%; color: white; width: 45px; height: 45px; /* Boutons ronds plus gros */
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.arrow-btn:hover { background-color: #11a3dd; border-color: #11a3dd; transform: scale(1.05); }

.tag { 
  font-weight: 800; font-size: 14px; letter-spacing: 1.5px; 
  margin-bottom: 15px; color: #11a3dd; /* Accent bleu */
}

.main-title {
  font-size: 80px; line-height: 0.9; margin: 0 0 20px 0;
  font-weight: 900; text-transform: uppercase;
}

.solid { color: white; }
.outline { color: transparent; -webkit-text-stroke: 2px white; }

.desc { font-size: 18px; line-height: 1.6; margin-bottom: 35px; max-width: 600px; opacity: 0.9; }

.action-link {
  color: white; text-decoration: none; font-weight: bold; font-size: 16px;
  display: inline-flex; align-items: center;
  padding: 12px 24px; background: rgba(255, 255, 255, 0.1);
  border-radius: 30px; /* Bouton arrondi */
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}

.action-link:hover { background: #11a3dd; color: white; }

.triangle { color: #11a3dd; font-size: 12px; margin-right: 10px; transition: color 0.3s; }
.action-link:hover .triangle { color: white; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* --- CATÉGORIES --- */
.category-section { padding: 100px 5%; }

.section-title {
  font-size: 36px; font-weight: 900;
  margin-bottom: 50px; text-transform: uppercase; text-align: center; color: #0f172a;
}

.category-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px; max-width: 1400px; margin: 0 auto;
}

.category-card {
  position: relative; height: 420px; overflow: hidden;
  text-decoration: none; display: flex; align-items: flex-end; color: white;
  border-radius: 24px; /* Cartes arrondies */
  box-shadow: 0 15px 35px rgba(17, 163, 221, 0.1);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.card-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-size: cover; background-position: center;
  transition: transform 0.6s ease; z-index: 1;
}

.category-card::after {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 70%);
  z-index: 2;
}

.category-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(17, 163, 221, 0.2); }
.category-card:hover .card-bg { transform: scale(1.08); }

.card-content { position: relative; z-index: 3; padding: 35px; width: 100%; }
.card-content h3 { font-size: 26px; font-weight: 800; margin: 0 0 12px 0; }
.btn-link {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: bold; text-transform: uppercase;
  color: #11a3dd; background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px; border-radius: 20px;
  backdrop-filter: blur(4px); transition: all 0.3s;
}
.category-card:hover .btn-link { background: #11a3dd; color: white; }

.trust-bar {
  background-color: #ffffff; padding: 60px 40px;
  text-align: center; border-radius: 30px;
  margin: 0 5% 80px 5%; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
}

.trust-title {
  font-size: 28px; font-weight: 800;
  margin-bottom: 50px; color: #0f172a;
}

.trust-items {
  display: flex; justify-content: center; gap: 50px;
  flex-wrap: wrap; max-width: 1200px; margin: 0 auto; color: #334155;
}

.trust-item { display: flex; align-items: center; gap: 20px; text-align: left; }
.trust-text p { margin: 0; font-size: 16px; font-weight: 700; }
.trust-text .highlight { color: #11a3dd; }
.trust-text .sub { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }

.support-section {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff; padding: 80px 20px;
  border-top-left-radius: 40px; border-top-right-radius: 40px;
}

.support-container {
  display: flex; justify-content: center; align-items: stretch;
  max-width: 1000px; margin: 0 auto; gap: 40px;
}

.support-box {
  flex: 1; text-align: center; padding: 50px 30px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease;
}

.support-box:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.05); }

.icon-wrapper {
  display: inline-flex; align-items: center; justify-content: center;
  width: 70px; height: 70px; border-radius: 50%;
  background-color: #11a3dd; margin-bottom: 25px;
  box-shadow: 0 10px 25px rgba(17, 163, 221, 0.3);
}

.support-box h3 { font-size: 22px; font-weight: 800; margin-bottom: 15px; }
.support-box p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 30px; }

.support-link {
  display: inline-block; padding: 14px 35px;
  background-color: transparent; border: 2px solid #11a3dd;
  border-radius: 30px;
  color: white; text-decoration: none; font-weight: 700;
  font-size: 14px; transition: all 0.3s ease;
}

.support-link:hover { background-color: #11a3dd; box-shadow: 0 5px 15px rgba(17, 163, 221, 0.4); }

@media (max-width: 768px) {
  .support-container { flex-direction: column; gap: 20px; }
  .main-title { font-size: 50px; }
  .trust-bar { margin: 0 20px 60px 20px; padding: 40px 20px; }
}
</style>