import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Confirmation from '../confirmation.vue'

// 1. On simule la navigation
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

// 2. On simule le store
const mockAppStore = { cartItemCount: 5 }
vi.mock('../../stores/useStore', () => ({
  useAppStore: () => mockAppStore
}))

describe('confirmation.vue', () => {
  
  beforeEach(() => {
    // On remet tout à zéro avant chaque test pour garder un environnement clean
    pushMock.mockClear()
    localStorage.clear()
    mockAppStore.cartItemCount = 5
  })

  it('affiche correctement le message de succès', () => {
    const wrapper = mount(Confirmation)
    expect(wrapper.text()).toContain('PAIEMENT RÉUSSI')
    expect(wrapper.text()).toContain('Nous vous remercions pour votre commande.')
  })

  it('vide le localStorage et réinitialise le store dès l\'affichage', () => {
    // On place un faux panier dans le navigateur
    localStorage.setItem('panierVisiteur', JSON.stringify([{ id: 1 }]))
    
    // Le simple fait de monter le composant doit déclencher le onMounted
    mount(Confirmation)
    
    expect(localStorage.getItem('panierVisiteur')).toBeNull()
    expect(mockAppStore.cartItemCount).toBe(0)
  })

  it('redirige vers l\'accueil au clic sur le bouton de retour', async () => {
    const wrapper = mount(Confirmation)
    
    // On simule le clic
    await wrapper.find('.home-btn').trigger('click')
    
    // On s'assure que la bonne route a été appelée
    expect(pushMock).toHaveBeenCalledWith('/')
  })
})