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
            component: () => import('../views/AdminViews/AjouterCategorieView.vue'), // Assure-toi que le fichier est bien dans ce dossier
            meta: { 
                requiresAuth: true, 
                requiresRole: 'commercial' 
            }
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