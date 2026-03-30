import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CartView from '../CartView.vue'

// 1. On simule le routeur
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

// 2. On simule le store Pinia
vi.mock('../../stores/useStore', () => ({
  useAppStore: () => ({
    user: { idClient: 1 },
    isConnected: true,
    updateCartCount: vi.fn()
  })
}))

// 3. On simule fetch globalement
global.fetch = vi.fn()

describe('CartView.vue', () => {
  
  beforeEach(() => {
    fetch.mockReset()
  })

  it('affiche le loader au montage du composant', () => {
    // On bloque la promesse fetch pour voir le loader
    fetch.mockImplementationOnce(() => new Promise(() => {}))
    
    const wrapper = mount(CartView, { global: { stubs: ['router-link'] } })
    
    expect(wrapper.text()).toContain('CHARGEMENT...')
  })

  it('affiche le message de panier vide si aucun article n\'est retourné', async () => {
    // On simule une réponse API avec un panier vide (ex: erreur 404)
    fetch.mockResolvedValueOnce({ status: 404 })
    
    const wrapper = mount(CartView, { global: { stubs: ['router-link'] } })
    
    // On attend que les promesses (le fetch) se terminent
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('Votre panier est vide')
  })

  it('calcule et affiche correctement le total avec des articles', async () => {
    // On simule un panier avec 1 article (2 quantités à 100€)
    const mockCart = {
      idPanier: 1,
      lignePaniers: [
        { reference: 'VELO01', tailleSelectionnee: 'M', quantiteSelectionnee: 2, prixUnitaire: 100 }
      ]
    }

    // Premier fetch : GetActiveCart
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ idPanier: 1 }) })
    // Deuxième fetch : GetDetails
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCart) })
    // Troisième fetch : GetArticleDetails (pour le nom et le prix)
    fetch.mockResolvedValueOnce({ 
      ok: true, 
      json: () => Promise.resolve({ nomArticle: 'VTT Super', prix: 100 }) 
    })

    const wrapper = mount(CartView, { global: { stubs: ['router-link'] } })
    await new Promise(resolve => setTimeout(resolve, 0)) // On attend le rendu

    // Le sous-total HT et TTC doit être affiché (200€)
    expect(wrapper.text()).toContain('200 €')
    expect(wrapper.text()).toContain('VTT Super')
  })
})