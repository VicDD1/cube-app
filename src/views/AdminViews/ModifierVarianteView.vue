<template>
    <main class="admin-page">
      <div class="admin-card wide-card">
        
        <button type="button" class="back-btn" @click="goBack">
          ← RETOUR À L'ESPACE COMMERCIAL
        </button>
  
        <header class="card-header">
          <h1>GÉRER LES INFOS & STOCKS</h1>
          <div class="separator"></div>
        </header>
  
        <div class="field-group">
          <label>SÉLECTIONNER LA VARIANTE À MODIFIER</label>
          <select v-model="selectedReference" class="cube-select main-select">
            <option value="" disabled>-- CHOISIR UNE RÉFÉRENCE --</option>
            <option v-for="v in variantes" :key="v.reference" :value="v.reference">
              {{ v.reference }} - {{ v.nomArticle }}
            </option>
          </select>
        </div>
  
        <div v-if="selectedReference" class="panels-container">
          
          <div class="action-panel">
            <h3>📦 AJOUTER DU STOCK WEB</h3>
            <form @submit.prevent="addStock" class="panel-form">
              <div class="field-group">
                <label>TAILLE</label>
                <select v-model="stock.idTaille" required class="cube-select">
                  <option value="" disabled>-- CHOISIR --</option>
                  <option v-for="t in tailles" :key="t.idTaille || t.IdTaille" :value="t.idTaille || t.IdTaille">
                    {{ t.taille1 || t.Taille1 || t.taille || t.Taille }}
                  </option>
                </select>
              </div>
              <div class="field-group">
                <label>QUANTITÉ</label>
                <input type="number" min="0" v-model="stock.qte" placeholder="Ex: 5" required>
              </div>
              <button type="submit" :disabled="loadingStock" class="action-btn active-btn">
                {{ loadingStock ? '...' : 'ENREGISTRER STOCK' }}
              </button>
            </form>
          </div>
  
          <div class="action-panel">
            <h3>⚙️ AJOUTER CARACTÉRISTIQUE</h3>
            <form @submit.prevent="addCarac" class="panel-form">
              <div class="field-group">
                <label>CARACTÉRISTIQUE</label>
                <select v-model="carac.idCaracteristique" required class="cube-select">
                  <option value="" disabled>-- CHOISIR --</option>
                  <option v-for="c in caracteristiques" :key="c.idCaracteristique" :value="c.idCaracteristique">
                    {{ c.nomCaracteristique }}
                  </option>
                </select>
              </div>
              <div class="field-group">
                <label>VALEUR (Texte)</label>
                <input type="text" v-model="carac.valeur" placeholder="Ex: Shimano Deore XT..." required>
              </div>
              <button type="submit" :disabled="loadingCarac" class="action-btn active-btn">
                {{ loadingCarac ? '...' : 'AJOUTER CARACTÉRISTIQUE' }}
              </button>
            </form>
          </div>
  
          <div class="action-panel">
          <h3>📸 TÉLÉVERSER UNE PHOTO</h3>
          <p class="help-text">La photo sera convertie en .webp et ajoutée dans :<br> <code>src/assets/images/VELOS/{{ selectedReference }}/</code></p>
          <form @submit.prevent="uploadPhoto" class="panel-form">
            <div class="field-group">
              <label>SÉLECTIONNER UN FICHIER</label>
              <input type="file" accept="image/*" @change="handleFileSelection" required class="file-input">
            </div>
            
            <button type="submit" :disabled="loadingPhoto || !photo.file" class="action-btn active-btn">
              {{ loadingPhoto ? 'TRAITEMENT EN COURS...' : 'SAUVEGARDER LA PHOTO' }}
            </button>
          </form>
        </div>
  
        </div>
  
        <transition name="fade">
          <div v-if="feedback" :class="['message', isError ? 'error' : 'success']" style="margin-top: 20px;">
            {{ feedback }}
          </div>
        </transition>
      </div>
    </main>
  </template>
  
  <script setup>
    import { ref, onMounted, watch } from 'vue';
    import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  const variantes = ref([]);
  const tailles = ref([]);
  const caracteristiques = ref([]);
  const selectedReference = ref('');
  
  const feedback = ref('');
  const isError = ref(false);
  
  const loadingStock = ref(false);
  const stock = ref({ idTaille: '', qte: '' });
  
  const loadingCarac = ref(false);
  const carac = ref({ idCaracteristique: '', valeur: '' });
  
  const loadingPhoto = ref(false);
  const photo = ref({ file: null, estPrincipale: false });
  

  
    watch([() => stock.value.idTaille, selectedReference], async ([newTaille, newRef]) => {
    
    if (!newTaille || !newRef) {
        stock.value.qte = '';
        return;
    }
    
    try {
        
        const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ArticleInventaire/GetByReference/${newRef}`);
        if (res.ok) {
        const stocks = await res.json();
        
        const existing = stocks.find(s => s.idTaille === parseInt(newTaille) || s.IdTaille === parseInt(newTaille));
        
        
        stock.value.qte = existing ? (existing.quantiteStockEnLigne || existing.QuantiteStockEnLigne) : '';
        } else {
        stock.value.qte = '';
        }
    } catch (e) {
        console.error("Erreur auto-remplissage stock:", e);
        stock.value.qte = '';
    }
    });


    
    watch([() => carac.value.idCaracteristique, selectedReference], async ([newCaracId, newRef]) => {
    if (!newCaracId || !newRef) {
        carac.value.valeur = '';
        return;
    }
    
    try {
        
        const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ACaracteristique/GetByIds/${parseInt(newCaracId)}/${newRef}`);
        if (res.ok) {
        const data = await res.json();
        
        carac.value.valeur = data.valeurCaracteristique || data.ValeurCaracteristique || '';
        } else {
        
        carac.value.valeur = '';
        }
    } catch (e) {
        console.error("Erreur auto-remplissage caractéristique:", e);
        carac.value.valeur = '';
    }
    });


    
    
    watch(selectedReference, () => {
    stock.value.idTaille = '';
    stock.value.qte = '';
    carac.value.idCaracteristique = '';
    carac.value.valeur = '';
    photo.value.file = null;
    photo.value.estPrincipale = false;
    const fileInput = document.querySelector('.file-input');
    if (fileInput) fileInput.value = '';
    });


  onMounted(async () => {
    try {
      const [varRes, tailRes, caracRes] = await Promise.all([
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/VarianteVelo/GetVariantes'),
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Taille/GetTailles'),
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Caracteristique/GetCaracteristiques')
      ]);
      if (varRes.ok) variantes.value = await varRes.json();
      if (tailRes.ok) tailles.value = await tailRes.json();
      if (caracRes.ok) caracteristiques.value = await caracRes.json();
    } catch (error) {
      console.error("Erreur chargement:", error);
      showMessage("Erreur de connexion à la base de données.", true);
    }
  });
  
  const goBack = () => router.push('/espace-commercial');
  const showMessage = (msg, error = false) => {
    feedback.value = msg;
    isError.value = error;
    setTimeout(() => { feedback.value = ''; }, 5000);
  };
  

