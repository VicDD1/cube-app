<template>
    <main class="admin-page">
      <div class="admin-card wide-card">
        
        <button type="button" class="back-btn" @click="goBack" v-if="step === 1">
          ← RETOUR À L'ESPACE COMMERCIAL
        </button>
  
        <header class="card-header">
          <h1>{{ step === 1 ? 'NOUVEAU MODÈLE' : 'GÉOMÉTRIE DU MODÈLE' }}</h1>
          <div class="separator"></div>
          <p class="step-indicator">Étape {{ step }} sur 2</p>
        </header>
        
        <form @submit.prevent="submitStep1" v-if="step === 1">
          
          <div class="form-grid">
            <div class="field-group">
              <label>NOM DU MODÈLE</label>
              <input type="text" v-model="modele.nomModele" placeholder="EX: STEREO HYBRID" required>
            </div>
  
            <div class="field-group">
              <label>MILLÉSIME</label>
              <input type="text" v-model="modele.millesimeModele" placeholder="EX: 2024" maxlength="4" required>
            </div>
  
            <div class="field-group">
              <label>CATÉGORIE</label>
              <select v-model="modele.idCategorie" required class="cube-select">
                <option value="" disabled>-- CHOISIR --</option>
                <option v-for="cat in categories" :key="cat.idCategorie" :value="cat.idCategorie">
                  {{ cat.nomCategorie.toUpperCase() }}
                </option>
              </select>
            </div>
  
            <div class="field-group">
              <label>MATÉRIAU DU CADRE</label>
              <input type="text" v-model="modele.materiauCadre" placeholder="EX: CARBONE, ALUMINIUM" required>
            </div>
          </div>
  
          <div class="field-group">
            <label>TYPE DE VÉLO</label>
            <div class="radio-container">
              <label class="radio-label">
                <input type="radio" v-model="modele.typeVelo" value="musculaire" required> MUSCULAIRE
              </label>
              <label class="radio-label">
                <input type="radio" v-model="modele.typeVelo" value="electrique" required> ÉLECTRIQUE
              </label>
            </div>
          </div>
  
          <div class="field-group">
            <label>DESCRIPTION COMPLÈTE</label>
            <textarea v-model="modele.texteDescription" rows="4" placeholder="Description détaillée du vélo..." required></textarea>
          </div>
          
          <transition name="fade">
            <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">{{ feedback }}</div>
          </transition>
          
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'CRÉATION EN COURS...' : 'SUIVANT : AJOUTER LA GÉOMÉTRIE →' }}
          </button>
        </form>
  
        <div v-if="step === 2" class="step-2-container">
          
          <div class="success message" style="margin-bottom: 20px;">
            Le modèle <strong>{{ modele.nomModele }}</strong> a été créé avec succès !
          </div>
  
          <div class="field-group">
            <label>1. SÉLECTIONNER UNE TAILLE POUR AJOUTER/MODIFIER</label>
            <select v-model="selectedTaille" class="cube-select">
              <option value="" disabled>-- CHOISIR UNE TAILLE --</option>
              <option v-for="t in tailles" :key="t.idTaille" :value="t.idTaille">
                {{ t.taille }} ({{ t.tailleMin }}cm - {{ t.tailleMax }}cm)
              </option>
            </select>
          </div>
  
          <div v-if="selectedTaille" class="geometry-grid">
            <p class="step-indicator" style="grid-column: 1 / -1; margin-bottom: 10px;">
              Saisie pour la taille : {{ getTailleLabel(selectedTaille) }}
            </p>
            <div class="field-group" v-for="geo in geometries" :key="geo.idGeometrie">
              <label>{{ geo.nomGeometrie.toUpperCase() }} (mm/°)</label>
              <input type="number" step="0.1" v-model="allGeoValues[selectedTaille][geo.idGeometrie]" placeholder="0.0">
            </div>
          </div>
  
          <div v-if="Object.keys(taillesSaisies).length > 0" class="summary-box">
            <p><strong>Tailles prêtes à être enregistrées :</strong></p>
            <span v-for="tId in Object.keys(taillesSaisies)" :key="tId" class="taille-badge">
              {{ getTailleLabel(tId) }}
            </span>
          </div>
  
          <transition name="fade">
            <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">{{ feedback }}</div>
          </transition>
  
          <div class="button-group" style="margin-top: 30px;">
            <button @click="submitAllGeometries" :disabled="loading || Object.keys(taillesSaisies).length === 0" class="action-btn active-btn">
              {{ loading ? 'ENREGISTREMENT EN COURS...' : 'ENREGISTRER TOUTES LES GÉOMÉTRIES' }}
            </button>
          </div>
  
          <button @click="finishWizard" class="submit-btn" style="margin-top: 15px;">
            PASSER CETTE ÉTAPE (RETOUR ACCUEIL)
          </button>
        </div>
  
      </div>
    </main>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  // --- ÉTAT GLOBAL ---
  const step = ref(1);
  const loading = ref(false);
  const feedback = ref('');
  const isError = ref(false);
  
  // --- DONNÉES API ---
  const categories = ref([]);
  const tailles = ref([]);
  const geometries = ref([]);
  
  // --- MODÈLES DE DONNÉES ÉTAPE 1 ---
  const modele = ref({
    nomModele: '',
    millesimeModele: '',
    idCategorie: '',
    materiauCadre: '',
    typeVelo: '',
    texteDescription: ''
  });
  
  // --- MODÈLES DE DONNÉES ÉTAPE 2 ---
  const createdModeleId = ref(null);
  const selectedTaille = ref('');
  // Structure : { idTaille: { idGeometrie: valeur, ... } }
  const allGeoValues = ref({}); 
  
  // Helper : Obtenir le nom de la taille à partir de son ID
  const getTailleLabel = (id) => {
    const t = tailles.value.find(t => t.idTaille == id);
    return t ? t.taille : 'Inconnue';
  };
  
  // Computed : Détecter quelles tailles contiennent au moins une valeur saisie
  const taillesSaisies = computed(() => {
    const saisies = {};
    for (const [idTaille, geoObj] of Object.entries(allGeoValues.value)) {
      if (Object.values(geoObj).some(val => val !== null && val !== "" && val !== undefined)) {
        saisies[idTaille] = true;
      }
    }
    return saisies;
  });
  
  // Watcher : Initialiser l'objet de la taille sélectionnée si elle n'existe pas encore
  watch(selectedTaille, (newTailleId) => {
    if (newTailleId && !allGeoValues.value[newTailleId]) {
      allGeoValues.value[newTailleId] = {};
    }
  });
  
  // --- INITIALISATION ---
  onMounted(async () => {
    try {
      const [catRes, tailleRes, geoRes] = await Promise.all([
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/CategorieVelo/GetCategories'),
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Taille/GetTailles'),
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Geometrie/GetGeometries')
      ]);
  
      categories.value = await catRes.json();
      tailles.value = await tailleRes.json();
      geometries.value = await geoRes.json();
    } catch (error) {
      console.error("Erreur de chargement initial:", error);
    }
  });
  
  const goBack = () => router.push('/espace-commercial');
  
  // --- SOUMISSION ÉTAPE 1 (Création du modèle) ---
  const submitStep1 = async () => {
    loading.value = true;
    feedback.value = "";
    isError.value = false;
  
    try {
      // 1. Création de la description
      const descResponse = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Description/PostDescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texteDescription: modele.value.texteDescription })
      });
      
      if (!descResponse.ok) throw new Error("Erreur lors de la création de la description.");
      const descData = await descResponse.json(); 
      
      const idDesc = descData.idDescription || descData.IdDescription || descData.id_description;
      if (!idDesc) throw new Error("Impossible de récupérer l'ID de la description.");
  
      // 2. Création du modèle (Payload propre, en supposant que l'API C# a été corrigée avec des '?')
      const modelePayload = {
        idCategorie: parseInt(modele.value.idCategorie),
        idDescription: parseInt(idDesc), 
        nomModele: modele.value.nomModele.trim(),
        millesimeModele: modele.value.millesimeModele,
        materiauCadre: modele.value.materiauCadre.trim(),
        typeVelo: modele.value.typeVelo
      };
  
      const modResponse = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Modele/PostModele', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelePayload)
      });
  
      if (!modResponse.ok) {
        const errorText = await modResponse.text();
        console.error("Détail erreur Modèle :", errorText);
        throw new Error("Échec de la création du modèle. Vérifiez la console.");
      }
  
      const modData = await modResponse.json();
  
      // 3. Succès : Passage à la géométrie
      createdModeleId.value = modData.idModele || modData.IdModele || modData.id_modele;
      step.value = 2;
  
    } catch (err) {
      isError.value = true;
      feedback.value = err.message;
    } finally {
      loading.value = false;
    }
  };
  
    // --- SOUMISSION ÉTAPE 2 (Une par une pour éviter de faire exploser la base de données) ---
    const submitAllGeometries = async () => {
    loading.value = true;
    feedback.value = "";
    isError.value = false;
    
    let errorCount = 0;
    let successCount = 0;

    // On parcourt tout et on envoie séquentiellement (await dans la boucle)
    for (const [idTaille, geoObj] of Object.entries(allGeoValues.value)) {
        for (const [idGeometrie, valeur] of Object.entries(geoObj)) {
        if (valeur !== null && valeur !== "" && valeur !== undefined) {
            
            const payload = {
            idGeometrie: parseInt(idGeometrie),
            idModele: parseInt(createdModeleId.value), // ParseInt par sécurité !
            idTaille: parseInt(idTaille),
            valeurGeometrie: parseFloat(valeur)
            };

            try {
            const res = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/AGeometrie/PostAGeometrie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errTxt = await res.text();
                console.error(`❌ Erreur Taille ${idTaille}, Géo ${idGeometrie}:`, errTxt);
                errorCount++;
            } else {
                successCount++;
            }
            } catch (e) {
            console.error(`❌ Erreur réseau pour Taille ${idTaille}:`, e);
            errorCount++;
            }
        }
        }
    }

    loading.value = false;

    if (successCount === 0 && errorCount === 0) {
        feedback.value = "Aucune valeur saisie à enregistrer.";
        return;
    }

    // Bilan
    if (errorCount === 0) {
        isError.value = false;
        feedback.value = `${successCount} géométries enregistrées avec succès !`;
        allGeoValues.value = {};
        selectedTaille.value = '';
        
        setTimeout(() => {
        finishWizard();
        }, 2000);
    } else {
        isError.value = true;
        feedback.value = `${errorCount} erreur(s) survenue(s). Regardez la console F12. Avez-vous bien mis les '?' dans AGeometrie.cs ?`;
    }
    };
  
  const finishWizard = () => {
    router.push('/espace-commercial');
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
  
  .wide-card {
    max-width: 700px; 
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
  
  .back-btn:hover { color: #00a8e8; }
  
  .card-header h1 {
    font-size: 22px;
    font-weight: 800;
    font-style: italic;
    margin: 0;
    text-align: center;
  }
  
  .step-indicator {
    text-align: center;
    font-size: 12px;
    color: #00a8e8;
    font-weight: bold;
    margin-top: -15px;
    margin-bottom: 25px;
  }
  
  .separator {
    width: 40px;
    height: 4px;
    background: #000;
    margin: 15px auto 30px auto;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  
  .geometry-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    background: #f9f9f9;
    padding: 15px;
    border: 1px solid #eee;
    margin-bottom: 20px;
  }
  
  .field-group { margin-bottom: 18px; }
  
  label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 6px;
    color: #555;
  }
  
  input[type="text"], input[type="number"], textarea, .cube-select {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    font-family: 'CubeFont', sans-serif;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
    background: #fcfcfc;
    resize: vertical;
  }
  
  input:focus, textarea:focus, .cube-select:focus {
    border-color: #00a8e8;
    background: #fff;
  }
  
  .cube-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
  }
  
  .radio-container {
    display: flex;
    gap: 20px;
    margin-top: 5px;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }
  
  .radio-label input[type="radio"] {
    margin-right: 8px;
    accent-color: #00a8e8;
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
  
  .submit-btn:hover:not(:disabled) { background-color: #00a8e8; }
  .submit-btn:disabled { background-color: #ccc; cursor: not-allowed; }
  
  .action-btn {
    width: 100%;
    padding: 15px;
    background-color: #fff;
    color: #000;
    border: 1px solid #000;
    font-family: 'CubeFont', sans-serif;
    font-weight: 800;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .action-btn:hover {
    background-color: #000;
    color: #fff;
  }
  
  .summary-box {
    margin-top: 15px;
    padding: 10px;
    background-color: #e6f7ff;
    border: 1px solid #00a8e8;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .taille-badge {
    display: inline-block;
    background: #000;
    color: white;
    padding: 3px 8px;
    margin-right: 5px;
    border-radius: 12px;
    font-weight: bold;
  }
  
  .message {
    margin-bottom: 20px;
    padding: 12px;
    font-size: 12px;
    text-align: center;
    font-weight: 800;
  }
  .error { background-color: #fee2e2; color: #dc2626; border: 1px solid #dc2626; }
  .success { background-color: #ecfdf5; color: #059669; border: 1px solid #059669; }
  
  .fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }
  
  @media (max-width: 600px) {
    .form-grid, .geometry-grid { grid-template-columns: 1fr; }
    .admin-card { padding: 25px; width: 95%; }
  }
  </style>