import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthChoiceView from '../AuthChoiceView.vue'

describe('AuthChoiceView.vue', () => {
  
  // On prépare une configuration pour simuler les balises <router-link> (stubs)
  const globalConfig = {
    stubs: ['router-link']
  }

  it('s\'affiche correctement avec le titre principal', () => {
    const wrapper = mount(AuthChoiceView, { global: globalConfig })
    
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain("REJOIGNEZ L'AVENTURE CUBE")
  })

  it('propose bien les deux cartes d\'options', () => {
    const wrapper = mount(AuthChoiceView, { global: globalConfig })
    
    expect(wrapper.text()).toContain('DÉJÀ CLIENT ?')
    expect(wrapper.text()).toContain('NOUVEAU ICI ?')
  })

  it('pointe vers les bonnes routes de navigation', () => {
    const wrapper = mount(AuthChoiceView, { global: globalConfig })
    
    // Vue Test Utils transforme les <router-link> en <router-link-stub>
    const links = wrapper.findAll('router-link-stub')
    
    expect(links.length).toBe(2)
    expect(links[0].attributes('to')).toBe('/login')
    expect(links[1].attributes('to')).toBe('/creer-compte')
  })
})