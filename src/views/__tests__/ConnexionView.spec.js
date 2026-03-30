import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConnexionView from '../ConnexionView.vue'

// 1. Simulation du routeur
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

// 2. Simulation du store
const loginMock = vi.fn()
vi.mock('../../stores/useStore', () => ({
  useAppStore: () => ({ login: loginMock })
}))

// 3. Simulation de la librairie Google SignIn
vi.mock('vue3-google-signin', () => ({
  GoogleSignInButton: { template: '<div>Mock Google Button</div>' },
  decodeCredential: vi.fn()
}))

// 4. Simulation de l'API globale
global.fetch = vi.fn()

describe('ConnexionView.vue', () => {
  
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockReset()
  })

  it('affiche correctement le formulaire', () => {
    const wrapper = mount(ConnexionView)
    
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('CONNEXION')
  })

  it('masque et affiche le mot de passe au clic sur le bouton', async () => {
    const wrapper = mount(ConnexionView)
    const passwordInput = wrapper.find('input[placeholder="••••••••"]')
    const toggleBtn = wrapper.find('.toggle-btn')

    // Par défaut, le type est 'password'
    expect(passwordInput.attributes('type')).toBe('password')
    
    // Au clic, il devient 'text'
    await toggleBtn.trigger('click')
    expect(passwordInput.attributes('type')).toBe('text')
  })

  it('affiche un message d\'erreur si les identifiants sont invalides', async () => {
    // On simule une erreur 401 ou 400 de l'API
    fetch.mockResolvedValueOnce({ 
      ok: false, 
      text: () => Promise.resolve('Identifiants incorrects') 
    })
    
    const wrapper = mount(ConnexionView)
    
    // Remplissage du formulaire
    await wrapper.find('input[type="email"]').setValue('test@cube.com')
    await wrapper.find('input[placeholder="••••••••"]').setValue('mauvais_mdp')
    
    // Soumission
    await wrapper.find('form').trigger('submit.prevent')
    
    // On attend que la promesse fetch se résolve
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('IDENTIFIANTS INCORRECTS')
    expect(loginMock).not.toHaveBeenCalled()
  })
})