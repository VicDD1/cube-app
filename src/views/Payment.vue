<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAppStore } from '../stores/useStore'
import { useRouter } from 'vue-router'
import { loadScript } from '@paypal/paypal-js'

const appStore = useAppStore()
const router = useRouter()

const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'
const idClient = computed(() => appStore.user?.idClient || null)
const cart = ref({ lignePaniers: [] })
const loading = ref(true)

const showPaymentModal = ref(false)
const isPaypalLoading = ref(false)

// --- DONNÉES CLIENT ---
const userAddress = ref({
  rue: '',
  codePostal: '',
  ville: ''
})

// --- CALCULS DU RÉSUMÉ ---
const subTotalCart = computed(() => {
  if (!cart.value?.lignePaniers) return 0
  return cart.value.lignePaniers.reduce((acc, item) => acc + (item.prixUnitaire * item.quantiteSelectionnee), 0)
})

const finalTotalCart = computed(() => subTotalCart.value)
const selectStripe = async () => {
  isPaypalLoading.value = true // On peut réutiliser un loader si tu en as un
  
  try {
    // 1. Initialise Stripe avec ta clé PUBLIQUE (pk_test_...)
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

    // 2. Appelle ton serveur local sur le port 3000
    const response = await fetch('http://localhost:3000/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // On envoie le montant total (en euros)
        amount: finalTotalCart.value,
        // On peut aussi envoyer le nom du client ou les articles si tu veux
        customerName: appStore.user?.prenomClient || 'Client CUBE'
      }),
    })

    const session = await response.json()

    if (session.error) {
      throw new Error(session.error)
    }

    // 3. Redirige vers la page de paiement Stripe
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    })

    if (result.error) {
      alert(result.error.message)
    }
  } catch (err) {
    console.error("Erreur lors de la liaison avec le serveur Stripe :", err)
    alert("Le serveur de paiement (port 3000) ne répond pas. L'as-tu lancé ?")
  } finally {
    isPaypalLoading.value = false
  }
}


// --- INITIALISATION PAYPAL SDK ---
const initPayPal = async () => {
  isPaypalLoading.value = true
  try {
    const paypal = await loadScript({ 
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID, 
      currency: "EUR"
    })

    if (paypal) {
      await paypal.Buttons({
        style: {
          layout: 'vertical',
          color:  'gold',
          shape:  'rect',
          label:  'pay'
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: finalTotalCart.value.toFixed(2)
              }
            }]
          })
        },
        onApprove: async (data, actions) => {
          const details = await actions.order.capture()
          console.log('Paiement validé par PayPal:', details)
          // Redirection vers la page de succès
          router.push('/confirmation')
        },
        onError: (err) => {
          console.error("Erreur PayPal SDK:", err)
        }
      }).render('#paypal-button-container')
    }
  } catch (error) {
    console.error("Erreur de chargement du script PayPal:", error)
  } finally {
    isPaypalLoading.value = false
  }
}

const openPaymentModal = () => {
  showPaymentModal.value = true
  nextTick(() => {
    // On s'assure que le conteneur est vide avant de charger pour éviter les doublons
    const container = document.getElementById('paypal-button-container')
    if (container) container.innerHTML = ''
    initPayPal()
  })
}

// --- RÉCUPÉRATION ADRESSE ---
const fetchAddress = async () => {
  if (!idClient.value) return
  try {
    const resLivraison = await fetch(`${API_BASE}/AdresseLivraison/GetAdressesLivraison`)
    if (resLivraison.ok) {
      const livraisons = await resLivraison.json()
      const userLivraison = livraisons.find(l => l.idClient === idClient.value)
      if (userLivraison) {
        const resAddr = await fetch(`${API_BASE}/Adresse/GetAdresseById/${userLivraison.idAdresse}`)
        if (resAddr.ok) {
          const addrData = await resAddr.json()
          userAddress.value = { rue: addrData.rue, codePostal: addrData.codePostal, ville: addrData.ville }
        }
      }
    }
  } catch (err) { console.error("Erreur adresse:", err) }
}