const addStock = async () => {
  loadingStock.value = true;
  try {
    const idTailleNum = parseInt(stock.value.idTaille);
    const ref = selectedReference.value;
    const qteNum = parseInt(stock.value.qte);

    
    const checkRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ArticleInventaire/GetByReference/${ref}`);
    let existingStock = null;

    if (checkRes.ok) {
      const stocks = await checkRes.json();
      
      existingStock = stocks.find(s => s.idTaille === idTailleNum || s.IdTaille === idTailleNum);
    }

    if (existingStock) {
      
      
      const idArtInv = existingStock.idArticleInventaire || existingStock.IdArticleInventaire;
      
      const payloadPut = {
        idArticleInventaire: idArtInv,
        idTaille: idTailleNum,
        reference: ref,
        quantiteStockEnLigne: qteNum
      };

      const putRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ArticleInventaire/PutArticleInventaire/${idArtInv}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadPut)
      });
      
      if (!putRes.ok) throw new Error("Échec de la mise à jour du stock.");
      showMessage("✅ Stock mis à jour avec succès ! (Écrasement)");

    } else {
      
      const payloadPost = {
        idArticleInventaire: 0,
        idTaille: idTailleNum,
        reference: ref,
        quantiteStockEnLigne: qteNum
      };

      const postRes = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ArticleInventaire/PostArticleInventaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadPost)
      });
      
      if (!postRes.ok) throw new Error("Échec de la création du stock.");
      showMessage("✅ Nouveau stock ajouté avec succès !");
    }

    
    stock.value.qte = '';
    
  } catch (err) {
    showMessage(err.message, true);
  } finally {
    loadingStock.value = false;
  }
};



const addCarac = async () => {
  loadingCarac.value = true;
  try {
    const idCaracNum = parseInt(carac.value.idCaracteristique);
    const ref = selectedReference.value.trim();
    const valText = carac.value.valeur.trim();

    const payload = {
      idCaracteristique: idCaracNum,
      reference: ref,
      valeurCaracteristique: valText
    };

    
    const checkRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ACaracteristique/GetByIds/${idCaracNum}/${ref}`);

    if (checkRes.ok) {
      
      const putRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ACaracteristique/PutACaracteristique/${idCaracNum}/${ref}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!putRes.ok) {
        
        const errText = await putRes.text();
        console.error("Détail de l'erreur PUT 400 :", errText);
        throw new Error("Échec de la modification. Regardez la console F12.");
      }
      showMessage("Caractéristique modifiée avec succès ! (Écrasement)");

    } else {
      
      const postRes = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ACaracteristique/PostACaracteristique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!postRes.ok) {
        const errText = await postRes.text();
        console.error("Détail de l'erreur POST 400 :", errText);
        throw new Error("Échec de l'ajout de la caractéristique.");
      }
      showMessage("Nouvelle caractéristique ajoutée avec succès !");
    }

    
    carac.value.valeur = '';
    
  } catch (err) {
    showMessage(err.message, true);
  } finally {
    loadingCarac.value = false;
  }
};



