<script setup>
import { onMounted, ref, computed } from 'vue'

// ID client statique pour l'exemple (à remplacer par ton auth plus tard)
const idClient = ref(1) 
const cart = ref(null)
const loading = ref(true)

const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'

// Calcul du total HT/TTC
const totalCart = computed(() => {
  if (!cart.value?.lignePaniers) return 0
  return cart.value.lignePaniers.reduce((acc, item) => acc + (item.prixUnitaire * item.quantiteSelectionnee), 0)
})

const fetchCart = async () => {
  loading.value = true
  try {
    // 1. On récupère le panier actif
    const res = await fetch(`${API_BASE}/Panier/GetActiveCart/${idClient.value}`)
    if (!res.ok) throw new Error("Panier vide ou introuvable")
    const data = await res.json()
    
    // 2. On récupère les détails complets (avec les lignes)
    const detailsRes = await fetch(`${API_BASE}/Panier/GetDetails/${data.idPanier}`)
    cart.value = await detailsRes.json()
  } catch (err) {
    console.error("Erreur panier:", err)
  } finally {
    loading.value = false
  }
}

const updateQuantity = async (item, delta) => {
  const newQty = item.quantiteSelectionnee + delta
  if (newQty <= 0) return removeItem(item)

  try {
    const response = await fetch(`${API_BASE}/LignePanier/PutLignePanier/${item.idPanier}/${item.reference}/${item.tailleSelectionnee}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, quantiteSelectionnee: newQty })
    })
    if (response.ok) fetchCart()
  } catch (err) {
    console.error("Erreur update:", err)
  }
}

const removeItem = async (item) => {
  if (!confirm("Supprimer cet article ?")) return
  try {
    await fetch(`${API_BASE}/LignePanier/DeleteLignePanier/${item.idPanier}/${item.reference}/${item.tailleSelectionnee}`, {
      method: 'DELETE'
    })
    fetchCart()
  } catch (err) {
    console.error("Erreur suppression:", err)
  }
}

// Utilitaire pour l'image (même logique que ta page produit)
const getImageUrl = (ref) => {
  const folder = ref.length === 6 ? 'VELOS' : 'ACCESSOIRES'
  return new URL(`../assets/images/${folder}/${ref}/image_1.webp`, import.meta.url).href
}

onMounted(fetchCart)
</script>

<template>
  <div class="cart-page">
    <h1 class="cart-title">VOTRE PANIER <span>[{{ cart?.lignePaniers?.length || 0 }}]</span></h1>

    <div v-if="loading" class="loader">Chargement...</div>

    <div v-else-if="cart && cart.lignePaniers.length > 0" class="cart-grid">
      <div class="cart-items">
        <div v-for="item in cart.lignePaniers" :key="item.reference + item.tailleSelectionnee" class="cart-item">
          <img :src="getImageUrl(item.reference)" class="item-img" />
          
          <div class="item-info">
            <h4>{{ item.reference }}</h4>
            <p class="item-size">TAILLE: {{ item.tailleSelectionnee }}</p>
            <button @click="removeItem(item)" class="remove-btn">Supprimer</button>
          </div>

          <div class="item-qty">
            <button @click="updateQuantity(item, -1)">-</button>
            <span>{{ item.quantiteSelectionnee }}</span>
            <button @click="updateQuantity(item, 1)">+</button>
          </div>

          <div class="item-price">
            {{ (item.prixUnitaire * item.quantiteSelectionnee).toLocaleString() }} €
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-box">
          <h3>RÉSUMÉ</h3>
          <div class="summary-row">
            <span>Sous-total</span>
            <span>{{ totalCart.toLocaleString() }} €</span>
          </div>
          <div class="summary-row">
            <span>Livraison</span>
            <span class="free">OFFERTE</span>
          </div>
          <div class="summary-total">
            <span>TOTAL TTC</span>
            <span>{{ totalCart.toLocaleString() }} €</span>
          </div>
          <button class="checkout-btn">PASSER À LA CAISSE</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-cart">
      <p>Votre panier est tristement vide...</p>
      <router-link to="/" class="back-shop">RETOUR AU SHOP</router-link>
    </div>
  </div>
</template>

<style scoped>
.cart-page { max-width: 1400px; margin: 120px auto; padding: 0 40px; font-family: 'Inter', sans-serif; }
.cart-title { font-size: 3rem; font-weight: 900; font-style: italic; margin-bottom: 50px; }
.cart-title span { color: #888; font-style: normal; }

.cart-grid { display: grid; grid-template-columns: 1fr 350px; gap: 60px; }

/* Items */
.cart-item { display: grid; grid-template-columns: 120px 1fr 120px 120px; align-items: center; gap: 20px; padding: 25px 0; border-bottom: 1px solid #eee; }
.item-img { width: 100%; height: 100px; object-fit: contain; background: #f9f9f9; }
.item-info h4 { font-weight: 900; text-transform: uppercase; margin: 0; }
.item-size { font-size: 0.8rem; color: #888; margin: 5px 0; }
.remove-btn { background: none; border: none; text-decoration: underline; font-size: 0.7rem; cursor: pointer; padding: 0; }

.item-qty { display: flex; align-items: center; gap: 15px; border: 1px solid #ddd; padding: 5px; justify-content: center; }
.item-qty button { border: none; background: none; font-weight: bold; cursor: pointer; width: 25px; }
.item-price { font-weight: 900; text-align: right; font-size: 1.1rem; }

/* Summary */
.summary-box { background: #f5f5f5; padding: 30px; position: sticky; top: 120px; }
.summary-box h3 { font-weight: 900; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-weight: 600; }
.free { color: #00ff00; font-weight: 800; }
.summary-total { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 20px; border-top: 2px solid #000; font-weight: 900; font-size: 1.4rem; }

.checkout-btn { width: 100%; background: #000; color: #fff; border: none; padding: 20px; font-weight: 900; font-style: italic; margin-top: 30px; cursor: pointer; clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%); transition: 0.3s; }
.checkout-btn:hover { background: #333; transform: scale(1.03); }

.empty-cart { text-align: center; padding: 100px 0; }
.back-shop { display: inline-block; margin-top: 20px; font-weight: 900; color: #000; border-bottom: 3px solid #000; text-decoration: none; }

@media (max-width: 1000px) {
  .cart-grid { grid-template-columns: 1fr; }
}
</style>