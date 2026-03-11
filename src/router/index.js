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
        {
            path: '/connexion',
            name: 'connexion',
          // Chargement différé (Lazy-loading) pour plus de performance
            component: () => import('../views/ConnexionView.vue')
        }
    ]
})

export default router