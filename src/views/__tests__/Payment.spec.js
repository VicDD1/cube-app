import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Payment from '../Payment.vue'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

vi.mock('../../stores/useStore', () => ({
  useAppStore: () => ({
    user: { idClient: 1, prenomClient: 'Jean', nomClient: 'Dupont' }
  })
}))

vi.mock('@paypal/paypal-js', () => ({
  loadScript: vi.fn().mockResolvedValue({
    Buttons: () => ({ render: vi.fn() })
  })
}))

global.fetch = vi.fn()
Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true
})

describe('Payment.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockReset()
    window.location.href = ''
  })

  it('affiche l\'état de chargement initialement', () => {
    fetch.mockImplementation(() => new Promise(() => {}))
    const wrapper = mount(Payment)
    expect(wrapper.text()).toContain('Préparation de la commande...')
  })

  it('calcule et affiche le résumé du panier correctement', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('GetActiveCart')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ idPanier: 1 }) })
      if (url.includes('GetDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ lignePaniers: [{ reference: 'V1', quantiteSelectionnee: 2 }] }) })
      if (url.includes('GetArticleDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ nomArticle: 'Vélo', prix: 1500 }) }) 
      if (url.includes('GetAdressesLivraison')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    const wrapper = mount(Payment)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text().replace(/\s/g, '')).toContain('3000') 
    expect(wrapper.text()).toContain('FINALISER LA COMMANDE')
  })

  it('ouvre la modale de paiement au clic sur le bouton', async () => {
    fetch.mockImplementation((url) => {
      // On simule un panier PLEIN et on renvoie une adresse
      if (url.includes('GetActiveCart')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ idPanier: 1 }) })
      if (url.includes('GetDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ lignePaniers: [{ reference: 'V1', quantiteSelectionnee: 1 }] }) })
      if (url.includes('GetArticleDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ nomArticle: 'Vélo', prix: 1500 }) }) 
      if (url.toLowerCase().includes('adresse')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ idAdresse: 1, rue: '10 rue de la Paix', ville: 'Paris' }]) })
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    
    const wrapper = mount(Payment)
    await new Promise(resolve => setTimeout(resolve, 0)) // Laisse le composant charger les données

    await wrapper.find('.pay-btn').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0)) // Laisse la modale s'ouvrir

    expect(wrapper.text()).toContain('PAIEMENT SÉCURISÉ')
    expect(wrapper.find('.stripe-btn').exists()).toBe(true)
  })

  it('redirige vers l\'URL de Stripe lors de la sélection de ce moyen de paiement', async () => {
    fetch.mockImplementation((url) => {
      // On simule un panier PLEIN et on renvoie une adresse
      if (url.includes('GetActiveCart')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ idPanier: 1 }) })
      if (url.includes('GetDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ lignePaniers: [{ reference: 'V1', quantiteSelectionnee: 1 }] }) })
      if (url.includes('GetArticleDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ nomArticle: 'Vélo', prix: 1500 }) }) 
      if (url.toLowerCase().includes('adresse')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ idAdresse: 1, rue: '10 rue de la Paix', ville: 'Paris' }]) })
      
      // On simule la réponse de Stripe
      if (url.includes('create-checkout-session')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ url: 'https://checkout.stripe.com/fake-url' }) })
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    
    const wrapper = mount(Payment)
    await new Promise(resolve => setTimeout(resolve, 0))

    await wrapper.find('.pay-btn').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0)) 
    
    await wrapper.find('.stripe-btn').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(window.location.href).toBe('https://checkout.stripe.com/fake-url')
  })
})