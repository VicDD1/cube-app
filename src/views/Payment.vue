<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAppStore } from '../stores/useStore'
import { useRouter } from 'vue-router'
import { loadScript } from '@paypal/paypal-js'

const appStore = useAppStore()
const router = useRouter()

const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'
const idClient = computed(() => appStore.user?.idClient || null)
const cart = ref({ lignePaniers: [], idPanier: null }) // Initialisé avec idPanier
const loading = ref(true)

const showPaymentModal = ref(false)
const isPaypalLoading = ref(false)

const userAddress = ref({ rue: '', codePostal: '', ville: '' })

const subTotalCart = computed(() => {
  if (!cart.value?.lignePaniers) return 0
  return cart.value.lignePaniers.reduce((acc, item) => acc + (item.prixUnitaire * item.quantiteSelectionnee), 0)
})

const finalTotalCart = computed(() => subTotalCart.value)


const insertionCommande = async () => {
  if (!idClient.value || !cart.value.lignePaniers?.length) {
    console.error("Données client ou panier manquantes");
    return false;
  }

  const commandeData = {
    idClient: parseInt(idClient.value),
    idAdresse: 10, 
    idTypeLivraison: 2, 
    idPanier: parseInt(cart.value.idPanier),
    dateCommande: new Date().toISOString().split('T')[0], 
    montantTotalCommande: parseFloat(finalTotalCart.value),
    coutLivraison: 0,
    dateLivraison: "2026-12-30",
    typePaiement: "CB",
    statutLivraison: "prepare",

    ligneCommandes: cart.value.lignePaniers.map(item => ({
      reference: item.reference.trim(),
      idCommande: 0, 
      quantiteArticleCommande: parseInt(item.quantiteSelectionnee),
      prixUnitaireArticle: parseFloat(item.prixUnitaire),
      tailleSelectionnee: item.tailleSelectionnee || "M"
    }))
  };

  console.log("🚀 Tentative d'insertion avec objets de navigation simulés...", commandeData);

  try {
    const response = await fetch(`${API_BASE}/Commande/PostCommande`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(commandeData)
    });

    if (response.ok) {
      console.log("✅ Commande enregistrée avec succès !");
      return true;
    } else {
      const errorDetail = await response.json();
      console.error("❌ ÉCHEC FINAL - L'API est trop restrictive :", errorDetail.errors);
      
      // Si ça échoue encore ici, il est techniquement IMPOSSIBLE de passer
      // par cette API sans modifier le code C# (Backend).
      return false;
    }
  } catch (err) {
    console.error("❌ Erreur réseau :", err);
    return false;
  }
};


const selectStripe = async () => {
  isPaypalLoading.value = true 
  try {
    // 1. Création de la session Stripe
    const response = await fetch('http://localhost:4242/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: finalTotalCart.value,
        customerName: appStore.user?.prenomClient || 'Client CUBE'
      }),
    })

    if (!response.ok) throw new Error("Serveur Stripe injoignable");
    const session = await response.json()

    if (session.url) {
      // 2. ÉTAPE CRUCIALE : On enregistre la commande en base de données 
      // JUSTE AVANT de quitter la page pour Stripe.
      console.log("Enregistrement de la commande avant redirection Stripe...");
      const success = await insertionCommande();

      if (success) {
        // 3. On redirige vers Stripe seulement si l'insertion API a réussi
        window.location.href = session.url;
      } else {
        alert("Erreur lors de la création de la commande. Paiement annulé.");
      }
    }
  } catch (err) {
    console.error("Erreur Stripe :", err)
    alert("Service de paiement indisponible (vérifiez node server.js)")
  } finally {
    isPaypalLoading.value = false
  }
}
// --- PAYPAL ---
const initPayPal = async () => {
  isPaypalLoading.value = true
  try {
    const paypal = await loadScript({ 
      "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID, 
      currency: "EUR"
    })

    if (paypal) {
      await paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: { value: finalTotalCart.value.toFixed(2) }
            }]
          })
        },
        onApprove: async (data, actions) => {
          console.log("💰 Paiement PayPal approuvé par l'utilisateur");
          await actions.order.capture()
          console.log("📸 Capture PayPal réussie, lancement insertionCommande...");
          
          const success = await insertionCommande()
          
          if (success) {
            router.push('/confirmation')
          }
        },
        onError: (err) => { console.error("Erreur PayPal SDK:", err) }
      }).render('#paypal-button-container')
    }
  } catch (error) {
    console.error("Erreur script PayPal:", error)
  } finally {
    isPaypalLoading.value = false
  }
}

const openPaymentModal = () => {
  showPaymentModal.value = true
  nextTick(() => {
    const container = document.getElementById('paypal-button-container')
    if (container) container.innerHTML = ''
    initPayPal()
  })
}

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

