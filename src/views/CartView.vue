<script setup>
import { onMounted, ref, computed } from 'vue'
import { useAppStore } from '../stores/useStore'
import { useRouter } from 'vue-router'

const appStore = useAppStore()

const idClient = computed(() => appStore.user ? appStore.user.idClient : null)
const cart = ref({ lignePaniers: [] })
const loading = ref(true)
const router = useRouter()

const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'

const subTotalCart = computed(() => {
  if (!cart.value?.lignePaniers) return 0
  return cart.value.lignePaniers.reduce((acc, item) => acc + (item.prixUnitaire * item.quantiteSelectionnee), 0)
})

const finalTotalCart = computed(() => {
  return subTotalCart.value
})

const fetchCart = async () => {
  loading.value = true
  try {
    if (!idClient.value) {
      const localCart = JSON.parse(localStorage.getItem('panierVisiteur'))
      cart.value = (localCart && localCart.lignePaniers) ? localCart : { lignePaniers: [] }
    } else {
      const res = await fetch(`${API_BASE}/Panier/GetActiveCart/${idClient.value}`)
      
      if (res.status === 404) {
        cart.value = { lignePaniers: [] }
      } else if (res.ok) {
        const data = await res.json()
        const detailsRes = await fetch(`${API_BASE}/Panier/GetDetails/${data.idPanier}`)
        cart.value = await detailsRes.json()
      }
    }

    if (cart.value.lignePaniers && cart.value.lignePaniers.length > 0) {
      await Promise.all(cart.value.lignePaniers.map(async (item) => {
        try {
          const artRes = await fetch(`${API_BASE}/Articles/GetArticleDetails/${item.reference.trim()}`)
          if (artRes.ok) {
            const artData = await artRes.json()
            item.nomArticle = artData.nomArticle
            item.prixUnitaire = artData.prix
            item.quantiteSelectionnee = item.quantiteArticle || item.quantiteSelectionnee
          }
        } catch (e) {
          console.error(`Erreur récupération nom:`, e)
        }
      }))
    }
    
    appStore.updateCartCount(idClient.value)

  } catch (err) {
    console.error("Erreur chargement panier:", err)
  } finally {
    loading.value = false
  }
}

