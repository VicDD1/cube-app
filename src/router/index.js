import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/produits',
            name: 'products',
          // Chargement différé (Lazy-loading) pour plus de performance
            component: () => import('../views/ProductsView.vue')
        },
        // router/index.js
        {
            path: '/velos-electriques',
            name: 'electriques',
            component: () => import('../views/ListArticle.vue'),
            // On passe le mot exact présent dans ton JSON
            props: { typeRecherche: 'electrique', title: 'Vélos Électriques' } 
        },
        {
            path: '/velos',
            name: 'musculaires',
            component: () => import('../views/ListArticle.vue'),
            // On passe le mot exact présent dans ton JSON
            props: { typeRecherche: 'musculaire', title: 'Vélos Musculaires' }
        }

    ]
})

export default router