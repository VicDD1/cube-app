<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Store, Truck, ShieldCheck, Headset, ArrowRight, LifeBuoy, MessageSquare,
  Mountain, Map, Building, Zap, Activity, Wind, Loader2, RotateCcw
} from 'lucide-vue-next'


import bg1 from '@/assets/images/1.webp'
import bg2 from '@/assets/images/2.webp'
import bg3 from '@/assets/images/3.webp'
import vtt from '@/assets/images/velo_vtt.webp'
import route from '@/assets/images/velo_route.webp'
import electrique from '@/assets/images/velo_electrique.webp'




const currentIndex = ref(0)
let timer = null

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

const next = () => { currentIndex.value = (currentIndex.value + 1) % slides.length }
const prev = () => { currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length }
const goToSlide = (index) => { currentIndex.value = index }

onMounted(() => { timer = setInterval(next, 6000) })
onUnmounted(() => { clearInterval(timer) })




const categories = [
  { id: 1, titre: 'VTT & ENDURO', img: vtt, link: '/velos?filter=vtt' },
  { id: 2, titre: 'ROUTE & GRAVEL', img: route, link: '/velos?filter=route' },
  { id: 3, titre: 'E-BIKE HYBRID', img: electrique, link: '/velos-electriques' }
]




const step = ref(0)
const isCalculating = ref(false)
const answers = ref({ terrain: null, objectif: null, elec: null })

const questions = [
  {
    id: 'terrain',
    title: "Où allez-vous principalement rouler ?",
    options: [
      { id: 'vtt', label: 'Montagne & Sentiers', icon: Mountain },
      { id: 'route', label: 'Asphalte & Cols', icon: Map },
      { id: 'ville', label: 'Ville & Vélotaf', icon: Building }
    ]
  },
  {
    id: 'objectif',
    title: "Quel est votre objectif n°1 ?",
    options: [
      { id: 'perf', label: 'Performance & Vitesse', icon: Activity },
      { id: 'confort', label: 'Balade & Plaisir', icon: Wind }
    ]
  },
  {
    id: 'elec',
    title: "Un petit coup de pouce électrique ?",
    options: [
      { id: 'oui', label: 'Oui, je veux voler !', icon: Zap },
      { id: 'non', label: 'Non, à la force des mollets', icon: Activity }
    ]
  }
]

const selectOption = (questionId, optionId) => {
  answers.value[questionId] = optionId
  if (step.value < questions.length) step.value++
  if (step.value === questions.length) calculateResult()
}

const calculateResult = () => {
  isCalculating.value = true
  setTimeout(() => {
    isCalculating.value = false
    step.value++ 
  }, 1500) 
}

const result = computed(() => {
  const { terrain, elec } = answers.value
  
  if (terrain === 'vtt' && elec === 'oui') return { title: 'E-BIKE ENDURO', desc: 'Des montées sans effort pour un max de descentes.', img: electrique, link: '/velos-electriques' }
  if (terrain === 'vtt' && elec === 'non') return { title: 'VTT CROSS-COUNTRY', desc: 'Léger, nerveux, parfait pour dompter les sentiers.', img: vtt, link: '/velos' }
  if (terrain === 'route' && elec === 'non') return { title: 'VÉLO DE ROUTE AÉRO', desc: 'Taillé pour pulvériser vos records sur l\'asphalte.', img: route, link: '/velos' }
  if (terrain === 'ville' && elec === 'oui') return { title: 'VÉLO ÉLECTRIQUE URBAIN', desc: 'Dites adieu aux bouchons et à la transpiration.', img: electrique, link: '/velos-electriques' }
  
  return { title: 'VÉLO GRAVEL', desc: 'Le compromis parfait pour l\'aventure tout-terrain.', img: route, link: '/velos' }
})

const resetQuiz = () => {
  step.value = 0
  answers.value = { terrain: null, objectif: null, elec: null }
}
</script>

