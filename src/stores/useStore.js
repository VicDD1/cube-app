import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const magasinChoisi = ref(null)
  const isConnected = ref(false) 
  const user = ref(null)
  const chatMessages = ref([{ role: 'bot', text: 'Bonjour ! Comment puis-je vous aider ?' }])
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
    localStorage.removeItem('user')
  }

  function addChatMessage(message) {
    chatMessages.value.push(message)
    // On utilise sessionStorage pour que la conv reste pendant la navigation
    // mais s'efface si on ferme l'onglet (plus propre pour un chat)
    sessionStorage.setItem('chat_history', JSON.stringify(chatMessages.value))
  }

  function loadPersistedStore() {
    const savedStore = localStorage.getItem('selectedStore')
    if (savedStore) magasinChoisi.value = JSON.parse(savedStore)
    
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
      isConnected.value = true
    }
    const savedChat = sessionStorage.getItem('chat_history')
    if (savedChat) {
      chatMessages.value = JSON.parse(savedChat)
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
    chatMessages,
    setMagasin, 
    login, 
    logout, 
    addChatMessage,
    loadPersistedStore,
    updateCartCount
  }
})