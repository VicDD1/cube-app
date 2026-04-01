import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfileDashBoard from '../ProfileDashBoard.vue'

// 1. Simulation du store Pinia avec un utilisateur factice
vi.mock('../../stores/useStore', () => ({
  useAppStore: () => ({
    user: {
      nomClient: 'TESTEUR',
      prenomClient: 'Jean',
      emailClient: 'jean.testeur@cube.com'
    }
  })
}))

describe('ProfileDashBoard.vue', () => {
  
  // Configuration pour simuler les liens du routeur
  const globalConfig = {
    stubs: ['router-link']
  }

  it('affiche correctement les informations personnelles de l\'utilisateur', () => {
    const wrapper = mount(ProfileDashBoard, { global: globalConfig })

    // On s'assure que le composant récupère et affiche bien les données du mock
    expect(wrapper.text()).toContain('MON PROFIL')
    expect(wrapper.text()).toContain('Jean TESTEUR')
    expect(wrapper.text()).toContain('jean.testeur@cube.com')
  })

  it('propose bien tous les liens de navigation du tableau de bord', () => {
    const wrapper = mount(ProfileDashBoard, { global: globalConfig })

    // On récupère tous les liens simulés
    const links = wrapper.findAll('router-link-stub')

    // On vérifie la présence et la bonne destination de vos 3 liens
    expect(links.length).toBe(3)
    expect(links[0].attributes('to')).toBe('/profil/infos')
    expect(links[1].attributes('to')).toBe('/profil/commandes')
    expect(links[2].attributes('to')).toBe('/profil/adresses')
  })
})