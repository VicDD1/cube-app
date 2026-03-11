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
        },
        // router/index.js
        {
            path: '/velos-electriques',
            name: 'electriques',
            component: () => import('../views/ListArticle.vue'),
            // On passe le mot exact présent dans ton JSON
            props: { typeVelo: 'electrique', title: 'Vélos Électriques' } 
        },
        {
            path: '/velos',
            name: 'musculaires',
            component: () => import('../views/ListArticle.vue'),
            // On passe le mot exact présent dans ton JSON
            props: { typeVelo: 'musculaire', title: 'Vélos Musculaires' }
        },
        {
            path: '/accessoires',
            name: 'Accessoires',
            component: () => import('../views/ListArticle.vue'), // Assure-toi que le fichier existe !
            props: { typeArticle: 'Accessoires'}
        },
        {
            path: '/produit/:id',
            name: 'visualize', // Le nom doit correspondre à ce qu'il y a dans CardArticle
            component: () => import('../views/VisualizeArticleView.vue'),
            props: true
        },

    ]
})

export default router