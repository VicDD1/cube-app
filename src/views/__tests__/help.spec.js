import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Help from '../help.vue'

const globalConfig = {
  stubs: ['router-link', 'Truck', 'Ruler', 'ShieldCheck', 'ChevronDown', 'ChevronUp']
}

describe('help.vue', () => {
  it('affiche correctement le titre et les catégories', () => {
    const wrapper = mount(Help, { global: globalConfig })
    expect(wrapper.text()).toContain('AIDE & FAQ')
    expect(wrapper.text()).toContain('Livraison & Suivi')
    expect(wrapper.text()).toContain('Retours & Garantie')
  })

  it('déploie et masque la réponse au clic (mécanique accordéon)', async () => {
    const wrapper = mount(Help, { global: globalConfig })
    const firstItem = wrapper.findAll('.accordion-item')[0]
    const firstTrigger = wrapper.findAll('.accordion-trigger')[0]
    
    expect(firstItem.classes()).not.toContain('active')
    await firstTrigger.trigger('click')
    expect(firstItem.classes()).toContain('active')
    await firstTrigger.trigger('click')
    expect(firstItem.classes()).not.toContain('active')
  })

  it('ferme la question précédente si on en ouvre une nouvelle', async () => {
    const wrapper = mount(Help, { global: globalConfig })
    const items = wrapper.findAll('.accordion-item')
    const triggers = wrapper.findAll('.accordion-trigger')
    
    await triggers[0].trigger('click')
    expect(items[0].classes()).toContain('active')
    
    await triggers[1].trigger('click')
    expect(items[0].classes()).not.toContain('active')
    expect(items[1].classes()).toContain('active')
  })
})