<template>
  <div class="main-container">
    
    <div class="hero-slider">
      <div class="overlay-gradient"></div>
      
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
              <button @click="prev" class="arrow-btn" aria-label="Slide précédent">❮</button>
              <button @click="next" class="arrow-btn" aria-label="Slide suivant">❯</button>
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

      <div class="slider-dots">
        <button 
          v-for="(slide, index) in slides" 
          :key="'dot-'+index"
          @click="goToSlide(index)"
          class="dot"
          :class="{ active: currentIndex === index }"
          :aria-label="'Aller au slide ' + (index + 1)"
        ></button>
      </div>
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
      <h2 class="trust-title sr-only">Nos engagements</h2>
      <div class="trust-items">
        <div class="trust-item">
          <Store :size="36" color="#11a3dd" class="trust-icon" />
          <div class="trust-text">
            <p class="highlight">LIVRABLE EN MAGASIN</p>
            <p class="sub">Gratuit dès 50 € d'achats</p>
          </div>
        </div>
        <div class="trust-item">
          <Truck :size="36" color="#11a3dd" class="trust-icon" />
          <div class="trust-text">
            <p class="bold">LIVRAISON À DOMICILE</p>
            <p class="sub">Gratuit dès 100 € d'achats</p>
          </div>
        </div>
        <div class="trust-item">
          <ShieldCheck :size="36" color="#11a3dd" class="trust-icon" />
          <div class="trust-text">
            <p class="bold">PAIEMENT SÉCURISÉ</p>
            <p class="sub">Transactions cryptées 3D Secure</p>
          </div>
        </div>
        <div class="trust-item">
          <Headset :size="36" color="#11a3dd" class="trust-icon" />
          <div class="trust-text">
            <p class="bold">SERVICE CLIENT</p>
            <p class="sub">Lun-Ven : 9h-18h</p>
          </div>
        </div>
      </div>
    </section>

    <section class="matchmaker-section">
      <div class="matchmaker-container">
        
        <transition name="fade-quiz" mode="out-in">
          <div v-if="step === 0" class="quiz-step text-center">
            <span class="badge">NOUVEAU</span>
            <h2 class="quiz-title">TROUVEZ VOTRE MONTURE IDÉALE</h2>
            <p class="quiz-desc">Répondez à 3 questions rapides et laissez notre algorithme trouver le vélo parfait pour votre style de ride.</p>
            <button @click="step = 1" class="btn-start">Faire le test <ArrowRight :size="18" /></button>
          </div>

          <div v-else-if="step > 0 && step <= questions.length" class="quiz-step" :key="'q-'+step">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${(step / questions.length) * 100}%` }"></div>
            </div>
            <p class="step-counter">Question {{ step }} sur {{ questions.length }}</p>
            <h2 class="quiz-title">{{ questions[step - 1].title }}</h2>
            
            <div class="options-grid">
              <button 
                v-for="opt in questions[step - 1].options" 
                :key="opt.id"
                class="option-card"
                @click="selectOption(questions[step - 1].id, opt.id)"
              >
                <component :is="opt.icon" :size="40" class="opt-icon" />
                <span>{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <div v-else-if="isCalculating" class="quiz-step text-center calculating">
            <Loader2 :size="50" class="spinner" />
            <h2 class="quiz-title">Analyse de votre profil...</h2>
            <p class="quiz-desc">Recherche du match parfait dans notre catalogue</p>
          </div>

          <div v-else class="quiz-step result-step">
            <div class="result-content">
              <span class="badge success">C'EST UN MATCH !</span>
              <h2 class="quiz-title">{{ result.title }}</h2>
              <p class="quiz-desc">{{ result.desc }}</p>
              <div class="result-actions">
                <router-link :to="result.link" class="btn-start">Voir les modèles</router-link>
                <button @click="resetQuiz" class="btn-reset-quiz"><RotateCcw :size="16" /> Recommencer</button>
              </div>
            </div>
            <div class="result-image" :style="{ backgroundImage: `url(${result.img})` }"></div>
          </div>
        </transition>
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
          <a href="/aide" class="support-btn">Accéder à l'aide</a>
        </div>
        
        <div class="support-box">
          <div class="icon-wrapper">
            <MessageSquare :size="35" color="#fff" />
          </div>
          <h3>NOUS CONTACTER</h3>
          <p>Notre équipe d'experts est à votre disposition pour vous conseiller dans votre choix.</p>
          <a href="/contact" class="support-btn">Formulaire de contact</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Inter:wght@400;600;700;800;900&display=swap');

.main-container {
  background-color: #f8fafc;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
}

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;
}

/* ==========================================
   1. HERO SLIDER
   ========================================== */
.hero-slider {
  position: relative; 
  width: 100%; 
  height: 100vh;
  min-height: 600px;
  overflow: hidden;
  background-color: #0f172a;
}

.overlay-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 50%, transparent 100%);
  z-index: 10; pointer-events: none;
}

.slide { position: absolute; inset: 0; display: flex; align-items: center; }

.slide-bg-img {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; z-index: 1;
}

.content { 
  position: relative; 
  z-index: 20; 
  margin-left: 8%; 
  max-width: 700px; 
  color: white; 
  padding-right: 20px;
}

.controls { display: flex; gap: 12px; margin-bottom: 30px; }

.arrow-btn {
  background: rgba(255, 255, 255, 0.15); 
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%; color: white; width: 45px; height: 45px; 
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 16px; transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}
.arrow-btn:hover, .arrow-btn:focus-visible { 
  background-color: #11a3dd; 
  border-color: #11a3dd; 
  transform: scale(1.1); 
  outline: none;
}

.tag { 
  font-weight: 800; 
  font-size: 13px; 
  letter-spacing: 2px; 
  margin-bottom: 15px; 
  color: #11a3dd;
  text-transform: uppercase;
}

.main-title {
  font-size: 80px; line-height: 0.9; margin: 0 0 20px 0;
  font-weight: 900; text-transform: uppercase;
}
 
.solid { color: white; }
.outline { color: transparent; -webkit-text-stroke: 2px white; }


 
.desc { 
  font-size: 17px; 
  line-height: 1.6; 
  margin-bottom: 35px; 
  max-width: 550px; 
  color: #e2e8f0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.action-link {
  color: #0f172a; background: white; text-decoration: none; 
  font-weight: 700; font-size: 15px; text-transform: uppercase;
  display: inline-flex; align-items: center;
  padding: 14px 28px; border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
.action-link:hover, .action-link:focus-visible { 
  background: #11a3dd; color: white; 
  transform: translateY(-2px);
  outline: none;
}
.action-link:hover .triangle { color: white; }

.triangle { color: #11a3dd; font-size: 10px; margin-right: 12px; transition: color 0.3s ease; }

.slider-dots {
  position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 12px; z-index: 20;
}
.dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.4); border: none;
  cursor: pointer; transition: all 0.3s ease; padding: 0;
}
.dot:hover { background: rgba(255, 255, 255, 0.8); }
.dot.active { background: #11a3dd; width: 24px; border-radius: 10px; }


/* ==========================================
   2. CATEGORIES ET TRUST BAR
   ========================================== */
.category-section { padding: 80px 5%; max-width: 1500px; margin: 0 auto; }
.section-title { font-size: 32px; font-weight: 900; margin-bottom: 50px; text-align: center; color: #0f172a; text-transform: uppercase; }

.category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; }

.category-card {
  position: relative; height: 450px; border-radius: 20px; overflow: hidden;
  display: flex; align-items: flex-end; text-decoration: none; color: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.category-card::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%); z-index: 2;
}
.category-card:hover, .category-card:focus-visible { 
  transform: translateY(-8px); 
  box-shadow: 0 20px 40px rgba(17, 163, 221, 0.15); 
  outline: none;
}

.card-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; transition: transform 0.6s ease; }
.category-card:hover .card-bg-img { transform: scale(1.05); }

.card-content { position: relative; z-index: 3; padding: 40px 30px; width: 100%; }
.card-content h3 { font-size: 24px; font-weight: 800; margin: 0 0 15px 0; letter-spacing: 0.5px; }

.btn-link {
  display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700;
  color: white; background: rgba(17, 163, 221, 0.8); padding: 10px 20px; border-radius: 30px;
  backdrop-filter: blur(4px); text-transform: uppercase; letter-spacing: 0.5px;
  transition: background 0.3s ease;
}
.category-card:hover .btn-link { background: #11a3dd; }

.trust-bar { 
  background: white; padding: 50px 40px; border-radius: 24px; margin: 0 5% 60px; 
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04); 
}
.trust-items { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
  gap: 30px; 
  max-width: 1400px; 
  margin: 0 auto;
}
.trust-item { display: flex; align-items: center; gap: 20px; padding: 10px; }
.trust-icon { flex-shrink: 0; }
.trust-text p { margin: 0; font-size: 15px; }
.trust-text .highlight, .trust-text .bold { font-weight: 800; color: #0f172a; margin-bottom: 4px; }
.trust-text .sub { color: #64748b; font-size: 14px; }


/* ==========================================
   3. BIKE MATCHMAKER (QUIZ)
   ========================================== */
.matchmaker-section {
  padding: 40px 20px 80px;
  display: flex;
  justify-content: center;
}

.matchmaker-container {
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 30px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
  min-height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(17, 163, 221, 0.1);
}

.quiz-step { padding: 50px; width: 100%; animation: fadeIn 0.4s ease-out; }
.text-center { text-align: center; }

.quiz-title {
  font-size: 2rem; font-weight: 900; text-transform: uppercase;
  color: #0f172a; margin-bottom: 15px;
}
.quiz-desc { color: #64748b; font-size: 1.1rem; margin-bottom: 30px; line-height: 1.5; }

.badge {
  display: inline-block; background: rgba(17, 163, 221, 0.1); color: #11a3dd;
  padding: 5px 15px; border-radius: 20px; font-weight: 800; font-size: 0.8rem;
  letter-spacing: 1px; margin-bottom: 15px;
}
.badge.success { background: #10b981; color: white; }

.btn-start {
  background: #11a3dd; color: white; border: none; padding: 15px 35px;
  border-radius: 50px; font-size: 1.1rem; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 10px; transition: all 0.3s ease;
  text-decoration: none;
}
.btn-start:hover { background: #0f172a; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2); }

.options-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px; margin-top: 30px;
}
.option-card {
  background: white; border: 2px solid #e2e8f0; border-radius: 20px;
  padding: 30px 20px; display: flex; flex-direction: column; align-items: center;
  gap: 15px; cursor: pointer; transition: all 0.2s ease;
  color: #0f172a; font-weight: 700; font-size: 1rem;
}
.opt-icon { color: #11a3dd; transition: transform 0.3s ease; }
.option-card:hover {
  border-color: #11a3dd; background: rgba(17, 163, 221, 0.03);
  transform: translateY(-5px); box-shadow: 0 10px 25px rgba(17, 163, 221, 0.1);
}
.option-card:hover .opt-icon { transform: scale(1.1); }

.progress-bar { width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; margin-bottom: 15px; overflow: hidden; }
.progress-fill { height: 100%; background: #11a3dd; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.step-counter { font-size: 0.9rem; font-weight: 700; color: #11a3dd; margin-bottom: 10px; text-transform: uppercase; }

.calculating { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 350px; }
.spinner { color: #11a3dd; animation: spin 1s linear infinite; margin-bottom: 20px; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.result-step { display: grid; grid-template-columns: 1fr 1fr; padding: 0; height: 100%; }
.result-content { padding: 50px; display: flex; flex-direction: column; justify-content: center; }
.result-image { background-size: cover; background-position: center; border-radius: 0 30px 30px 0; }
.result-actions { display: flex; align-items: center; gap: 20px; margin-top: 20px; }
.btn-reset-quiz {
  background: transparent; border: none; color: #64748b; font-weight: 700; font-size: 1rem;
  display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: color 0.2s;
}
.btn-reset-quiz:hover { color: #0f172a; }

.fade-quiz-enter-active, .fade-quiz-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-quiz-enter-from { opacity: 0; transform: translateY(10px); }
.fade-quiz-leave-to { opacity: 0; transform: translateY(-10px); }


/* ==========================================
   4. SECTION SUPPORT
   ========================================== */
.support-section { 
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 80px 20px; 
  border-radius: 40px 40px 0 0; color: #f8fafc; 
}
.support-container { display: flex; max-width: 1100px; margin: 0 auto; gap: 40px; }
.support-box { 
  flex: 1; text-align: center; padding: 50px 40px; background: rgba(255, 255, 255, 0.02); 
  border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.06); 
  display: flex; flex-direction: column; align-items: center;
  transition: transform 0.3s ease, background 0.3s ease;
}
.support-box:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.04); }

.icon-wrapper { 
  display: inline-flex; width: 64px; height: 64px; border-radius: 50%; 
  background-color: #11a3dd; margin-bottom: 25px; align-items: center; justify-content: center; 
  box-shadow: 0 4px 15px rgba(17, 163, 221, 0.3);
}
.support-box h3 { font-size: 20px; font-weight: 800; margin: 0 0 15px 0; }
.support-box p { color: #cbd5e1; line-height: 1.6; margin-bottom: 30px; font-size: 15px; flex-grow: 1; }

.support-btn {
  background: transparent; border: 2px solid #11a3dd; color: #11a3dd;
  padding: 12px 28px; border-radius: 30px; font-weight: 700; text-decoration: none;
  font-size: 14px; text-transform: uppercase; transition: all 0.3s ease;
}
.support-btn:hover, .support-btn:focus-visible { 
  background: #11a3dd; color: white; outline: none; box-shadow: 0 4px 15px rgba(17, 163, 221, 0.3);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.8s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }


/* ==========================================
   5. RESPONSIVE
   ========================================== */
@media (max-width: 992px) {
  .support-container { flex-direction: column; }
  .content { margin-left: 5%; }
}

@media (max-width: 768px) {
  .hero-slider { min-height: 500px; }
  .content { margin-left: 20px; text-align: center; padding-right: 20px; }
  .controls { justify-content: center; }
  .main-title { font-size: 40px; }
  .slider-dots { bottom: 20px; }
  
  .category-section { padding: 60px 20px; }
  .category-card { height: 350px; }
  
  .trust-bar { padding: 40px 20px; margin: 0 20px 60px; }
  .trust-item { flex-direction: column; text-align: center; gap: 10px; }

  .result-step { grid-template-columns: 1fr; }
  .result-image { height: 250px; border-radius: 0 0 30px 30px; }
  .result-content { padding: 30px; text-align: center; }
  .result-actions { flex-direction: column; }
  .quiz-step { padding: 30px 20px; }
}
</style>