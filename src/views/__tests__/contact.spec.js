import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Contact from '../contact.vue'

// On simule la fonction globale fetch
global.fetch = vi.fn()

describe('contact.vue', () => {
  
  beforeEach(() => {
    fetch.mockReset()
  })

  it('affiche le formulaire et les coordonnées au chargement', () => {
    const wrapper = mount(Contact)
    
    // Vérification de la présence des sections
    expect(wrapper.text()).toContain('CONTACTEZ-NOUS')
    expect(wrapper.text()).toContain('Envoyez-nous un message')
    expect(wrapper.text()).toContain('Nos coordonnées')
    
    // Vérification de la présence des champs du formulaire
    expect(wrapper.find('input#nom').exists()).toBe(true)
    expect(wrapper.find('input#email').exists()).toBe(true)
    expect(wrapper.find('textarea#message').exists()).toBe(true)
  })

  it('affiche le message de succès après l\'envoi valide du formulaire', async () => {
    // On simule une réponse positive de Formspree
    fetch.mockResolvedValueOnce({ ok: true })
    
    const wrapper = mount(Contact)
    
    // On remplit le formulaire
    await wrapper.find('input#nom').setValue('Test User')
    await wrapper.find('input#email').setValue('test@cube.com')
    await wrapper.find('input#sujet').setValue('Question')
    await wrapper.find('textarea#message').setValue('Ceci est un test')
    
    // On simule la soumission
    await wrapper.find('form').trigger('submit.prevent')
    
    // On attend que les promesses asynchrones se terminent
    await new Promise(resolve => setTimeout(resolve, 0))
    
    // Le formulaire doit disparaître au profit du message de succès
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Message bien reçu !')
  })
})