import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VisualizeArticleView from '../VisualizeArticleView.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ params: { id: 'VELO01' } })
}))

const mockAppStore = {
  user: null, 
  magasinChoisi: { idMagasin: 1, nomMagasin: 'Annecy' },
  updateCartCount: vi.fn(),
  setMagasin: vi.fn()
}
vi.mock('../../stores/useStore', () => ({
  useAppStore: () => mockAppStore
}))

global.fetch = vi.fn()

const StoreLocatorStub = { 
  template: '<div class="store-locator-stub"></div>', 
  methods: { toggle: vi.fn() } 
}

describe('VisualizeArticleView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetch.mockReset()
    localStorage.clear()
    mockAppStore.user = null
  })

  it('affiche le loader au montage initial', () => {
    fetch.mockImplementation(() => new Promise(() => {}))
    const wrapper = mount(VisualizeArticleView, {
      global: { stubs: { StoreLocator: StoreLocatorStub, RouterLink: true } }
    })
    expect(wrapper.text()).toContain('CHARGEMENT...')
  })

  it('affiche les détails du produit une fois les données chargées', async () => {
    fetch.mockImplementation((url) => {
      if (url.includes('GetFullDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ nomArticle: 'VTT Super Cool', prix: 2500, idModele: 1 }) })
      if (url.includes('GetStock')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ articleInventaires: [{ idTaille: 1, quantiteStockEnLigne: 5, idTailleNavigation: { taille1: 'M' } }] }) })
      if (url.includes('GetDetails')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ varianteVelos: [] }) })
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    const wrapper = mount(VisualizeArticleView, {
      global: { stubs: { StoreLocator: StoreLocatorStub, RouterLink: true } }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('VTT Super Cool')
    expect(wrapper.text().replace(/\s/g, '')).toContain('2500')
  })

  it('déclenche une erreur visuelle si on interagit sans choisir de taille', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) })
    
    const wrapper = mount(VisualizeArticleView, {
      global: { stubs: { StoreLocator: StoreLocatorStub, RouterLink: true } }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    await wrapper.find('.btn-white').trigger('click')
    expect(wrapper.vm.sizeError).toBe(true)
  })
})