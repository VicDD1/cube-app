<template>
    <main class="admin-page">
      <div class="admin-card">
        <header class="card-header">
          <h1>NOUVELLE SOUS-CATÉGORIE</h1>
          <div class="separator"></div>
        </header>
        
        <form @submit.prevent="handleSubmit">
          <div class="field-group">
            <label>CATÉGORIE PARENTE</label>
            <select v-model="selectedParent" required class="cube-select">
              <option value="" disabled>-- CHOISISSEZ UNE CATÉGORIE --</option>
              <option 
                v-for="cat in parentCategories" 
                :key="cat.idCategorie || cat.id_categorie" 
                :value="cat.idCategorie || cat.id_categorie"
              >
                {{ (cat.nomCategorie || cat.nom_categorie).toUpperCase() }}
              </option>
            </select>
          </div>
  
          <div class="field-group">
            <label>NOM DE LA SOUS-CATÉGORIE</label>
            <input 
              type="text" 
              v-model="newCategoryName" 
              placeholder="EX: VTT ÉLECTRIQUE" 
              required
            >
          </div>
          
          <transition name="fade">
            <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">
              {{ feedback }}
            </div>
          </transition>
          
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'ENREGISTREMENT...' : 'AJOUTER LA CATÉGORIE' }}
          </button>
        </form>
      </div>
    </main>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  const parentCategories = ref([]);
  const selectedParent = ref('');
  const newCategoryName = ref('');
  const loading = ref(false);
  const feedback = ref('');
  const isError = ref(false);
  
  // Au chargement de la page, on récupère les catégories principales (VTT, Route, etc.)
  onMounted(async () => {
    try {
      const res = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/CategorieVelo/GetMain');
      if (res.ok) {
        parentCategories.value = await res.json();
      } else {
        throw new Error("Impossible de charger les catégories.");
      }
    } catch (error) {
      console.error("Erreur API:", error);
      isError.value = true;
      feedback.value = "Erreur de connexion à la base de données.";
    }
  });
  
  const handleSubmit = async () => {
    if (loading.value) return;
    loading.value = true;
    feedback.value = "";
    isError.value = false;
  
    // Création de l'objet à envoyer. 
    // Attention: Vérifie que les noms des propriétés (catIdCategorie, nomCategorie) 
    // correspondent exactement à ce qu'attend ton API C# en entrée (ton DTO ou Modèle).
    const payload = {
      catIdCategorie: parseInt(selectedParent.value), // l'ID du parent (1, 2, 3 ou 4)
      nomCategorie: newCategoryName.value.trim()
    };
  
    try {
      const response = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/CategorieVelo/PostCategorie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error("Échec de l'ajout de la catégorie.");
      }
  
      // Succès
      isError.value = false;
      feedback.value = "SOUS-CATÉGORIE AJOUTÉE AVEC SUCCÈS !";
      
      // On vide uniquement le champ texte pour permettre d'en enchaîner plusieurs
      newCategoryName.value = '';
  
      // Fait disparaître le message de succès après 3 secondes
      setTimeout(() => {
        if (!isError.value) feedback.value = "";
      }, 3000);
  
    } catch (err) {
      isError.value = true;
      feedback.value = err.message;
      console.error("Détail erreur ajout:", err);
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  @font-face {
    font-family: 'CubeFont';
    src: url('@/assets/fonts/font.woff2') format('woff2');
  }
  
  .admin-page {
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
  
  .admin-card {
    background: #fff;
    width: 100%;
    max-width: 500px;
    padding: 40px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.1);
    border-top: 5px solid #00a8e8; /* Ligne bleue Cube */
  }
  
  .card-header h1 {
    font-size: 22px;
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
  
  .field-group {
    margin-bottom: 18px;
  }
  
  label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 6px;
    color: #555;
  }
  
  input, .cube-select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    font-family: 'CubeFont', sans-serif;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
    background: #fcfcfc;
  }
  
  input:focus, .cube-select:focus {
    border-color: #00a8e8;
    background: #fff;
  }
  
  /* Style spécifique pour masquer la flèche par défaut du select et en faire une plus "carrée" si besoin */
  .cube-select {
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
  }
  
  .submit-btn {
    width: 100%;
    padding: 16px;
    background-color: #000;
    color: #fff;
    border: none;
    font-family: 'CubeFont', sans-serif;
    font-weight: 800;
    font-style: italic;
    cursor: pointer;
    margin-top: 10px;
    transition: background-color 0.3s ease;
  }
  
  .submit-btn:hover:not(:disabled) {
    background-color: #00a8e8;
  }
  
  .submit-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .message {
    margin-bottom: 20px;
    padding: 12px;
    font-size: 12px;
    text-align: center;
    font-weight: 800;
  }
  
  .error { 
    background-color: #fee2e2; 
    color: #dc2626; 
    border: 1px solid #dc2626; 
  }
  
  .success { 
    background-color: #ecfdf5; 
    color: #059669; 
    border: 1px solid #059669; 
  }
  
  .fade-enter-active, .fade-leave-active { 
    transition: opacity 0.4s; 
  }
  
  .fade-enter-from, .fade-leave-to { 
    opacity: 0; 
  }
  
  @media (max-width: 480px) {
    .admin-card {
      padding: 25px;
      width: 95%;
    }
  }
  </style>