const updateQuantity = async (item, delta) => {
  const newQty = item.quantiteSelectionnee + delta
  if (newQty <= 0) return removeItem(item)

  if (!idClient.value) {
    item.quantiteSelectionnee = newQty
    localStorage.setItem('panierVisiteur', JSON.stringify(cart.value))
    appStore.updateCartCount(null)
  } else {
    try {
      const payload = {
        idPanier: item.idPanier,
        reference: item.reference, 
        tailleSelectionnee: item.tailleSelectionnee,
        quantiteArticle: newQty
      }

      const response = await fetch(`${API_BASE}/LignePanier/PutLignePanier/${item.idPanier}/${encodeURIComponent(item.reference)}/${encodeURIComponent(item.tailleSelectionnee)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        item.quantiteSelectionnee = newQty
        fetchCart()
      } else {
        console.error("L'API a refusé la mise à jour.")
      }
    } catch (err) {
      console.error("Erreur update:", err)
    }
  }
}

const removeItem = async (item) => {
  if (!confirm("Voulez-vous vraiment retirer cet article ?")) return

  if (!idClient.value) {
    cart.value.lignePaniers = cart.value.lignePaniers.filter(
      i => !(i.reference === item.reference && i.tailleSelectionnee === item.tailleSelectionnee)
    )
    localStorage.setItem('panierVisiteur', JSON.stringify(cart.value))
    appStore.updateCartCount(null)
  } else {
    try {
      await fetch(`${API_BASE}/LignePanier/DeleteLignePanier/${item.idPanier}/${item.reference}/${item.tailleSelectionnee}`, {
        method: 'DELETE'
      })
      fetchCart()
    } catch (err) {
      console.error("Erreur suppression:", err)
    }
  }
}

const getImageUrl = (ref) => {
  const cleanRef = ref?.trim() || '' 
  const folder = cleanRef.length === 6 ? 'VELOS' : 'ACCESSOIRES'
  
  try {
    return new URL(`../assets/images/${folder}/${cleanRef}/image_1.webp`, import.meta.url).href
  } catch(e) {
    return 'https://via.placeholder.com/150?text=Image+Indisponible'
  }
}

const handleCheckout = () => {
  if (appStore.isConnected) {
    router.push('/paiement')
  } else {
    router.push('/login')
  }
}

onMounted(fetchCart)
</script>

<template>
  <div class="cart-page">
    <div class="cart-header">
      <h1 class="cart-title">VOTRE PANIER</h1>
      <span class="item-count">{{ cart?.lignePaniers?.length || 0 }} article(s)</span>
    </div>

    <div v-if="loading" class="loader-container">
      <div class="bike-wheel"></div>
      <div class="loading-text">CHARGEMENT...</div>
    </div>

    <div v-else-if="cart && cart.lignePaniers.length > 0" class="cart-grid">
      <div class="cart-items-container">
        <div class="cart-items">
          <div v-for="item in cart.lignePaniers" :key="item.reference + item.tailleSelectionnee" class="cart-item">
            <div class="item-img-wrapper">
              <img :src="getImageUrl(item.reference)" class="item-img" />
            </div>
            
            <div class="item-details">
              <div class="item-info">
                <h4>{{ item.nomArticle || item.reference }}</h4>
                <p class="item-size">Taille : <span>{{ item.tailleSelectionnee }}</span></p>
                <button @click="removeItem(item)" class="remove-btn">Retirer du panier</button>
              </div>

              <div class="item-actions">
                <div class="item-qty">
                  <button @click="updateQuantity(item, -1)" class="qty-btn minus">-</button>
                  <span class="qty-value">{{ item.quantiteSelectionnee }}</span>
                  <button @click="updateQuantity(item, 1)" class="qty-btn plus">+</button>
                </div>
                
                <div class="item-price">
                  {{ (item.prixUnitaire * item.quantiteSelectionnee).toLocaleString() }} €
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-box">
          <h3>RÉSUMÉ DE LA COMMANDE</h3>
          
          <div class="summary-details">
            <div class="summary-row">
              <span>Sous-total HT</span>
              <span>{{ (subTotalCart / 1.2).toFixed(2) }} €</span>
            </div>
            <div class="summary-row">
              <span>TVA (20%)</span>
              <span>{{ (subTotalCart - (subTotalCart / 1.2)).toFixed(2) }} €</span>
            </div>

            <div class="summary-row delivery">
              <span>Frais de livraison</span>
              <span class="free-badge">OFFERTS</span>
            </div>
          </div>

          <div class="summary-total">
            <span class="total-label">TOTAL TTC</span>
            <span class="total-amount">{{ finalTotalCart.toLocaleString() }} €</span>
          </div>
          
          <button class="checkout-btn" @click="handleCheckout">
            VALIDER MON PANIER
            <span class="btn-icon">→</span>
          </button>
          
          <div class="secure-payment">
             Paiement 100% sécurisé
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-cart">
      <h2>Votre panier est vide</h2>
      <p>Découvrez nos nouveautés et trouvez l'équipement parfait.</p>
      <router-link to="/" class="back-shop-btn">Continuer mes achats</router-link>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800;900&display=swap');

.cart-page { 
  max-width: 1300px; 
  margin: 140px auto 80px; 
  padding: 0 30px; 
  font-family: 'Inter', sans-serif; 
  color: #1a1a1a;
}

.cart-header {
  display: flex;
  align-items: baseline;
  gap: 15px;
  margin-bottom: 40px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
}

.cart-title { 
  font-size: 2.8rem; 
  font-weight: 900; 
  font-style: italic; 
  text-transform: uppercase;
  letter-spacing: -1px;
  margin: 0;
}

.item-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #666;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 20px;
}

.cart-grid { 
  display: grid; 
  grid-template-columns: 1fr 400px; 
  gap: 60px; 
  align-items: start;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cart-item { 
  display: flex;
  gap: 30px; 
  padding: 24px; 
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.cart-item:hover {
  border-color: #ddd;
  box-shadow: 0 8px 30px rgba(0,0,0,0.04);
}

.item-img-wrapper {
  width: 140px;
  height: 140px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  flex-shrink: 0;
}

.item-img { 
  width: 100%; 
  height: 100%; 
  object-fit: contain; 
}

.item-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-info h4 { 
  font-weight: 900; 
  font-size: 1.3rem;
  margin: 0 0 8px 0; 
  text-transform: uppercase;
  letter-spacing: -0.5px;
}

.item-size { 
  font-size: 0.95rem; 
  color: #666; 
  margin: 0 0 12px 0; 
}

.item-size span {
  font-weight: 600;
  color: #000;
}

.remove-btn { 
  background: none; 
  border: none; 
  color: #999;
  font-size: 0.85rem; 
  font-weight: 500;
  cursor: pointer; 
  padding: 0; 
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.2s;
}

.remove-btn:hover { color: #ff3333; }

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 15px;
}

.item-qty { 
  display: flex; 
  align-items: center; 
  background: #f5f5f5; 
  border-radius: 30px;
  padding: 4px;
}

.qty-btn { 
  border: none; 
  background: #fff; 
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 600; 
  font-size: 1.2rem;
  cursor: pointer; 
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.qty-btn:hover { color: #00a8e8; transform: scale(1.05); }

.qty-value {
  width: 40px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
}

.item-price { 
  font-weight: 900; 
  font-size: 1.4rem; 
  letter-spacing: -0.5px;
}

.summary-box { 
  background: #f8f9fa; 
  padding: 35px; 
  border-radius: 16px;
  position: sticky; 
  top: 140px; 
}

.summary-box h3 { 
  font-weight: 900; 
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0;
  margin-bottom: 25px; 
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e5e5;
}

.summary-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 25px;
}

.summary-row { 
  display: flex; 
  justify-content: space-between; 
  font-size: 0.95rem;
  color: #555; 
}

.summary-row.delivery {
  padding-top: 15px;
}

.free-badge { 
  color: #fff; 
  background: #00a8e8;
  font-weight: 800; 
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.summary-total { 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  padding: 25px 0; 
  border-top: 2px solid #000; 
  border-bottom: 2px solid #000; 
  margin-bottom: 30px;
}

.total-label {
  font-weight: 800;
  font-size: 1.1rem;
}

.total-amount {
  font-weight: 900; 
  font-size: 2rem; 
  letter-spacing: -1px;
}

.checkout-btn { 
  width: 100%; 
  background: #000; 
  color: #fff; 
  border: none; 
  padding: 20px; 
  font-weight: 900; 
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer; 
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease; 
}

.checkout-btn:hover { 
  background: #00a8e8; 
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 168, 232, 0.2);
}

.btn-icon {
  font-size: 1.4rem;
  transition: transform 0.3s;
}

.checkout-btn:hover .btn-icon {
  transform: translateX(5px);
}

.secure-payment {
  text-align: center;
  font-size: 0.85rem;
  color: #666;
  margin-top: 20px;
  font-weight: 500;
}

.empty-cart { 
  text-align: center; 
  padding: 100px 20px; 
  background: #fff;
  border: 1px solid #eee;
  border-radius: 16px;
  max-width: 600px;
  margin: 40px auto;
}

.empty-cart h2 {
  font-weight: 900;
  font-size: 2rem;
  margin: 0 0 10px 0;
}

.empty-cart p { 
  font-size: 1.1rem; 
  color: #666; 
  margin-bottom: 35px; 
}

.back-shop-btn { 
  display: inline-block; 
  background: #000;
  color: #fff;
  padding: 15px 30px;
  font-weight: 800; 
  border-radius: 8px;
  text-decoration: none; 
  transition: all 0.3s;
}

.back-shop-btn:hover { 
  background: #00a8e8; 
  transform: translateY(-2px);
}

.loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff; 
  z-index: 9999; 
}

.bike-wheel {
  width: 60px;
  height: 60px;
  border: 6px solid #2c3e50; 
  border-radius: 50%;
  position: relative;
  animation: spin 1.2s linear infinite;
}

.bike-wheel::before {
  content: '';
  position: absolute;
  top: 50%; 
  left: 50%;
  width: 46px; 
  height: 46px;
  transform: translate(-50%, -50%);
  border: 3px dashed #7f8c8d; 
  border-radius: 50%;
}

.bike-wheel::after {
  content: '';
  position: absolute;
  top: 50%; 
  left: 50%;
  width: 12px; 
  height: 12px;
  background-color: rgb(17, 163, 221); 
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.loading-text {
  margin-top: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-weight: 800;
  color: #2c3e50;
  letter-spacing: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .cart-grid { grid-template-columns: 1fr; }
  .summary-box { position: static; margin-top: 40px; }
  .cart-header { flex-direction: column; gap: 5px; }
}

@media (max-width: 600px) {
  .cart-item { flex-direction: column; gap: 20px; text-align: center; align-items: center;}
  .item-actions { width: 100%; flex-direction: column; align-items: center; gap: 20px; }
  .item-img-wrapper { width: 100%; max-width: 200px; }
}
</style>