// --- CHARGEMENT DU PANIER ---
const fetchCart = async () => {
  if (!idClient.value) { router.push('/login'); return }
  try {
    const res = await fetch(`${API_BASE}/Panier/GetActiveCart/${idClient.value}`)
    if (res.ok) {
      const data = await res.json()
      const detailsRes = await fetch(`${API_BASE}/Panier/GetDetails/${data.idPanier}`)
      cart.value = await detailsRes.json()
      await Promise.all(cart.value.lignePaniers.map(async (item) => {
        try {
          const artRes = await fetch(`${API_BASE}/Articles/GetArticleDetails/${item.reference.trim()}`)
          if (artRes.ok) {
            const artData = await artRes.json()
            item.nomArticle = artData.nomArticle
            item.prixUnitaire = artData.prix
            item.quantiteSelectionnee = item.quantiteArticle || item.quantiteSelectionnee
          }
        } catch (e) { console.error("Erreur article:", e) }
      }))
    }
  } catch (err) { console.error("Erreur panier:", err) } finally { loading.value = false }
}

onMounted(() => {
  fetchCart()
  fetchAddress()
})
</script>

<template>
  <div class="checkout-page">
    <div class="checkout-header">
      <h1>FINALISER LA COMMANDE</h1>
    </div>

    <div v-if="loading" class="loading-state">Chargement de votre commande...</div>

    <div v-else class="checkout-grid">
      <div class="form-column">
        <section class="checkout-section">
          <h2>1. ADRESSE DE LIVRAISON</h2>
          <form class="address-form" @submit.prevent>
            <div class="input-row">
              <div class="input-group">
                <label>PRÉNOM</label>
                <input type="text" :value="appStore.user?.prenomClient" readonly />
              </div>
              <div class="input-group">
                <label>NOM</label>
                <input type="text" :value="appStore.user?.nomClient" readonly />
              </div>
            </div>
            <div class="input-group">
              <label>ADRESSE COMPLÈTE</label>
              <input type="text" v-model="userAddress.rue" placeholder="Numéro et nom de rue" />
            </div>
            <div class="input-row">
              <div class="input-group">
                <label>CODE POSTAL</label>
                <input type="text" v-model="userAddress.codePostal" placeholder="Ex: 74000" />
              </div>
              <div class="input-group">
                <label>VILLE</label>
                <input type="text" v-model="userAddress.ville" placeholder="Ex: Annecy" />
              </div>
            </div>
          </form>
        </section>

        <section class="checkout-section">
          <h2>2. MODE DE LIVRAISON</h2>
          <div class="delivery-options">
            <label class="delivery-card active">
              <input type="radio" name="delivery" checked />
              <div class="delivery-info">
                <span class="d-title">Livraison Standard</span>
                <span class="d-time">3 à 5 jours ouvrés</span>
              </div>
              <span class="d-price">OFFERT</span>
            </label>
          </div>
        </section>
      </div>

      <div class="summary-column">
        <div class="summary-box">
          <h3>RÉSUMÉ DES ACHATS</h3>
          <div class="items-preview">
            <div v-for="item in cart.lignePaniers" :key="item.reference" class="preview-item">
              <div class="preview-info">
                <span class="p-qty">{{ item.quantiteSelectionnee }}x</span>
                <span class="p-name">{{ item.nomArticle || item.reference }} ({{ item.tailleSelectionnee }})</span>
              </div>
              <span class="p-price">{{ (item.prixUnitaire * item.quantiteSelectionnee).toLocaleString() }} €</span>
            </div>
          </div>

          <div class="summary-details">
            <div class="summary-row"><span>Sous-total HT</span><span>{{ (subTotalCart / 1.2).toFixed(2) }} €</span></div>
            <div class="summary-row"><span>TVA (20%)</span><span>{{ (subTotalCart - (subTotalCart / 1.2)).toFixed(2) }} €</span></div>
            <div class="summary-row delivery"><span>Livraison</span><span class="free-badge">OFFERTE</span></div>
          </div>

          <div class="summary-total">
            <span class="total-label">TOTAL TTC</span>
            <span class="total-amount">{{ finalTotalCart.toLocaleString() }} €</span>
          </div>
          
          <button class="pay-btn" @click="openPaymentModal">
            PROCÉDER AU PAIEMENT
          </button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showPaymentModal" @click.self="showPaymentModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showPaymentModal = false">✖</button>
        <h3>MODE DE PAIEMENT</h3>
        <p class="modal-subtitle">Montant à régler : <strong>{{ finalTotalCart.toLocaleString() }} €</strong></p>
        
        <div class="payment-methods">
          <button class="gateway-btn stripe-btn" @click="alert('Stripe bientôt disponible')">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" class="payment-logo" />
            <span>Payer par Carte Bancaire</span>
          </button>
          
          <div class="paypal-wrapper">
             <div v-if="isPaypalLoading" class="paypal-loading">Connexion à PayPal...</div>
             <div id="paypal-button-container"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');

