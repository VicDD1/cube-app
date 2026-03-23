// src/composables/useCookies.js
import { reactive, readonly } from 'vue'

const STORAGE_KEY = 'cube_cookie_consent'

const state = reactive({
  isVisible: false,
  isConfigured: false,
  categories: {
    necessary: {
      id: 'necessary',
      name: 'Nécessaires',
      required: true,
      status: 'accepted',
      description: 'Cookies indispensables au bon fonctionnement technique du site (panier, session). Ils ne peuvent pas être désactivés.',
      subCookies: [
        { id: 'session', name: 'Cookies techniques (Session, Sécurité)', status: 'accepted' }
      ]
    },
    audience: {
      id: 'audience',
      name: 'Mesure d\'audience',
      required: false,
      status: 'pending', // 'accepted', 'refused', 'pending', 'mixed'
      description: 'Nous comptabilisons les visites pour améliorer l\'expérience utilisateur.',
      subCookies: [
        { id: 'analytics', name: 'Statistiques de visite anonymes', status: 'pending' },
        { id: 'heatmap', name: 'Analyse comportementale', status: 'pending' }
      ]
    }
  }
})

export function useCookies() {
  const init = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Fusionne la sauvegarde avec l'état actuel
      Object.keys(parsed).forEach(key => {
        if (state.categories[key]) {
          state.categories[key].status = parsed[key].status
          state.categories[key].subCookies.forEach((sub, index) => {
             if (parsed[key].subCookies[index]) {
                 sub.status = parsed[key].subCookies[index].status
             }
          })
        }
      })
      state.isConfigured = true
    } else {
      state.isVisible = true
    }
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.categories))
    state.isVisible = false
    state.isConfigured = true
    // Ici tu pourrais déclencher un EventBus ou exécuter les scripts tiers (GTM, etc.)
  }

  const acceptAll = () => {
    Object.values(state.categories).forEach(cat => {
      cat.status = 'accepted'
      cat.subCookies.forEach(sub => sub.status = 'accepted')
    })
    save()
  }

  const refuseAll = () => {
    Object.values(state.categories).forEach(cat => {
      if (!cat.required) {
        cat.status = 'refused'
        cat.subCookies.forEach(sub => sub.status = 'refused')
      }
    })
    save()
  }

  const updateCategory = (categoryId, status) => {
    const cat = state.categories[categoryId]
    if (cat.required) return
    cat.status = status
    cat.subCookies.forEach(sub => sub.status = status)
  }

  const updateSubCookie = (categoryId, subId, status) => {
    const cat = state.categories[categoryId]
    const sub = cat.subCookies.find(s => s.id === subId)
    sub.status = status

    // Vérifie si tous les enfants ont le même statut
    const allAccepted = cat.subCookies.every(s => s.status === 'accepted')
    const allRefused = cat.subCookies.every(s => s.status === 'refused')

    if (allAccepted) cat.status = 'accepted'
    else if (allRefused) cat.status = 'refused'
    else cat.status = 'mixed'
  }

  return {
    state: readonly(state),
    init,
    save,
    acceptAll,
    refuseAll,
    updateCategory,
    updateSubCookie
  }
}