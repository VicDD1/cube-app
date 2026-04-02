import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateAcomptView from '../CreateAcomptView.vue'

// 1. Simulation du Router
const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

// 2. Simulation de Google SignIn
vi.mock('vue3-google-signin', () => ({
  GoogleSignInButton: { template: '<div>Mock Google</div>' },
  decodeCredential: vi.fn()
}))

// 3. Simulation d'EmailJS
vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn().mockResolvedValue('Success') }
}))

// 4. Simulation GLOBALE de votre composable de validation
const mockValidateRegistration = vi.fn()
vi.mock('@/composables/useValidation', () => ({
  useValidation: () => ({
    errors: {}, // On simule un objet d'erreurs vide par défaut
    validateRegistration: mockValidateRegistration
  })
}))

// 5. Simulation de l'API globale
global.fetch = vi.fn()

describe('CreateAcomptView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockReset()
    mockValidateRegistration.mockReset()
  })

  it('affiche correctement la première étape du formulaire', () => {
    const wrapper = mount(CreateAcomptView)
    expect(wrapper.text()).toContain('CRÉER UN COMPTE')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('bloque la soumission si le formulaire est invalide (ex: mots de passe différents)', async () => {
    // On force NOTRE validateur simulé à retourner "false" (échec)
    mockValidateRegistration.mockReturnValue(false)
    
    const wrapper = mount(CreateAcomptView)
    
    // Soumission du formulaire
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(resolve => setTimeout(resolve, 0))

    // Le composant doit réagir à l'échec en affichant son message d'erreur global
    expect(wrapper.text()).toContain('VEUILLEZ CORRIGER LES ERREURS DANS LE FORMULAIRE.')
  })

  it('passe à l\'étape 2 (Vérification) après une soumission valide', async () => {
    // 1. On force la validation à réussir (contournement parfait des règles !)
    mockValidateRegistration.mockReturnValue(true)
    
    // 2. On simule la réponse de l'API (l'email n'est pas déjà utilisé)
    fetch.mockResolvedValueOnce({ ok: false, status: 404 })
    
    const wrapper = mount(CreateAcomptView)
    
    // On remplit uniquement les champs utilisés par EmailJS dans la fonction handleRegistration
    await wrapper.find('input[type="email"]').setValue('nouveau@cube.com')
    await wrapper.find('input[placeholder="JEAN"]').setValue('Jean')
    
    // Soumission du formulaire
    await wrapper.find('form').trigger('submit.prevent')
    
    // On attend que les promesses s'exécutent (Fetch + EmailJS)
    await new Promise(resolve => setTimeout(resolve, 0)) 
    await new Promise(resolve => setTimeout(resolve, 0)) 
    
    // Le composant a dû passer à l'étape 2
    expect(wrapper.text()).toContain('VÉRIFICATION')
    expect(wrapper.text()).toContain('UN CODE DE SÉCURITÉ A ÉTÉ ENVOYÉ.')
  })
})