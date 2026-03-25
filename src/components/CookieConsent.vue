<script setup>
import { ref, onMounted } from 'vue'
import { useCookies } from '../composables/useCookies'

const { state, init, save, acceptAll, refuseAll, updateCategory, updateSubCookie } = useCookies()

const currentView = ref('banner')
const expandedCategories = ref(['audience'])

onMounted(() => {
  init()
})

const toggleAccordion = (categoryId) => {
  const index = expandedCategories.value.indexOf(categoryId)
  if (index > -1) expandedCategories.value.splice(index, 1)
  else expandedCategories.value.push(categoryId)
}

const openModal = () => {
  currentView.value = 'modal'
}

const handleContinueWithoutAccepting = () => {
  refuseAll()
}
</script>

<template>
  <Transition name="fade">
    <div v-if="state.isVisible" class="cookie-overlay">
      
      <Transition name="slide-up">
        <div v-if="currentView === 'banner'" class="cookie-banner">
          
          <div class="banner-image"></div>
          
          <div class="banner-content">
            <div class="banner-header">
              <img src="@/assets/images/logo-cube-blanc.png" alt="CUBE" class="logo-img invert-logo" />
              <button class="link-btn-continue" @click="handleContinueWithoutAccepting">
                Continuer sans accepter ➔
              </button>
            </div>

            <div class="banner-text">
              <p class="intro-text">
                Avec votre accord, nous utilisons des cookies ou technologies similaires pour stocker, consulter et traiter des données personnelles telles que votre visite sur ce site internet, les adresses IP et les identifiants de cookie. À tout moment, vous pouvez retirer votre consentement ou vous opposer au traitement des données fondé sur l'intérêt légitime en cliquant sur « En savoir plus » ou en allant dans notre politique de confidentialité sur ce site internet.
              </p>
              
              <h3 class="section-title">Vos données personnelles sont traitées pour les finalités suivantes :</h3>
              <p class="sub-text">
                Comprendre les publics par le biais de statistiques ou de combinaisons de données provenant de différentes sources, Créer des profils de contenus personnalisés, Créer des profils pour la publicité personnalisée, Développer et améliorer les services, Mesurer la performance des contenus, Mesurer la performance des publicités, Nécessaires, Stocker et/ou accéder à des informations sur un appareil, Utiliser des données limitées pour sélectionner la publicité, Utiliser des profils pour sélectionner des contenus personnalisés, Utiliser des profils pour sélectionner des publicités personnalisées.
              </p>
            </div>
            
            <div class="banner-actions">
              <button class="btn-text" @click="openModal">EN SAVOIR PLUS</button>
              <button class="btn-primary" @click="acceptAll">ACCEPTER</button>
            </div>
          </div>

        </div>
      </Transition>

      <Transition name="scale">
        <div v-if="currentView === 'modal'" class="cookie-modal glass-panel">
          <div class="modal-header">
            <h2>Gestion des cookies</h2>
            <button class="close-btn" @click="save">✕</button>
          </div>
          <p class="modal-intro">
            Vous pouvez choisir d'activer ou non la mesure d'audience. Les cookies nécessaires au fonctionnement technique ne peuvent pas être désactivés.
          </p>
          
          <h3 class="prefs-title">VOS PRÉFÉRENCES</h3>

          <div class="accordion-list">
            <div 
              v-for="(cat, key) in state.categories" 
              :key="key" 
              class="accordion-item"
            >
              <div class="accordion-header">
                <div class="accordion-title" @click="toggleAccordion(key)">
                  <span class="icon">{{ expandedCategories.includes(key) ? '−' : '+' }}</span>
                  <h4>{{ cat.name }}</h4>
                </div>
                
                <div class="accordion-controls">
                  <span v-if="cat.required" class="badge-required">REQUIS</span>
                  <div v-else class="segmented-control">
                    <button 
                      :class="{ active: cat.status === 'refused' }" 
                      @click="updateCategory(key, 'refused')"
                    >REFUSER</button>
                    <button 
                      :class="{ active: cat.status === 'accepted' }" 
                      @click="updateCategory(key, 'accepted')"
                    >ACCEPTER</button>
                  </div>
                </div>
              </div>

              <div 
                class="accordion-body" 
                :class="{ 'is-open': expandedCategories.includes(key) }"
              >
                <div class="accordion-content-inner">
                  <p class="cat-description">{{ cat.description }}</p>
                  
                  <div class="sub-cookies">
                    <div v-for="sub in cat.subCookies" :key="sub.id" class="sub-row">
                      <span>{{ sub.name }}</span>
                      <span v-if="cat.required" class="badge-required">REQUIS</span>
                      <div v-else class="segmented-control small">
                        <button 
                          :class="{ active: sub.status === 'refused' }" 
                          @click="updateSubCookie(key, sub.id, 'refused')"
                        >REFUSER</button>
                        <button 
                          :class="{ active: sub.status === 'accepted' }" 
                          @click="updateSubCookie(key, sub.id, 'accepted')"
                        >ACCEPTER</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <a href="/privacy" class="link-btn">PROTECTION VIE PRIVÉE</a>
            <button class="btn-primary" @click="save">ENREGISTRER</button>
          </div>
        </div>
      </Transition>

    </div>
  </Transition>