const fetchCart = async () => {
  if (!idClient.value) { 
    router.push('/login'); 
    return; 
  }
  try {
    const res = await fetch(`${API_BASE}/Panier/GetActiveCart/${idClient.value}`)
    if (res.ok) {
      const data = await res.json()
      const detailsRes = await fetch(`${API_BASE}/Panier/GetDetails/${data.idPanier}`)
      const detailsData = await detailsRes.json()
      
      cart.value = detailsData;
      cart.value.idPanier = data.idPanier; 
      console.log("🛒 Panier chargé avec ID:", cart.value.idPanier);

      await Promise.all(cart.value.lignePaniers.map(async (item) => {
        const artRes = await fetch(`${API_BASE}/Articles/GetArticleDetails/${item.reference.trim()}`)
        if (artRes.ok) {
          const artData = await artRes.json()
          item.nomArticle = artData.nomArticle
          item.prixUnitaire = artData.prix
          item.quantiteSelectionnee = item.quantiteArticle || item.quantiteSelectionnee
        }
      }))
    }
  } catch (err) { console.error("Erreur fetchCart:", err) } finally { loading.value = false }
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

    <div v-if="loading" class="loading-state">Préparation de la commande...</div>

    <div v-else class="checkout-grid">
      <div class="form-column">
        <section class="checkout-section">
          <h2>1. ADRESSE DE LIVRAISON</h2>
          <form class="address-form" @submit.prevent>
            <div class="input-row">
              <div class="input-group"><label>PRÉNOM</label><input type="text" :value="appStore.user?.prenomClient" readonly /></div>
              <div class="input-group"><label>NOM</label><input type="text" :value="appStore.user?.nomClient" readonly /></div>
            </div>
            <div class="input-group">
              <label>ADRESSE COMPLÈTE</label>
              <input type="text" v-model="userAddress.rue" placeholder="Numéro et nom de rue" />
            </div>
            <div class="input-row">
              <div class="input-group"><label>CODE POSTAL</label><input type="text" v-model="userAddress.codePostal" /></div>
              <div class="input-group"><label>VILLE</label><input type="text" v-model="userAddress.ville" /></div>
            </div>
          </form>
        </section>

        <section class="checkout-section">
          <h2>2. MODE DE LIVRAISON</h2>
          <div class="delivery-options">
            <label class="delivery-card active">
              <input type="radio" checked />
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
          <h3>VOTRE PANIER</h3>
          <div class="items-preview">
            <div v-for="item in cart.lignePaniers" :key="item.reference" class="preview-item">
              <div class="preview-info">
                <span class="p-qty">{{ item.quantiteSelectionnee }}x</span>
                <span class="p-name">{{ item.nomArticle || item.reference }}</span>
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
          
          <button class="pay-btn" @click="openPaymentModal">PROCÉDER AU PAIEMENT</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" v-if="showPaymentModal" @click.self="showPaymentModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showPaymentModal = false">✖</button>
        <h3>PAIEMENT SÉCURISÉ</h3>
        <p class="modal-subtitle">Montant : <strong>{{ finalTotalCart.toLocaleString() }} €</strong></p>
        
        <div class="payment-methods">
          <button class="gateway-btn stripe-btn" @click="selectStripe">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" class="payment-logo" />
            <span>Carte Bancaire</span>
          </button>
          
          <div class="paypal-wrapper">
             <div v-if="isPaypalLoading" class="paypal-loading">Chargement PayPal...</div>
             <div id="paypal-button-container"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');

.checkout-page { max-width: 1200px; margin: 120px auto 80px; padding: 0 20px; font-family: 'Inter', sans-serif; color: #1a1a1a; }
.checkout-header { margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 15px; }
.checkout-header h1 { font-size: 2.2rem; font-weight: 900; font-style: italic; margin: 0; }
.checkout-grid { display: grid; grid-template-columns: 1fr 400px; gap: 50px; align-items: start; }
.checkout-section { margin-bottom: 40px; }
.checkout-section h2 { font-size: 1.2rem; font-weight: 900; margin-bottom: 20px; }

.input-row { display: flex; gap: 15px; }
.input-group { flex: 1; margin-bottom: 15px; }
.input-group label { display: block; font-size: 0.8rem; font-weight: 800; margin-bottom: 5px; color: #666; }
.input-group input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; background: #fcfcfc; }

.delivery-card { display: flex; align-items: center; padding: 20px; border: 2px solid #00a8e8; border-radius: 8px; background: rgba(0, 168, 232, 0.05); }
.delivery-info { flex-grow: 1; margin-left: 15px; display: flex; flex-direction: column; }
.d-title { font-weight: 800; }
.d-price { font-weight: 900; color: #00a8e8; }

.summary-box { background: #f8f9fa; padding: 30px; border-radius: 12px; position: sticky; top: 100px; }
.items-preview { margin-bottom: 20px; max-height: 250px; overflow-y: auto; }
.preview-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ddd; font-size: 0.9rem; }
.p-qty { font-weight: 800; color: #00a8e8; margin-right: 8px; }

.summary-details { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
.summary-row { display: flex; justify-content: space-between; font-size: 0.95rem; color: #555; }
.summary-total { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; margin-top: 15px; border-top: 2px solid #000; }
.total-amount { font-weight: 900; font-size: 1.8rem; }

.pay-btn { width: 100%; background: #000; color: #fff; border: none; padding: 20px; font-weight: 900; font-size: 1.1rem; border-radius: 8px; cursor: pointer; transition: 0.3s; }
.pay-btn:hover { background: #00a8e8; transform: translateY(-2px); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.modal-content { background: #fff; padding: 40px; border-radius: 16px; width: 90%; max-width: 450px; text-align: center; position: relative; }
.modal-close { position: absolute; top: 15px; right: 20px; border: none; background: none; font-size: 1.5rem; cursor: pointer; }

.payment-methods { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
.gateway-btn { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 15px; border: 2px solid #eee; border-radius: 12px; background: #fff; cursor: pointer; font-weight: 800; }
.payment-logo { height: 25px; }
</style>