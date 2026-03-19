<script setup>
import { ref } from 'vue'
import { MapPin, Phone, Mail, Clock } from 'lucide-vue-next'

const form = ref({
  nom: '',
  email: '',
  sujet: '',
  message: ''
})

const isSubmitted = ref(false)

const envoyerMessage = async () => {
  try {
    // Appel à l'API Formspree (ou autre service similaire)
    const response = await fetch('https://formspree.io/f/mjgalgkw', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    if (response.ok) {
      isSubmitted.value = true
      
      // Reset du formulaire
      form.value = { nom: '', email: '', sujet: '', message: '' }
      
      setTimeout(() => {
        isSubmitted.value = false
      }, 5000)
    } else {
      console.error("Erreur lors de l'envoi du message.")
    }
  } catch (error) {
    console.error("Problème réseau :", error)
  }
}
</script>
<template>
  <div class="contact-page">
    <div class="contact-header">
      <h1 class="contact-title">CONTACTEZ-NOUS</h1>
      <p class="contact-subtitle">Une question sur un vélo ? Besoin d'aide ? On est là pour vous.</p>
    </div>

    <div class="contact-grid">
      <div class="form-section">
        <h2 class="section-title">Envoyez-nous un message</h2>
        
        <form @submit.prevent="envoyerMessage" class="contact-form" v-if="!isSubmitted">
          <div class="input-group">
            <label for="nom">Votre nom</label>
            <input type="text" id="nom" v-model="form.nom" required placeholder="Jean Dupont" />
          </div>
          
          <div class="input-group">
            <label for="email">Votre e-mail</label>
            <input type="email" id="email" v-model="form.email" required placeholder="jean@exemple.com" />
          </div>
          
          <div class="input-group">
            <label for="sujet">Sujet</label>
            <input type="text" id="sujet" v-model="form.sujet" required placeholder="Ex: Conseil sur la taille d'un cadre" />
          </div>
          
          <div class="input-group">
            <label for="message">Votre message</label>
            <textarea id="message" v-model="form.message" rows="5" required placeholder="Comment pouvons-nous vous aider ?"></textarea>
          </div>
          
          <button type="submit" class="btn-submit">ENVOYER LE MESSAGE</button>
        </form>

        <div v-else class="success-message">
          <div class="success-icon">✓</div>
          <h3>Message bien reçu !</h3>
          <p>Notre équipe vous répondra dans les plus brefs délais.</p>
        </div>
      </div>

      <div class="info-section">
        <h2 class="section-title">Nos coordonnées</h2>
        
        <div class="info-cards">
          <div class="info-card">
            <Phone class="info-icon" :size="24" />
            <div>
              <h3>Téléphone</h3>
              <p>01 23 45 67 89</p>
            </div>
          </div>
          
          <div class="info-card">
            <Mail class="info-icon" :size="24" />
            <div>
              <h3>E-mail</h3>
              <p>noreplycube.app@gmail.com</p>
            </div>
          </div>
          
        
          
          <div class="info-card">
            <Clock class="info-icon" :size="24" />
            <div>
              <h3>Horaires</h3>
              <p>Lundi - Samedi : 10h00 - 19h00<br>Fermé le dimanche</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800;900&display=swap');

.contact-page {
  max-width: 1200px;
  margin: 140px auto 80px;
  padding: 0 30px;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
}

/* --- EN-TÊTE --- */
.contact-header {
  text-align: center;
  margin-bottom: 60px;
}
.contact-title {
  font-size: 3rem;
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: -1px;
  margin: 0 0 15px 0;
}
.contact-subtitle {
  font-size: 1.1rem;
  color: #666;
  font-weight: 500;
}

/* --- GRILLE --- */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
}
.section-title {
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  margin-bottom: 30px;
  border-bottom: 3px solid #00a8e8;
  display: inline-block;
  padding-bottom: 5px;
}

/* --- FORMULAIRE --- */
.contact-form {
  background: #fdfdfd;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #eaeaea;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}
.input-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}
.input-group label {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: #333;
}
.input-group input,
.input-group textarea {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  transition: border-color 0.3s;
  outline: none;
}
.input-group input:focus,
.input-group textarea:focus {
  border-color: #00a8e8;
}
.btn-submit {
  width: 100%;
  background: #1a1a1a;
  color: #fff;
  border: none;
  padding: 16px;
  font-weight: 900;
  font-style: italic;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}
.btn-submit:hover {
  background: #00a8e8;
  transform: translateY(-2px);
}

/* Message de succès */
.success-message {
  text-align: center;
  padding: 50px 30px;
  background: #f0fdf4;
  border: 1px solid #10b981;
  border-radius: 12px;
  color: #065f46;
}
.success-icon {
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 15px;
}
.success-message h3 {
  font-weight: 900;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

/* --- COORDONNÉES --- */
.info-section {
  display: flex;
  flex-direction: column;
}
.info-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.info-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: #f9f9f9;
  padding: 25px;
  border-radius: 12px;
  transition: transform 0.3s, background 0.3s;
}
.info-card:hover {
  background: #fff;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  transform: translateX(5px);
}
.info-icon {
  color: #00a8e8;
  flex-shrink: 0;
  margin-top: 2px;
}
.info-card h3 {
  font-weight: 900;
  font-size: 1.1rem;
  margin: 0 0 5px 0;
  color: #1a1a1a;
}
.info-card p {
  color: #666;
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

/* --- RESPONSIVE --- */
@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>