</template>

<style scoped>
/* Variables UI */
:root {
  --cube-cyan: #00a8e8;
  --cube-dark: #111;
  --text-main: #222;
  --text-light: #555;
}

/* Base Overlay */
.cookie-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  font-family: Arial, sans-serif;
}

/* --- VUE 1 : BANNIERE --- */
.cookie-banner {
  display: flex;
  width: 90%;
  max-width: 1100px;
  height: 60vh;
  min-height: 480px; /* Légèrement augmenté pour le grand texte */
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 168, 232, 0.15);
  border: 1px solid #00a8e8;
}

/* Proportions : 35% Image / 65% Texte */
.banner-image {
  width: 35%; 
  background: url('@/assets/images/imgCookies.png') center/cover no-repeat;
  height: 100%;
}

.banner-content {
  width: 65%;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* Header : Logo centré avec le lien juste en dessous */
.banner-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: auto;
}

.invert-logo {
  height: 40px; /* LOGO AGRANDI ICI */
  filter: invert(100%);
  margin-bottom: 12px;
}

.link-btn-continue {
  background: none;
  border: none;
  color: #888;
  font-style: italic;
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s;
}
.link-btn-continue:hover { color: #00a8e8; }

.banner-text {
  margin-top: 20px;
  margin-bottom: auto;
}

/* Styles ajustés pour les gros blocs de texte */
.banner-text p.intro-text { 
  color: var(--text-main); 
  font-size: 0.9rem; 
  line-height: 1.5; 
  margin-bottom: 20px;
  text-align: justify;
}

.section-title { 
  font-size: 0.95rem; 
  font-weight: 900; 
  margin-bottom: 8px;
  color: #00a8e8;
}

.sub-text { 
  color: var(--text-light) !important; 
  font-size: 0.8rem !important; 
  line-height: 1.4 !important;
  text-align: justify;
}

/* Actions centrées en bas */
.banner-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-top: 20px;
  padding-top: 20px;
}

.btn-text {
  background: none;
  border: none;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--text-main);
  text-transform: uppercase;
  padding: 10px 15px;
  transition: color 0.2s;
}
.btn-text:hover { color: #00a8e8; }

.btn-primary {
  background: #00a8e8;
  color: #fff;
  border: none;
  padding: 14px 35px;
  font-weight: 900;
  font-style: italic;
  font-size: 0.9rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.3s ease;
  clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%);
}
.btn-primary:hover { background: #008fbb; }

/* --- VUE 2 : MODALE (Inchangée visuellement) --- */
.cookie-modal {
  width: 100%;
  max-width: 650px;
  border-radius: 4px;
  padding: 40px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 168, 232, 0.15);
  border: 1px solid #00a8e8;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 { margin: 0; font-size: 1.5rem; font-weight: 900; font-style: italic; text-transform: uppercase;}
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }

.modal-intro { font-size: 0.9rem; color: var(--text-light); line-height: 1.5; margin-bottom: 30px; }
.prefs-title { font-size: 0.8rem; text-transform: uppercase; font-weight: 900; color: #00a8e8; margin-bottom: 15px;}

.accordion-list { border-top: 1px solid #eee; margin-bottom: 30px;}
.accordion-item { border-bottom: 1px solid #eee; }

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.accordion-title {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.accordion-title h4 { margin: 0; font-weight: 800; font-size: 1rem; text-transform: uppercase; }
.icon { font-size: 1.2rem; color: #00a8e8; font-weight: bold; width: 15px; text-align: center;}

.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease-in-out;
}
.accordion-body.is-open { grid-template-rows: 1fr; }
.accordion-content-inner { overflow: hidden; }

.cat-description {
  font-size: 0.85rem;
  color: var(--text-light);
  margin: 0 0 15px 25px;
  padding: 10px;
  background: #f4fbff;
  border-left: 3px solid #00a8e8;
}

.sub-cookies { margin-left: 25px; padding-bottom: 20px;}
.sub-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 0.85rem;
  color: var(--text-main);
  border-bottom: 1px dashed #eee;
  font-weight: 600;
}
.sub-row:last-child { border-bottom: none; }

.badge-required {
  color: #00a8e8;
  font-weight: 900;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.segmented-control {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}
.segmented-control button {
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 800;
  border: none;
  background: #fff;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}
.segmented-control button:first-child { border-right: 1px solid #ddd; }
.segmented-control button.active { background: #00a8e8; color: #fff; }
.segmented-control.small button { padding: 4px 8px; font-size: 0.7rem; }

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.link-btn {
  color: var(--text-main);
  text-decoration: none;
  font-weight: 800;
  font-size: 0.8rem;
  text-transform: uppercase;
  transition: color 0.2s;
}
.link-btn:hover { color: #00a8e8; }

/* Transitions Vue */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.4s ease, opacity 0.4s; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(50px); opacity: 0; }
.scale-enter-active, .scale-leave-active { transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s; }
.scale-enter-from, .scale-leave-to { transform: scale(0.95); opacity: 0; }
</style>