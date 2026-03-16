import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // État global
  const magasinChoisi = ref(null)

  // Action pour modifier le magasin depuis n'importe où
  function setMagasin(magasin) {
    magasinChoisi.value = magasin
    // Optionnel : Sauvegarder dans le localStorage pour garder le choix au rafraîchissement
    localStorage.setItem('selectedStore', JSON.stringify(magasin))
  }

  // Optionnel : Charger le magasin au démarrage
  function loadPersistedStore() {
    const saved = localStorage.getItem('selectedStore')
    if (saved) magasinChoisi.value = JSON.parse(saved)
  }

  return { magasinChoisi, setMagasin, loadPersistedStore }
})