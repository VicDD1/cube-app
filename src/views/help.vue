<script setup>
import { ref } from 'vue'
import { Truck, Ruler, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-vue-next'

const categories = ref([
  {
    titre: "Livraison & Suivi",
    icon: Truck,
    questions: [
      { q: "Quels sont les délais de livraison ?", a: "Nous préparons votre commande avec soin. Comptez 3 à 5 jours ouvrés pour une livraison standard, directement à votre domicile ou en magasin." },
      { q: "Puis-je suivre mon expédition ?", a: "Absolument. Un lien de suivi vous sera envoyé par e-mail dès que le transporteur prendra en charge votre colis." }
    ]
  },
  {
    titre: "Vélos & Tailles",
    icon: Ruler,
    questions: [
      { q: "Comment choisir la bonne taille de vélo ?", a: "Consultez notre guide des géométries sur chaque fiche produit. Si vous hésitez, privilégiez la taille inférieure pour plus de maniabilité, ou la supérieure pour un confort optimal." },
      { q: "Le vélo arrive-t-il monté ?", a: "Il est assemblé à 85%. Il vous restera simplement à visser les pédales et à redresser le guidon. Un multi-outil et une notice claire sont fournis dans le carton." }
    ]
  },
  {
    titre: "Retours & Garantie",
    icon: ShieldCheck,
    questions: [
      { q: "Les retours sont-ils gratuits ?", a: "Totalement. Vous disposez de 30 jours pour changer d'avis. Veuillez simplement renvoyer l'article neuf dans son emballage d'origine." },
      { q: "Comment fonctionne la garantie ?", a: "Soyez tranquille. Les cadres sont garantis 5 ans. Les composants électriques (moteur, batterie) bénéficient d'une garantie constructeur de 2 ans." }
    ]
  }
])

const activeIndex = ref(null)

const toggleAccordion = (id) => {
  activeIndex.value = activeIndex.value === id ? null : id
}
</script>

<template>
  <div class="faq-page">
    <div class="faq-header">
      <h1 class="faq-title">AIDE & FAQ</h1>
      <p class="faq-subtitle">Des questions ? Nous avons les réponses. Simple et direct.</p>
    </div>

    <div class="faq-content">
      <div v-for="(category, cIndex) in categories" :key="cIndex" class="faq-category">
        <div class="category-header">
          <component :is="category.icon" class="cat-icon" :size="28" :stroke-width="2" />
          <h2 class="category-title">{{ category.titre }}</h2>
        </div>
        
        <div class="accordion-group">
          <div 
            v-for="(item, qIndex) in category.questions" 
            :key="qIndex" 
            class="accordion-item"
            :class="{ active: activeIndex === `${cIndex}-${qIndex}` }"
          >
            <button class="accordion-trigger" @click="toggleAccordion(`${cIndex}-${qIndex}`)">
              <span class="question-text">{{ item.q }}</span>
              <ChevronUp v-if="activeIndex === `${cIndex}-${qIndex}`" class="icon-toggle active-icon" />
              <ChevronDown v-else class="icon-toggle" />
            </button>
            <div class="accordion-panel" v-show="activeIndex === `${cIndex}-${qIndex}`">
              <p class="answer-text">{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="contact-block">
      <h3>Toujours bloqué ?</h3>
      <p>Notre équipe est à votre entière disposition pour vous accompagner.</p>
      <router-link to="/contact" class="btn-contact">CONTACTEZ-NOUS</router-link>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800;900&display=swap');

.faq-page {
  max-width: 900px;
  margin: 140px auto 80px;
  padding: 0 30px;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
}


.faq-header {
  text-align: center;
  margin-bottom: 70px;
}
.faq-title {
  font-size: 3rem;
  font-weight: 900;
  font-style: italic;
  text-transform: uppercase;
  letter-spacing: -1px;
  margin: 0 0 15px 0;
}
.faq-subtitle {
  font-size: 1.1rem;
  color: #666;
  font-weight: 500;
}


.faq-category {
  margin-bottom: 60px;
}
.category-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  border-bottom: 3px solid #00a8e8;
  padding-bottom: 10px;
  width: fit-content;
}
.cat-icon {
  color: #00a8e8;
}
.category-title {
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  margin: 0;
}


.accordion-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.accordion-item {
  background: #fdfdfd;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}
.accordion-item.active {
  border-color: #00a8e8;
  box-shadow: 0 4px 15px rgba(0, 168, 232, 0.08);
}

.accordion-trigger {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  padding: 20px;
  cursor: pointer;
  text-align: left;
}
.question-text {
  font-weight: 800;
  font-size: 1.05rem;
  color: #1a1a1a;
  padding-right: 20px;
}
.icon-toggle {
  color: #999;
  transition: color 0.3s;
}
.active-icon {
  color: #00a8e8;
}

.accordion-panel {
  padding: 0 20px 20px;
}
.answer-text {
  color: #555;
  line-height: 1.6;
  font-size: 0.95rem;
  margin: 0;
}


.contact-block {
  margin-top: 80px;
  padding: 50px 40px;
  background: #1a1a1a;
  border-radius: 12px;
  text-align: center;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.contact-block h3 {
  font-size: 1.8rem;
  font-weight: 900;
  font-style: italic;
  margin: 0 0 15px 0;
}
.contact-block p {
  color: #aaa;
  margin-bottom: 30px;
  font-size: 1.05rem;
}
.btn-contact {
  display: inline-block;
  background: #00a8e8;
  color: #fff;
  padding: 16px 40px;
  font-weight: 900;
  font-style: italic;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.3s ease;
}
.btn-contact:hover {
  background: #fff;
  color: #1a1a1a;
  transform: translateY(-2px);
}
</style>