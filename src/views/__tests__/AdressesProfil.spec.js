import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdressesProfil from '../AdressesProfil.vue'

vi.mock('../../stores/useStore', () => ({
  useAppStore: () => ({
    user: { idClient: 1, prenomClient: 'Jean', nomClient: 'Dupont' }
  })
}))

global.fetch = vi.fn()

describe('AdressesProfil.vue', () => {
  beforeEach(() => {
    fetch.mockReset()
  })

  it('affiche le message de chargement au démarrage', () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}))
    const wrapper = mount(AdressesProfil)
    expect(wrapper.text()).toContain('CARNET D\'ADRESSES')
    expect(wrapper.text()).toContain('Chargement de vos adresses...')
  })

  it('ouvre la modale lors du clic sur le bouton d\'ajout', async () => {
    fetch.mockResolvedValue({ 
      ok: true, 
      json: () => Promise.resolve([]) 
    })
    const wrapper = mount(AdressesProfil)
    await new Promise(resolve => setTimeout(resolve, 0))

    const addButton = wrapper.find('.add-new-card')
    await addButton.trigger('click')
    
    expect(wrapper.text()).toContain('NOUVELLE ADRESSE DE LIVRAISON')
  })
})