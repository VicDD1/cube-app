import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ListArticle from '../ListArticle.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} })
}))

const CardArticleStub = { template: '<div class="card-stub">Article</div>' }
global.fetch = vi.fn()

describe('ListArticle.vue', () => {
  beforeEach(() => {
    fetch.mockReset()
  })

  it('affiche le loader au démarrage', () => {
    fetch.mockImplementation(() => new Promise(() => {}))
    const wrapper = mount(ListArticle, {
      props: { typeArticle: 'Vélos', title: 'Vélos' },
      global: { stubs: { CardArticle: CardArticleStub } }
    })
    expect(wrapper.text()).toContain('Chargement des produits...')
  })

  it('affiche la liste des articles une fois chargés', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ $values: [] }) })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        $values: [
          { reference: 'V1', nom: 'Velo Cool', prix: 1000, idModeleNavigation: { typeVelo: 'vélos' } },
          { reference: 'V2', nom: 'Velo Rapide', prix: 2000, idModeleNavigation: { typeVelo: 'vélos' } }
        ]
      })
    })

    const wrapper = mount(ListArticle, {
      props: { typeArticle: 'Vélos', title: 'Vélos' },
      global: { stubs: { CardArticle: CardArticleStub } }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).not.toContain('Chargement des produits...')
    expect(wrapper.text()).toContain('2 modèles')
  })

  it('filtre dynamiquement les articles avec la barre de recherche', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { reference: 'V1', nom: 'Velo Bleu', prix: 1000, idModeleNavigation: { typeVelo: 'vélos' } },
        { reference: 'V2', nom: 'Velo Rouge', prix: 2000, idModeleNavigation: { typeVelo: 'vélos' } }
      ])
    })

    const wrapper = mount(ListArticle, {
      props: { typeArticle: 'Vélos', title: 'Vélos' },
      global: { stubs: { CardArticle: CardArticleStub } }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    const searchInput = wrapper.find('input.search-input-top')
    await searchInput.setValue('Rouge')

    expect(wrapper.text()).toContain('1 modèles')
  })
})