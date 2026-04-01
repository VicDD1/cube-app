<template>
    <main class="admin-page">
      <div class="admin-card wide-card">
        
        <button type="button" class="back-btn" @click="goBack">
          ← RETOUR À L'ESPACE COMMERCIAL
        </button>
  
        <header class="card-header">
          <h1>NOUVELLE VARIANTE DE VÉLO</h1>
          <div class="separator"></div>
        </header>
        
        <form @submit.prevent="submitForm">
          
          <div class="form-grid">
            <div class="field-group">
              <label>MODÈLE DE BASE</label>
              <select v-model="form.idModele" required class="cube-select">
                <option value="" disabled>-- CHOISIR UN MODÈLE --</option>
                <option v-for="m in modeles" :key="m.idModele" :value="m.idModele">
                  {{ m.nomModele }} ({{ m.millesimeModele }})
                </option>
              </select>
            </div>
  
            <div class="field-group">
              <label>RÉFÉRENCE UNIQUE (Max 10 car.)</label>
              <input type="text" v-model="form.reference" placeholder="EX: CUBE-ST-01" maxlength="10" required>
            </div>
  
            <div class="field-group">
              <label>NOM DE L'ARTICLE</label>
              <input type="text" v-model="form.nomArticle" placeholder="EX: Stereo Hybrid 140 HPC Actionteam" required>
            </div>
  
            <div class="field-group">
              <label>COULEUR</label>
              <select v-model="form.idCouleur" required class="cube-select">
                <option value="" disabled>-- CHOISIR --</option>
                <option v-for="c in couleurs" :key="c.idCouleur" :value="c.idCouleur">
                  {{ c.nomCouleur }}
                </option>
              </select>
            </div>
  
            <div class="field-group">
              <label>FOURCHE</label>
              <select v-model="form.idFourche" required class="cube-select">
                <option value="" disabled>-- CHOISIR --</option>
                <option v-for="f in fourches" :key="f.idFourche" :value="f.idFourche">
                  {{ f.nomFourche }}
                </option>
              </select>
            </div>
  
            <div class="field-group">
              <label>BATTERIE (Laisser vide si musculaire)</label>
              <select v-model="form.idBatterie" class="cube-select">
                <option value="">-- AUCUNE BATTERIE --</option>
                <option v-for="b in batteries" :key="b.idBatterie" :value="b.idBatterie">
                  {{ b.capaciteBatterie }} Wh
                </option>
              </select>
            </div>
  
            <div class="field-group">
              <label>PRIX (€)</label>
              <input type="number" step="0.01" min="0" v-model="form.prix" placeholder="0.00" required>
            </div>
  
            <div class="field-group">
              <label>POIDS (kg)</label>
              <input type="number" step="0.1" min="0.1" v-model="form.poids" placeholder="0.0" required>
            </div>
          </div>
  
          <div class="field-group">
            <label>RÉSUMÉ COMMERCIAL</label>
            <textarea v-model="form.resume" rows="3" placeholder="Phrase d'accroche ou petit résumé..." required></textarea>
          </div>
          
          <transition name="fade">
            <div v-if="feedback" :class="['message', isError ? 'error' : 'success']">{{ feedback }}</div>
          </transition>
          
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'ENREGISTREMENT...' : 'CRÉER LA VARIANTE' }}
          </button>
        </form>
      </div>
    </main>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  
  
  const loading = ref(false);
  const feedback = ref('');
  const isError = ref(false);
  
  
  const modeles = ref([]);
  const couleurs = ref([]);
  const fourches = ref([]);
  const batteries = ref([]);
  
  
  const form = ref({
    idModele: '',
    reference: '',
    nomArticle: '',
    idCouleur: '',
    idFourche: '',
    idBatterie: '',
    prix: '',
    poids: '',
    resume: ''
  });
  
  
  onMounted(async () => {
    try {
      const [modRes, coulRes, fourRes, batRes] = await Promise.all([
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Modele/GetModeles'),
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Couleur/GetCouleurs'),
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Fourche/GetFourches'),
        fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Batterie/GetBatteries')
      ]);
  
      if (modRes.ok) modeles.value = await modRes.json();
      if (coulRes.ok) couleurs.value = await coulRes.json();
      if (fourRes.ok) fourches.value = await fourRes.json();
      if (batRes.ok) batteries.value = await batRes.json();
    } catch (error) {
      console.error("Erreur de chargement des ressources:", error);
      isError.value = true;
      feedback.value = "Impossible de charger les données (Modèles, couleurs...).";
    }
  });
  
  const goBack = () => router.push('/espace-commercial');
  
    
    const submitForm = async () => {
    loading.value = true;
    feedback.value = "";
    isError.value = false;

    let idResumeCree = null;

    try {
        
        
        
        const resumeRes = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Resume/PostResume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenuResume: form.value.resume })
        });
        
        if (!resumeRes.ok) throw new Error("Erreur lors de la création du résumé.");
        const resumeData = await resumeRes.json();
        
        idResumeCree = resumeData.idResume || resumeData.IdResume || resumeData.id_resume;
        if (!idResumeCree) throw new Error("Impossible de récupérer l'ID du résumé créé.");


        
        
        
        
        const variantePayload = {
        reference: form.value.reference.trim(),
        idBatterie: form.value.idBatterie ? parseInt(form.value.idBatterie) : null,
        idResume: parseInt(idResumeCree),
        idModele: parseInt(form.value.idModele),
        idFourche: parseInt(form.value.idFourche),
        idCouleur: parseInt(form.value.idCouleur),
        nomArticle: form.value.nomArticle.trim(),
        prix: parseFloat(form.value.prix),
        poids: parseFloat(form.value.poids)
        };

        const varRes = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/VarianteVelo/PostVariante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantePayload)
        });

        if (!varRes.ok) {
        const errText = await varRes.text();
        console.error("Erreur Variante:", errText);
        throw new Error("Impossible d'insérer la variante. (L'article parent n'a pas pu être généré).");
        }

        
        
        
        isError.value = false;
        feedback.value = "Variante complète (Article inclus) créée avec succès !";
        
        
        form.value.reference = '';
        form.value.idCouleur = '';
        
        setTimeout(() => { if (!isError.value) feedback.value = ""; }, 4000);

    } catch (err) {
        isError.value = true;
        feedback.value = err.message + " Nettoyage en cours...";
        console.error("Crash détecté, déclenchement du Rollback Front-End...");

        
        
        
        try {
        if (idResumeCree) {
            await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Resume/DeleteResume/${idResumeCree}`, { 
            method: 'DELETE' 
            });
            console.log(`Résumé ${idResumeCree} supprimé.`);
        }

        feedback.value = err.message + " (Les données partielles ont bien été effacées).";
        } catch (rollbackErr) {
        console.error("Échec critique du Rollback :", rollbackErr);
        feedback.value = err.message + " (ATTENTION : Des données orphelines sont restées en base).";
        }
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
    .form-grid { grid-template-columns: 1fr; }
    .admin-card { padding: 25px; width: 95%; }
  }
  </style>