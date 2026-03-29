import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const magasinChoisi = ref(null)
  const isConnected = ref(false) 
  const user = ref(null)
  
  // Nouvelle variable pour la pastille
  const cartItemCount = ref(0) 

  function setMagasin(magasin) {
    magasinChoisi.value = magasin
    localStorage.setItem('selectedStore', JSON.stringify(magasin))
  }

  function login(userData) {
    isConnected.value = true
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function logout() {
    isConnected.value = false 
    user.value = null
    cartItemCount.value = 0 
    magasinChoisi.value = null 
    localStorage.removeItem('user')
    localStorage.removeItem('selectedStore') 
  }

  function loadPersistedStore() {
    const savedStore = localStorage.getItem('selectedStore')
    if (savedStore) magasinChoisi.value = JSON.parse(savedStore)
    
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
      isConnected.value = true
    }
  }

  // Nouvelle action pour recalculer le nombre d'articles
  async function updateCartCount(idClient = null) {
    if (!idClient) {
      const localCart = JSON.parse(localStorage.getItem('panierVisiteur'))
      cartItemCount.value = localCart?.lignePaniers?.length || 0
    } else {
      try {
        const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Panier/GetActiveCart/${idClient}`)
        if (res.ok) {
          const data = await res.json()
          const detailsRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Panier/GetDetails/${data.idPanier}`)
          const detailsData = await detailsRes.json()
          cartItemCount.value = detailsData.lignePaniers?.length || 0
        } else {
          cartItemCount.value = 0
        }
      } catch (e) {
        cartItemCount.value = 0
      }
    }
  }

  return { 
    magasinChoisi, 
    isConnected, 
    user, 
    cartItemCount,
    setMagasin, 
    login, 
    logout, 
    loadPersistedStore,
    updateCartCount
  }
})