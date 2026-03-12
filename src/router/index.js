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
            component: () => import('../views/ProductsView.vue')
        },
        {
            path: '/connexion',
            name: 'connexion',
            component: () => import('../views/ConnexionView.vue')
        },
        {
            path: '/velos-electriques',
            name: 'electriques',
            component: () => import('../views/ListArticle.vue'),
            props: { typeVelo: 'electrique', title: 'Vélos Électriques' } 
        },
        {
            path: '/velos',
            name: 'velos', // J'ai renommé en 'velos' au lieu de 'musculaires'
            component: () => import('../views/ListArticle.vue'),
            // En ne passant pas typeVelo, ListArticle affichera TOUS les vélos
            props: { title: 'Tous nos vélos' }
        },
        {
            path: '/accessoires',
            name: 'Accessoires',
            component: () => import('../views/ListArticle.vue'),
            // J'ai rajouté un title pour que ton <h1> ne soit pas vide
            props: { typeArticle: 'Accessoires', title: 'Tous nos accessoires' }
        },
        {
            path: '/produit/:id',
            name: 'visualize', 
            component: () => import('../views/VisualizeArticleView.vue'),
            props: true
        }
    ]
})

export default router