import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CommandesProfil from '../CommandesProfil.vue'

// 1. Simulation du store Pinia
const mockAppStore = {
  user: { idClient: 1 }
}
vi.mock('../../stores/useStore', () => ({
  useAppStore: () => mockAppStore
}))

// 2. Simulation de l'API
global.fetch = vi.fn()

describe('CommandesProfil.vue', () => {
  
  beforeEach(() => {
    fetch.mockReset()
    mockAppStore.user = { idClient: 1 } // On remet l'utilisateur par défaut
  })

  it('affiche un message si l\'utilisateur n\'est pas connecté', async () => {
    // On retire l'utilisateur du store
    mockAppStore.user = null
    
    const wrapper = mount(CommandesProfil, { global: { stubs: ['router-link'] } })
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('Utilisateur non identifié.')
  })

  it('affiche l\'état vide si aucune commande n\'est trouvée (erreur 404)', async () => {
    // L'API répond avec une 404
    fetch.mockResolvedValueOnce({ ok: false, status: 404 })
    
    const wrapper = mount(CommandesProfil, { global: { stubs: ['router-link'] } })
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('Vous n\'avez passé aucune commande')
  })

  it('affiche et formate correctement une commande reçue', async () => {
    // On simule une commande factice de l'API
    const mockCommandes = {
      $values: [
        {
          idCommande: 42,
          statutLivraison: 'expedie',
          dateCommande: '2023-10-15T10:00:00Z',
          dateLivraison: '2023-10-20T10:00:00Z',
          montantTotalCommande: 3499.99
        }
      ]
    }
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCommandes) })

    const wrapper = mount(CommandesProfil, { global: { stubs: ['router-link'] } })
    await new Promise(resolve => setTimeout(resolve, 0)) 

    // Vérification du numéro de commande paddé avec des zéros
    expect(wrapper.text()).toContain('000042')
    
    // Vérification du statut formaté
    expect(wrapper.text()).toContain('EXPÉDIÉE')
    
    // Vérification de la date formatée
    expect(wrapper.text()).toContain('15/10/2023')
    
    // Vérification du prix formaté (on check les valeurs clés pour éviter les soucis d'espaces insécables)
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('499,99')
  })
})