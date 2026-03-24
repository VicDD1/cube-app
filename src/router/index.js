import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAppStore } from '@/stores/useStore';

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
            component: () => import('../views/CreateAcomptView.vue')
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
        },
        {
            path: '/espace-commercial',
            name: 'commercial',
            component: () => import('../views/AdminViews/CommercialView.vue'),
            meta: { 
                requiresAuth: true, 
                requiresRole: 'commercial' 
            }
        },
        {
            path: '/espace-commercial/ajouter-categorie',
            name: 'ajouter-categorie',
            component: () => import('../views/AdminViews/AjouterCategorieView.vue'),
            meta: { 
                requiresAuth: true, 
                requiresRole: 'commercial' 
            }
        },
        {
            path: '/espace-commercial/ajouter-modele',
            name: 'ajouter-modele',
            component: () => import('../views/AdminViews/AjouterModeleView.vue'),
            meta: { 
                requiresAuth: true, 
                requiresRole: 'commercial' 
            }
        },
        {
            path: '/espace-commercial/ajouter-variante',
            name: 'ajouter-variante',
            component: () => import('../views/AdminViews/AjouterVarianteView.vue'),
            meta: { 
                requiresAuth: true, 
                requiresRole: 'commercial' 
            }
        },
        {
            path: '/espace-commercial/modifier-variante',
            name: 'modifier-variante',
            component: () => import('../views/AdminViews/ModifierVarianteView.vue'),
            meta: { 
                requiresAuth: true, 
                requiresRole: 'commercial' 
            }
        },
        {
            path: '/profile',
            component: () => import('../views/ProfileView.vue'), 
            children: [
                { path: '', name: 'dashboard', component: () => import('../components/ProfileDashBoard.vue') },
                // { path: 'infos', name: 'profile-infos', component: () => import('../components/InfosProfil.vue') },
                // { path: 'commandes', name: 'profile-orders', component: () => import('../components/CommandesProfil.vue') },
                // { path: 'adresses', name: 'profile-addresses', component: () => import('../components/AdressesProfil.vue') },
                // { path: 'velos', name: 'profile-bikes', component: () => import('../components/VelosProfil.vue') },
            ]
        },
        {
            path: '/paiement',
            name: 'Paiement',
            component: () => import('../views/Payment.vue'),
        },
        {
            path: '/confirmation',
            name: 'confirmation',
            component: () => import('../views/confirmation.vue')
        }
    ]
})

// LE VIDEUR DE L'APPLICATION
router.beforeEach((to, from, next) => {
    const store = useAppStore()
    
    if (!store.isConnected && localStorage.getItem('user')) {
        store.loadPersistedStore()
    }

    if (to.meta.requiresAuth) {
        if (!store.isConnected) {
            return next('/connexion') 
        }
        if (to.meta.requiresRole) {
            if (store.user?.role !== to.meta.requiresRole) {
                return next('/') 
            }
        }
    }
    
    next()
})

export default router