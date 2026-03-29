import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // --- ÉTATS ---
  const magasinChoisi = ref(null)
  const isConnected = ref(false) 
  const user = ref(null)
  const chatMessages = ref([{ role: 'bot', text: 'Bonjour ! Comment puis-je vous aider ?' }])
  const cartItemCount = ref(0) 
  
  // Correction ici : Initialisation du tracker d'activité
  const activityLog = ref([]) 

  // --- ACTIONS ---
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

  function addChatMessage(message) {
    chatMessages.value.push(message)
    sessionStorage.setItem('chat_history', JSON.stringify(chatMessages.value))
  }

  // Chargement des données au démarrage de l'app
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

    // Récupération des logs d'activité pour éviter l'erreur undefined
    const savedLog = localStorage.getItem('cube_activity_log')
    if (savedLog) {
      try {
        activityLog.value = JSON.parse(savedLog)
      } catch (e) {
        activityLog.value = []
      }
    }
  }

  // Recalcul du panier (API)
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
    activityLog, // Ne pas oublier de l'exposer ici !
    setMagasin, 
    login, 
    logout, 
    addChatMessage,
    loadPersistedStore,
    updateCartCount
  }
})