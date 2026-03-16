import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // --- ÉTATS (ref) ---
  const magasinChoisi = ref(null)
  const isConnected = ref(false) // Assure-toi que cette ligne existe bien
  const user = ref(null)

  // --- ACTIONS (function) ---
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
    isConnected.value = true // Note : on met à false normalement ici
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

  // --- LE RETURN (CRUCIAL) ---
  // Si 'isConnected' n'est pas ici, le Header plantera
  return { 
    magasinChoisi, 
    isConnected, 
    user, 
    setMagasin, 
    login, 
    logout, 
    loadPersistedStore 
  }
})