const handleFileSelection = (event) => {
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    photo.value.file = selectedFile;
  }
};

const uploadPhoto = async () => {
  loadingPhoto.value = true;
  try {
    const formData = new FormData();
    formData.append('fichier', photo.value.file);
    formData.append('reference', selectedReference.value);

    
    const res = await fetch('http://localhost:4000/upload-local', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Erreur du serveur local : ${err.error}`);
    }
    
    const data = await res.json();
    showMessage(`Photo enregistrée localement sous le nom ${data.fileName} !`);
    
    
    photo.value.file = null;
    document.querySelector('.file-input').value = '';

  } catch (err) {
    showMessage(err.message, true);
    console.error(err);
  } finally {
    loadingPhoto.value = false;
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
  
  .wide-card {
    max-width: 900px; 
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
  
  .separator {
    width: 40px;
    height: 4px;
    background: #000;
    margin: 15px auto 30px auto;
  }
  
  .main-select {
    border: 2px solid #00a8e8;
    font-weight: bold;
    font-size: 14px;
    padding: 15px;
  }
  
  .panels-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 30px;
  }
  
  .action-panel {
    background: #fcfcfc;
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 4px;
  }
  
  .action-panel h3 {
    font-size: 13px;
    font-weight: 800;
    margin-top: 0;
    margin-bottom: 15px;
    color: #00a8e8;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
    text-align: center;
  }
  
  .field-group { margin-bottom: 18px; }
  
  label {
    display: block;
    font-size: 11px;
    font-weight: 800;
    margin-bottom: 6px;
    color: #555;
  }
  
  input[type="text"], input[type="number"], .cube-select, .file-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    font-family: 'CubeFont', sans-serif;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
    background: #fff;
  }
  
  .file-input {
    background: #fcfcfc;
    padding: 9px;
    font-size: 11px;
  }
  
  input:focus, .cube-select:focus {
    border-color: #00a8e8;
  }
  
  .cube-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1em;
  }
  
  .checkbox-group {
    display: flex;
    align-items: center;
    margin-top: 10px;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    color: #000;
  }
  
  .radio-label input[type="checkbox"] {
    width: auto;
    margin-right: 8px;
    accent-color: #00a8e8;
  }
  
  .action-btn {
    width: 100%;
    padding: 12px;
    background-color: #fff;
    color: #000;
    border: 1px solid #000;
    font-family: 'CubeFont', sans-serif;
    font-weight: 800;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
  }
  
  .action-btn:hover:not(:disabled) {
    background-color: #000;
    color: #fff;
  }
  
  .action-btn:disabled {
    background-color: #f4f4f4;
    border-color: #ddd;
    color: #999;
    cursor: not-allowed;
  }
  
  .message {
    padding: 15px;
    font-size: 12px;
    text-align: center;
    font-weight: 800;
    border-radius: 4px;
  }
  .error { background-color: #fee2e2; color: #dc2626; border: 1px solid #dc2626; }
  .success { background-color: #ecfdf5; color: #059669; border: 1px solid #059669; }
  
  .fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
  .fade-enter-from, .fade-leave-to { opacity: 0; }
  
  @media (max-width: 850px) {
    .panels-container { grid-template-columns: 1fr; }
    .admin-card { padding: 25px; width: 95%; }
  }
  </style>