.checkout-page {
  max-width: 1200px;
  margin: 120px auto 80px;
  padding: 0 20px;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
}

.checkout-header {
  margin-bottom: 40px;
  border-bottom: 2px solid #000;
  padding-bottom: 15px;
}

.checkout-header h1 {
  font-size: 2.2rem;
  font-weight: 900;
  font-style: italic;
  margin: 0;
}

.loading-state {
  text-align: center;
  font-weight: 800;
  padding: 50px;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 50px;
  align-items: start;
}

.checkout-section {
  margin-bottom: 40px;
}

.checkout-section h2 {
  font-size: 1.2rem;
  font-weight: 900;
  margin-bottom: 20px;
}

.input-row {
  display: flex;
  gap: 15px;
}

.input-group {
  flex: 1;
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  margin-bottom: 5px;
  color: #666;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fcfcfc;
  font-family: 'Inter', sans-serif;
}

.input-group input:focus {
  border-color: #000;
  outline: none;
}

.delivery-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 2px solid #00a8e8;
  border-radius: 8px;
  background: rgba(0, 168, 232, 0.05);
  cursor: pointer;
}

.delivery-info {
  display: flex;
  flex-direction: column;
  margin-left: 15px;
  flex-grow: 1;
}

.d-title { font-weight: 800; }
.d-time { font-size: 0.85rem; color: #666; }
.d-price { font-weight: 900; color: #00a8e8; }

.summary-box {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  position: sticky;
  top: 100px;
}

.summary-box h3 {
  font-weight: 900;
  margin-top: 0;
  border-bottom: 1px solid #ddd;
  padding-bottom: 15px;
}

.items-preview {
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed #ddd;
  font-size: 0.9rem;
}

.p-qty { font-weight: 800; margin-right: 10px; color: #00a8e8; }
.p-name { color: #555; }
.p-price { font-weight: 700; }

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #555;
}

.free-badge {
  background: #000;
  color: #fff;
  padding: 3px 8px;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 4px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-top: 15px;
  border-top: 2px solid #000;
}

.total-label { font-weight: 800; font-size: 1.1rem; }
.total-amount { font-weight: 900; font-size: 1.8rem; }

.pay-btn {
  width: 100%;
  background: #000;
  color: #fff;
  border: none;
  padding: 20px;
  font-weight: 900;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pay-btn:hover {
  background: #00a8e8;
  transform: translateY(-2px);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: #fff;
  padding: 40px;
  border-radius: 16px;
  width: 90%;
  max-width: 450px;
  text-align: center;
  position: relative;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
}

.modal-close {
  position: absolute;
  top: 15px; right: 20px;
  background: none; border: none;
  font-size: 1.5rem; cursor: pointer; color: #999;
}

.modal-content h3 {
  font-weight: 900; font-style: italic; margin-bottom: 5px;
}

.modal-subtitle {
  color: #666; margin-bottom: 30px;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.gateway-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25px;
  border: 2px solid #eee;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-weight: 800;
  font-size: 1rem;
  transition: all 0.2s;
  gap: 15px;
  width: 100%;
}

.payment-logo {
  height: 25px;
  object-fit: contain;
}

.paypal-img {
  height: 22px;
}

.stripe-btn:hover { border-color: #635bff; background: rgba(99, 91, 255, 0.05); }
.paypal-btn:hover { border-color: #003087; background: rgba(0, 48, 135, 0.05); }

@media (max-width: 900px) {
  .checkout-grid { grid-template-columns: 1fr; }
  .summary-box { position: static; }
}
</style>