<template>
    <main class="commercial-page">
      <div class="dashboard-card">
        <header class="card-header">
          <h1>ESPACE COMMERCIAL</h1>
          <div class="separator"></div>
          <p class="welcome-text">
            Bienvenue <strong>{{ store.user?.prenom_client }} {{ store.user?.nom_client }}</strong>
          </p>
        </header>
  
        <div class="button-grid">
          
          <button class="action-btn active-btn" @click="goToAddCategory">
            AJOUTER UNE CATÉGORIE
          </button>
          
          <button class="action-btn active-btn" @click="goToAddModele">
            CRÉER UN MODÈLE
          </button>

          <button class="action-btn active-btn" @click="goToAddVariante">
            CRÉER UNE VARIANTE
          </button>

          <button class="action-btn active-btn" @click="goToModifyVariante">
            GÉRER STOCKS & INFOS
          </button>
        </div>
      </div>
    </main>
  </template>
  
  <script setup>
    import { useAppStore } from '@/stores/useStore';
    import { useRouter } from 'vue-router';

    const store = useAppStore();
    const router = useRouter();

    const goToAddCategory = () => {
    router.push('/espace-commercial/ajouter-categorie');
    };

    const goToAddModele = () => {
      router.push('/espace-commercial/ajouter-modele');
    };

    const goToAddVariante = () => {
      router.push('/espace-commercial/ajouter-variante');
    };

    const goToModifyVariante = () => {
      router.push('/espace-commercial/modifier-variante');
    };
  </script>
  
  <style scoped>
  @font-face {
    font-family: 'CubeFont';
    src: url('@/assets/fonts/font.woff2') format('woff2');
  }
  
  .commercial-page {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 140px; 
    padding-bottom: 60px; 
    background-color: #f4f4f4;
    font-family: 'CubeFont', sans-serif;
    box-sizing: border-box;
  }
  
  .dashboard-card {
    background: #fff;
    width: 100%;
    max-width: 800px;
    padding: 40px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    border-top: 5px solid #00a8e8;
  }
  
  .card-header h1 {
    font-size: 26px;
    font-weight: 800;
    font-style: italic;
    margin: 0;
    text-align: center;
  }
  
  .separator {
    width: 40px;
    height: 4px;
    background: #000;
    margin: 15px auto 30px auto;
  }
  
  .welcome-text {
    text-align: center;
    font-size: 14px;
    margin-bottom: 40px;
    color: #555;
  }
  
  .button-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .action-btn {
    padding: 20px;
    background-color: #fcfcfc;
    color: #999;
    border: 1px solid #ddd;
    font-family: 'CubeFont', sans-serif;
    font-weight: 800;
    font-style: italic;
    font-size: 14px;
    cursor: not-allowed;
    transition: all 0.3s ease;
  }
  
  .active-btn {
  color: #000;
  border-color: #000;
  cursor: pointer;
  background-color: #fff;
}

.active-btn:hover {
  background-color: #00a8e8;
  color: #fff;
  border-color: #00a8e8;
}
  
  @media (max-width: 600px) {
    .button-grid {
      grid-template-columns: 1fr;
    }
    .dashboard-card {
      padding: 25px;
      width: 95%;
    }
  }
  </style>