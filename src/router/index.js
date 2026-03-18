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
            path: '/creer-compte',
            name: 'creer-compte',
            component: () => import('../views/CreerCompteView.vue')
        },
        {
            path: '/velos-electriques',
            name: 'electriques',
            component: () => import('../views/ListArticle.vue'),
            props: { typeVelo: 'electrique', title: 'Vélos Électriques' } 
        },
        {
            path: '/velos',
            name: 'velos', 
            component: () => import('../views/ListArticle.vue'),
            props: { title: 'Vélos Musculaires' }
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
        },
        {
            path: '/login', // <--- Correction ici (deux 'n')
            name: 'login',
            component: () => import('../views/ConnexionView.vue') // <--- On pointe vers la vue de connexion    
        },
        {
            path: '/connexion',
            name: 'connexion-choice',
            component: () => import('../views/AuthChoiceView.vue')
        },
        {
            path: '/panier',
            name: 'CartView',
            component: () => import('../views/CartView.vue'),
        },
        {
            path: '/aide',
            name: 'Help',
            component : () => import('../views/help.vue')
        },
        {
            path: '/contact',
            name: 'contact',
            component : () => import('../views/contact.vue')
        }
    ]
})

export default router