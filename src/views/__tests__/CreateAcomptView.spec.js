import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateAcomptView from '../CreateAcomptView.vue'

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock })
}))

vi.mock('vue3-google-signin', () => ({
  GoogleSignInButton: { template: '<div>Mock Google</div>' },
  decodeCredential: vi.fn()
}))

vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn().mockResolvedValue('Success') }
}))

global.fetch = vi.fn()

describe('CreateAcomptView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockReset()
  })

  it('affiche correctement la première étape du formulaire', () => {
    const wrapper = mount(CreateAcomptView)
    expect(wrapper.text()).toContain('CRÉER UN COMPTE')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
  })

  it('bloque la soumission si les mots de passe sont différents', async () => {
    const wrapper = mount(CreateAcomptView)
    await wrapper.find('input[type="email"]').setValue('client@cube.com')
    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0].setValue('MotDePasse123')
    await passwordInputs[1].setValue('Different456')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('LES MOTS DE PASSE NE CORRESPONDENT PAS')
  })

  it('passe à l\'étape 2 (Vérification) après une soumission valide', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404 })
    const wrapper = mount(CreateAcomptView)
    
    await wrapper.find('input[type="email"]').setValue('nouveau@cube.com')
    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0].setValue('MotDePasse123')
    await passwordInputs[1].setValue('MotDePasse123')
    
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('VÉRIFICATION')
    expect(wrapper.text()).toContain('Un code de sécurité a été envoyé')
  })
})