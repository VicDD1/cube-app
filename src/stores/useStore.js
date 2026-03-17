import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // --- ÉTATS (ref) ---
  const magasinChoisi = ref(null)
  const isConnected = ref(false)
  const user = ref(null)
  const currentBikeInventory = ref(null)

  // --- ACTIONS (function) ---
  function setMagasin(magasin) {
    magasinChoisi.value = magasin
    localStorage.setItem('selectedStore', JSON.stringify(magasin))
  }

  function setCurrentBikeInventory(inventory) {
    currentBikeInventory.value = inventory
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

  function loadPersistedStore() {
    const savedStore = localStorage.getItem('selectedStore')
    if (savedStore) magasinChoisi.value = JSON.parse(savedStore)
    
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
      isConnected.value = true
    }
  }

  // Chargement automatique au lancement
  loadPersistedStore()

  // --- LE RETURN ---
  return { 
    magasinChoisi, 
    isConnected, 
    user, 
    currentBikeInventory,
    setMagasin, 
    setCurrentBikeInventory,
    login, 
    logout 
  }
})