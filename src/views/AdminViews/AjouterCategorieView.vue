<template>
  <main class="admin-page">
    <div class="admin-card">
      
      <button type="button" class="back-btn" @click="goBack">
        ← RETOUR À L'ESPACE COMMERCIAL
      </button>

      <header class="card-header">
        <h1>NOUVELLE CATÉGORIE</h1>
        <div class="separator"></div>
      </header>
      
      <form @submit.prevent="handleSubmit">
        
        <div class="field-group">
          <label>TYPE DE CATÉGORIE</label>
          <div class="radio-container">
            <label class="radio-label">
              <input type="radio" v-model="categoryType" value="main">
              CATÉGORIE PRINCIPALE
            </label>
            <label class="radio-label">
              <input type="radio" v-model="categoryType" value="sub">
              SOUS-CATÉGORIE
            </label>
          </div>
        </div>

        <div class="field-group" v-if="categoryType === 'sub'">
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
          <label>NOM DE LA CATÉGORIE</label>
          <input 
            type="text" 
            v-model="newCategoryName" 
            :placeholder="categoryType === 'main' ? 'EX: ENFANT' : 'EX: VTT ÉLECTRIQUE'" 
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
import { useRouter } from 'vue-router';

const router = useRouter();


const categoryType = ref('sub'); 
const parentCategories = ref([]);
const selectedParent = ref('');
const newCategoryName = ref('');
const loading = ref(false);
const feedback = ref('');
const isError = ref(false);

const goBack = () => {
  router.push('/espace-commercial');
};


const fetchMainCategories = async () => {
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
};


onMounted(() => {
  fetchMainCategories();
});

const handleSubmit = async () => {
  if (loading.value) return;
  loading.value = true;
  feedback.value = "";
  isError.value = false;

  
  
  const payload = {
    nomCategorie: newCategoryName.value.trim(),
    catIdCategorie: categoryType.value === 'main' ? null : parseInt(selectedParent.value)
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

    isError.value = false;
    feedback.value = categoryType.value === 'main' 
      ? "CATÉGORIE PRINCIPALE AJOUTÉE AVEC SUCCÈS !" 
      : "SOUS-CATÉGORIE AJOUTÉE AVEC SUCCÈS !";
    
    
    newCategoryName.value = '';
    
    
    if (categoryType.value === 'main') {
      await fetchMainCategories();
    }

    
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
  border-top: 5px solid #00a8e8;
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  color: #777;
  font-family: 'CubeFont', sans-serif;
  font-weight: 800;
  font-size: 11px;
  cursor: pointer;
  margin-bottom: 25px;
  padding: 0;
  display: inline-block;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: #00a8e8;
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


.radio-container {
  display: flex;
  gap: 20px;
  margin-top: 5px;
  margin-bottom: 10px;
}

.radio-label {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #000;
  cursor: pointer;
  text-transform: none;
}

.radio-label input[type="radio"] {
  width: auto;
  margin-right: 8px;
  accent-color: #00a8e8; 
  cursor: pointer;
}


label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  margin-bottom: 6px;
  color: #555;
}

input[type="text"], .cube-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  font-family: 'CubeFont', sans-serif;
  font-size: 13px;
  box-sizing: border-box;
  outline: none;
  background: #fcfcfc;
}

input[type="text"]:focus, .cube-select:focus {
  border-color: #00a8e8;
  background: #fff;
}

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
  .radio-container {
    flex-direction: column;
    gap: 10px;
  }
}
</style>