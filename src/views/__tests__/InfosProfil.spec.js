import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InfosProfil from '../InfosProfil.vue'

const mockAppStore = {
  user: {
    idClient: 1,
    nomClient: 'DUPONT',
    prenomClient: 'Jean',
    emailClient: 'jean@cube.com',
    dateNaissance: '1990-01-01T00:00:00Z',
    tel: '0612345678'
  }
}
vi.mock('../../stores/useStore', () => ({
  useAppStore: () => mockAppStore
}))

global.fetch = vi.fn()
const setItemMock = vi.spyOn(Storage.prototype, 'setItem')

describe('InfosProfil.vue', () => {
  beforeEach(() => {
    fetch.mockReset()
    setItemMock.mockClear()
  })

  it('pré-remplit le formulaire avec les données de l\'utilisateur au montage', async () => {
    const wrapper = mount(InfosProfil)
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.find('input[type="email"]').element.value).toBe('jean@cube.com')
    expect(wrapper.find('input[type="tel"]').element.value).toBe('0612345678')
    expect(wrapper.find('input[type="date"]').element.value).toBe('1990-01-01')
  })

  it('affiche un message de succès après une mise à jour valide', async () => {
    fetch.mockResolvedValueOnce({ ok: true })
    const wrapper = mount(InfosProfil)
    await new Promise(resolve => setTimeout(resolve, 0))

    await wrapper.find('input[type="text"]').setValue('Paul')
    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('Vos informations ont été mises à jour avec succès')
    expect(setItemMock).toHaveBeenCalled()
  })

  it('affiche une erreur si l\'API refuse la mise à jour', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    const wrapper = mount(InfosProfil)
    await new Promise(resolve => setTimeout(resolve, 0))

    await wrapper.find('form').trigger('submit.prevent')
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('Erreur lors de la mise à jour.')
  })
})