<template>
  <header class="cube-header">
    <div class="main-nav">
      
      <div class="logo">
        <router-link to="/">
          <img src="@/assets/images/logo-cube-blanc.png" alt="CUBE" class="logo-img" />
        </router-link>
      </div>

      <nav class="nav-links">
        <router-link to="/velos">VÉLOS</router-link>
        <router-link to="/velos-electriques">VÉLOS ÉLECTRIQUES</router-link>
        <router-link to="/equipements">ÉQUIPEMENTS</router-link>
        <router-link to="/accessoires">ACCESSOIRES</router-link>
        <router-link to="/communaute">COMMUNAUTÉ</router-link>
        <router-link to="/promos">PROMOS</router-link>
      </nav>

      <div class="nav-actions">
        <a href="#" class="shop-link">
          CHOISIR UN MAGASIN <Store :size="18" :stroke-width="2" />
        </a>
        <router-link to="/connexion" class="icon-btn">
          <User :size="20" :stroke-width="2" />
        </router-link>
        <div class="cart-container">
          <button class="icon-btn"><ShoppingCart :size="20" :stroke-width="2" /></button>
          <span class="cart-badge">0</span>
        </div>
      </div>

    </div>
  </header>
</template>

<script setup>
import { Store, Search, User, ShoppingCart } from 'lucide-vue-next'
</script>

<style scoped>
.cube-header {
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 100;
  font-family: Arial, sans-serif;
}

.main-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25px 40px; 
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.main-nav:hover {
  background-color: #fff;
  border-bottom: 1px solid #eaeaea;
}

.nav-links {
  display: flex;
  gap: 25px;
}

.nav-links a, .shop-link, .icon-btn {
  text-decoration: none;
  color: #fff;
  font-weight: 800;
  font-style: italic;
  transition: color 0.3s ease;
}

.nav-links a {
  font-size: 14px;
  letter-spacing: 0.5px;
}

.shop-link {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.main-nav:hover .nav-links a,
.main-nav:hover .shop-link,
.main-nav:hover .icon-btn {
  color: #000;
}

.nav-links a:hover, .shop-link:hover, .icon-btn:hover {
  color: #666 !important;
}

.logo-img {
  height: 35px; 
  transition: filter 0.3s ease;
}

.main-nav:hover {
  border-bottom: 1px solid #eaeaea;
}

.main-nav:hover .logo-img {
  filter: invert(100%); 
}

.cart-container {
  position: relative;
  display: flex;
  align-items: center;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #00a8e8;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 10px;
}
</style>