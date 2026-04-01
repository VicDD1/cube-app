import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from '../HomeView.vue'

describe('HomeView.vue', () => {
  
  it('effectue le rendu global de la page avec succès', () => {
    const wrapper = mount(HomeView)
    expect(wrapper.exists()).toBe(true)
  })

  it('affiche correctement les grandes sections de la page', () => {
    const wrapper = mount(HomeView)
    
    // Vérification de la présence des textes clés des sections
    expect(wrapper.text()).toContain('EXPLOREZ NOS GAMMES')
    expect(wrapper.text()).toContain('ACHETEZ L’ESPRIT TRANQUILLE')
    expect(wrapper.text()).toContain('BESOIN D\'AIDE ?')
  })

  it('génère le bon nombre de diapositives dans le slider', () => {
    const wrapper = mount(HomeView)
    
    // Il y a 3 objets dans votre tableau 'slides'
    const slides = wrapper.findAll('.slide')
    expect(slides.length).toBe(3)
  })

  it('passe à la diapositive suivante lors du clic sur le bouton "suivant"', async () => {
    const wrapper = mount(HomeView)
    
    // Les boutons de navigation (0 = Précédent, 1 = Suivant)
    const buttons = wrapper.findAll('.arrow-btn')
    const nextButton = buttons[1] 
    
    // On simule le clic utilisateur
    await nextButton.trigger('click')
    
    // La deuxième diapositive doit maintenant être active
    expect(wrapper.text()).toContain('PALMARÈS EXCEPTIONNEL')
    expect(wrapper.text()).toContain('TROIS TITRES DE')
  })

  it('revient à la diapositive précédente lors du clic sur le bouton "précédent"', async () => {
    const wrapper = mount(HomeView)
    
    const buttons = wrapper.findAll('.arrow-btn')
    const prevButton = buttons[0]
    
    // En cliquant sur "précédent" depuis la slide 0, on doit passer à la dernière slide (index 2)
    await prevButton.trigger('click')
    
    expect(wrapper.text()).toContain('NOUVELLE')
    expect(wrapper.text()).toContain('COLLECTION')
  })
})