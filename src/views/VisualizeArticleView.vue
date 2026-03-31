<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StoreLocator from '../components/StoreLocator.vue'
import { useAppStore } from '../stores/useStore'
import CubeCalculator from '@/components/CubeCalculator.vue';

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'
const idClient = computed(() => appStore.user?.idClient || null)

// --- RÉFÉRENCES RÉACTIVES ---
const reference = computed(() => route.params.id?.trim())
const article = ref(null)
const caracteristiques = ref([])
const inventaire = ref([])
const variantesCouleurs = ref([])
const variantesBatteries = ref([])
const articlesSimilaires = ref([])
const batterieInfo = ref(null)

const loading = ref(true)
const currentImgIndex = ref(1)
const showCartModal = ref(false)
const sizeError = ref(false)
const isZoomOpen = ref(false)

const tableauGeometrie = ref({})
const listeTailles = ref([])
const selectedTaille = ref(null)
const storeLocatorRef = ref(null)

// --- DISPONIBILITÉ ET AFFICHAGE ---
const isVelo = computed(() => reference.value?.length === 6)
const folder = computed(() => isVelo.value ? 'VELOS' : 'ACCESSOIRES')

const isAvailableOnline = computed(() => (selectedTaille.value?.quantiteStockEnLigne || 0) > 0)

const isAvailableInCurrentStore = computed(() => {
  if (!selectedTaille.value || !appStore.magasinChoisi || !selectedTaille.value.inventaireMagasins) return false
  const stockMagasin = selectedTaille.value.inventaireMagasins.find(m => m.idMagasin === appStore.magasinChoisi.idMagasin)
  return (stockMagasin?.quantiteStockMagasin || 0) > 0
})

const isAvailableInOtherStores = computed(() => {
  if (!selectedTaille.value || !selectedTaille.value.inventaireMagasins) return false
  return selectedTaille.value.inventaireMagasins.some(m => m.quantiteStockMagasin > 0 && m.idMagasin !== appStore.magasinChoisi?.idMagasin)
})

const isAvailableInAnyStore = computed(() => {
  if (!selectedTaille.value || !selectedTaille.value.inventaireMagasins) return false
  return selectedTaille.value.inventaireMagasins.some(m => m.quantiteStockMagasin > 0)
})

const storeButtonText = computed(() => {
  return !appStore.magasinChoisi ? '» AJOUTER UN MAGASIN' : '» CHANGER DE MAGASIN'
})

const fichesTechniquesGroupees = computed(() => {
  const groupes = {}
  caracteristiques.value.forEach(item => {
    const groupe = item.idCaracteristiqueNavigation?.idGroupeCaracteristiqueNavigation?.nomGroupe || 'AUTRES'
    if (!groupes[groupe]) groupes[groupe] = []
    groupes[groupe].push(item)
  })
  return groupes
})

// --- ACTIONS & MÉTHODES ---
const selectTaille = (item) => { 
  selectedTaille.value = item 
  sizeError.value = false 
}

const openStoreLocator = () => { storeLocatorRef.value?.toggle() }
const handleStoreSelection = (magasin) => { appStore.setMagasin(magasin) }

const handleStoreAction = () => {
  if (!selectedTaille.value) {
    sizeError.value = true
    setTimeout(() => { sizeError.value = false }, 600)
  } else {
    openStoreLocator()
  }
}

const addToCart = async () => {
  if (!selectedTaille.value) {
    sizeError.value = true
    setTimeout(() => { sizeError.value = false }, 600)
    return;
  }

  // --- Gestion Visiteur (LocalStorage) ---
  if (!idClient.value) {
    let panierLocal = JSON.parse(localStorage.getItem('panierVisiteur')) || { lignePaniers: [] };
    const indexExistant = panierLocal.lignePaniers.findIndex(
      item => item.reference === reference.value && item.tailleSelectionnee === selectedTaille.value.idTailleNavigation.taille1.trim()
    );
    
    if (indexExistant > -1) {
      panierLocal.lignePaniers[indexExistant].quantiteSelectionnee += 1;
    } else {
      panierLocal.lignePaniers.push({
        reference: reference.value,
        nomArticle: article.value.nomArticle, 
        tailleSelectionnee: selectedTaille.value.idTailleNavigation.taille1.trim(),
        quantiteSelectionnee: 1,
        prixUnitaire: article.value.prix
      });
    }
    
    localStorage.setItem('panierVisiteur', JSON.stringify(panierLocal));
    appStore.updateCartCount(null); 
    showCartModal.value = true; 
    return;
  }

  // --- Gestion Utilisateur Connecté (API) ---
  try {
    let vraiIdPanier = null;
    let lignesExistantes = [];

    const cartRes = await fetch(`${API_BASE}/Panier/GetActiveCart/${idClient.value}`);

    if (cartRes.ok) {
      const cartData = await cartRes.json();
      vraiIdPanier = cartData.idPanier;
      
      // On scanne le contenu du panier pour voir ce qui s'y trouve déjà
      const detailsRes = await fetch(`${API_BASE}/Panier/GetDetails/${vraiIdPanier}`);
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        lignesExistantes = detailsData.lignePaniers || [];
      }
    } else {
      const newCartRes = await fetch(`${API_BASE}/Panier/PostPanier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPanier: 0, idClient: idClient.value }) 
      });
      if (newCartRes.ok) {
        const newCartData = await newCartRes.json();
        vraiIdPanier = newCartData.idPanier || newCartData.id;
      } else {
        console.error("Erreur lors de la création du panier");
        return;
      }
    }

    const targetRef = reference.value.trim();
    const targetTaille = selectedTaille.value.idTailleNavigation.taille1.trim();

    // On regarde si la même ref + taille existe déjà
    const articleExistant = lignesExistantes.find(
      i => i.reference.trim() === targetRef && i.tailleSelectionnee.trim() === targetTaille
    );

    if (articleExistant) {
      // S'il est là, on fait un PUT pour simplement augmenter la quantité
      const nouvelleQuantite = (articleExistant.quantiteArticle || 1) + 1;
      const payloadPut = {
        idPanier: vraiIdPanier,
        reference: articleExistant.reference, // On garde la version DB avec espaces éventuels
        tailleSelectionnee: articleExistant.tailleSelectionnee,
        quantiteArticle: nouvelleQuantite
      };

      await fetch(`${API_BASE}/LignePanier/PutLignePanier/${vraiIdPanier}/${encodeURIComponent(articleExistant.reference)}/${encodeURIComponent(articleExistant.tailleSelectionnee)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadPut)
      });
    } else {
      // S'il n'est pas là, on insère la nouveauté avec POST
      const payloadPost = {
        idPanier: vraiIdPanier, 
        reference: targetRef,
        tailleSelectionnee: targetTaille,
        quantiteArticle: 1
      };

      await fetch(`${API_BASE}/LignePanier/PostLignePanier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadPost)
      });
    }

    appStore.updateCartCount(idClient.value);
    showCartModal.value = true;
  } catch (err) {
    console.error("Erreur ajout panier:", err);
  }
};

// --- GALERIE ---
const getLocalImage = (itemRef, index) => {
  const itemFolder = itemRef?.trim().length === 6 ? 'VELOS' : 'ACCESSOIRES'
  try {
    return new URL(`../assets/images/${itemFolder}/${itemRef?.trim()}/image_${index}.webp`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/600x400?text=Image+Indisponible'
  }
}

const nextImage = () => { currentImgIndex.value = currentImgIndex.value < 4 ? currentImgIndex.value + 1 : 1 }
const prevImage = () => { currentImgIndex.value = currentImgIndex.value > 1 ? currentImgIndex.value - 1 : 4 }

const openZoom = () => {
  isZoomOpen.value = true
  document.body.style.overflow = 'hidden'
}
const closeZoom = () => {
  isZoomOpen.value = false
  document.body.style.overflow = ''
}

// --- GÉOMÉTRIE & DONNÉES ---
const fetchGeometries = async (idModele, tailles) => {
  const geoData = {}
  for (const taille of tailles) {
    try {
      const res = await fetch(`${API_BASE}/AGeometrie/GetByModeleAndTaille/${idModele}/${taille.idTaille}`)
      const data = await res.json()
      data.forEach(item => {
        const nom = item.idGeometrieNavigation.nomGeometrie
        if (!geoData[nom]) geoData[nom] = {}
        geoData[nom][taille.idTaille] = item.valeurGeometrie
      })
    } catch (e) { console.error("Erreur géo pour taille " + taille.idTaille, e) }
  }
  tableauGeometrie.value = geoData
}

const fetchData = async () => {
  loading.value = true
  try {
    const cleanRef = reference.value
    const endpoint = isVelo.value ? 'VarianteVelo/GetFullDetails' : 'Accessoire/GetDetails'
    
    const [resDetail, resCarac, resInv, resSimilar] = await Promise.all([
      fetch(`${API_BASE}/${endpoint}/${cleanRef}`),
      fetch(`${API_BASE}/ACaracteristique/GetByArticle/${cleanRef}`),
      fetch(`${API_BASE}/Articles/GetStock/${cleanRef}`),
      fetch(`${API_BASE}/Articles/GetSimilar/${cleanRef}`)
    ])

    article.value = await resDetail.json()
    caracteristiques.value = await resCarac.json()
    
    const stockData = await resInv.json()
    inventaire.value = stockData.articleInventaires 

    if (resSimilar.ok) {
      const similarData = await resSimilar.json()
      articlesSimilaires.value = similarData
        .filter(a => a.reference.trim() !== cleanRef)
        .slice(0, 4)
    }

    if (isVelo.value && article.value?.idModele) {
      const resModel = await fetch(`${API_BASE}/Modele/GetDetails/${article.value.idModele}`)
      const modelData = await resModel.json()
      const allVariantes = modelData.varianteVelos || []

      variantesCouleurs.value = allVariantes.filter(v => v.idBatterie === article.value.idBatterie)

      const batteriesUniques = new Set()
      variantesBatteries.value = allVariantes
        .filter(v => {
          const capacity = v.idBatterieNavigation?.capaciteBatterie
          if (capacity && !batteriesUniques.has(capacity)) {
            batteriesUniques.add(capacity)
            return true
          }
          return false
        })
        .sort((a, b) => a.idBatterieNavigation.capaciteBatterie - b.idBatterieNavigation.capaciteBatterie)

      // Récupération informations batterie
      const idBat = article.value.idBatterie || modelData.idBatterie
      if (idBat) {
        try {
          const resBatt = await fetch(`${API_BASE}/Batterie/GetById/${idBat}`)
          if (resBatt.ok) {
            batterieInfo.value = await resBatt.json()
          }
        } catch (err) { console.error("Erreur lors de la récupération de la batterie:", err) }
      }

      listeTailles.value = inventaire.value.map(i => ({
         idTaille: i.idTaille,
         nom: i.idTailleNavigation.taille1.trim()
      }))
      
      await fetchGeometries(article.value.idModele, listeTailles.value)
    }
  } catch (err) { 
    console.error("Erreur fetchData:", err) 
  } finally { 
    loading.value = false 
  }
}

const activeSection = ref('TECH')
const toggleSection = (s) => activeSection.value = activeSection.value === s ? null : s

watch(reference, () => {
    fetchData()
    currentImgIndex.value = 1
    selectedTaille.value = null
    sizeError.value = false
    batterieInfo.value = null
    
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
})
onMounted(fetchData)
</script>

<template>
  <div class="visualize-page" v-if="article">
    
    <div class="product-hero">
      <div class="gallery-column">
        <div class="main-image-wrapper">
          <button class="nav-btn prev" @click="prevImage">&#10216;</button>
          <img 
            :src="getLocalImage(reference, currentImgIndex)" 
            class="main-view zoom-cursor" 
            @click="openZoom" 
          />
          <button class="nav-btn next" @click="nextImage">&#10217;</button>
        </div>

        <div class="zoom-overlay" v-if="isZoomOpen" @click="closeZoom">
          <button class="close-zoom">✖</button>
          <div class="zoom-container" @click.stop>
            <img :src="getLocalImage(reference, currentImgIndex)" class="zoom-img" />
          </div>
        </div>

        <div class="thumbnails-row">
          <img 
            v-for="i in 4" :key="i"
            :src="getLocalImage(reference, i)"
            @click="currentImgIndex = i"
            :class="{ active: currentImgIndex === i }"
            @error="(e) => e.target.style.display = 'none'"
          />
        </div>

        <div class="full-details-area">
          <section class="accordion-item" :class="{ 'is-active': activeSection === 'TECH' }">
            <div class="accordion-header" @click="toggleSection('TECH')">
              <h2>FICHE TECHNIQUE</h2>
              <span class="icon-circle">{{ activeSection === 'TECH' ? '-' : '+' }}</span>
            </div>
            <div class="accordion-content" v-show="activeSection === 'TECH'">
              <div class="tech-table">
                
                <div v-if="batterieInfo" class="tech-group">
                  <h3 class="group-title">BATTERIE</h3>
                  <div class="tech-row">
                    <span class="tech-label">Capacité</span>
                    <span class="tech-value">{{ batterieInfo.capacite || batterieInfo.capaciteBatterie }} Wh</span>
                  </div>
                </div>

                <div v-for="(items, groupName) in fichesTechniquesGroupees" :key="groupName" class="tech-group">
                  <h3 class="group-title">{{ groupName }}</h3>
                  <div v-for="item in items" :key="item.idCaracteristique" class="tech-row">
                    <span class="tech-label">{{ item.idCaracteristiqueNavigation?.nomCaracteristique }}</span>
                    <span class="tech-value">{{ item.valeurCaracteristique }}</span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          <section class="accordion-item" v-if="isVelo && Object.keys(tableauGeometrie).length > 0" :class="{ 'is-active': activeSection === 'GEO' }">
            <div class="accordion-header" @click="toggleSection('GEO')">
              <h2>GÉOMÉTRIE</h2>
              <span class="icon-circle">{{ activeSection === 'GEO' ? '-' : '+' }}</span>
            </div>
            <div class="accordion-content" v-show="activeSection === 'GEO'">
              <div class="geo-table-wrapper">
                <table class="geo-table">
                  <thead>
                    <tr>
                      <th class="sticky-col"></th>
                      <th 
                        v-for="t in listeTailles" 
                        :key="t.idTaille"
                        :class="{ 'highlight-column': selectedTaille?.idTaille === t.idTaille }"
                      >
                        {{ t.nom }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(valeurs, nom) in tableauGeometrie" :key="nom">
                      <td class="mesure-nom sticky-col">{{ nom }}</td>
                      <td 
                        v-for="t in listeTailles" 
                        :key="t.idTaille"
                        :class="{ 'highlight-column': selectedTaille?.idTaille === t.idTaille }"
                      >
                        {{ valeurs[t.idTaille] || '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="accordion-item" v-if="article.idModeleNavigation?.idDescriptionNavigation" :class="{ 'is-active': activeSection === 'DESC' }">
            <div class="accordion-header" @click="toggleSection('DESC')">
              <h2>DESCRIPTION</h2>
              <span class="icon-circle">{{ activeSection === 'DESC' ? '-' : '+' }}</span>
            </div>
            <div class="accordion-content" v-show="activeSection === 'DESC'">
              <p class="text-block">{{ article.idModeleNavigation.idDescriptionNavigation.texteDescription }}</p>
            </div>
          </section>

          <section class="accordion-item" v-if="article.idResumeNavigation" :class="{ 'is-active': activeSection === 'RESUME' }">
            <div class="accordion-header" @click="toggleSection('RESUME')">
              <h2>EN RÉSUMÉ</h2>
              <span class="icon-circle">{{ activeSection === 'RESUME' ? '-' : '+' }}</span>
            </div>
            <div class="accordion-content" v-show="activeSection === 'RESUME'">
              <div class="text-content">
                <p>{{ article.idResumeNavigation.contenuResume }}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="purchase-column">
        <div class="saison-badge" v-if="article.idModeleNavigation?.millesimeModele">
          SAISON : {{ article.idModeleNavigation.millesimeModele }}
        </div>

        <h1 class="product-title">{{ article.nomArticle }}</h1>
        <div class="meta-info">
          Référence : {{ reference }} | Poids : {{ article.poids }} kg | Matériau : {{ article.idModeleNavigation?.materiauCadre }}
        </div>

        <div class="size-section" :class="{ 'needs-size': sizeError }">
          <h3 class="section-label">TAILLE <span class="help-circle">?</span></h3>
          <div class="size-grid">
            <div v-for="item in inventaire" :key="item.idArticleInventaire" 
                class="size-box" :class="{'out': item.quantiteStockEnLigne === 0, 'active': selectedTaille?.idTaille === item.idTaille}"
                @click="selectTaille(item)">
              <span class="s-name">{{ item.idTailleNavigation.taille1 }}</span>
              <span class="s-range">({{ item.idTailleNavigation.tailleMin }}-{{ item.idTailleNavigation.tailleMax }})</span>
            </div>
          </div>
        </div>

        <div class="price-box">
          <span class="price-val">{{ article.prix?.toLocaleString() }} € TTC</span>
          
          <div class="availability-legend">
            <p class="legend-title">LÉGENDE DISPONIBILITÉ <span class="help-circle">?</span></p>
            
            <p v-if="!selectedTaille || !appStore.magasinChoisi" class="status-line selection-needed">
              <span class="dot"></span> 
              {{ !selectedTaille ? 'Veuillez choisir une taille' : 'Veuillez choisir un magasin' }}
            </p>

            <template v-else>
              <p class="status-line" :class="isAvailableOnline ? 'ok' : 'err'">
                <span class="dot"></span>
                {{ isAvailableOnline ? 'Disponible en ligne' : 'Pas disponible en ligne' }}
              </p>

              <p class="status-line" 
                :class="{ 
                  'ok': isAvailableInCurrentStore, 
                  'warn': !isAvailableInCurrentStore && isAvailableInAnyStore, 
                  'err': !isAvailableInAnyStore 
                }">
                <span class="dot"></span>
                <span v-if="isAvailableInCurrentStore">
                  Disponible à {{ appStore.magasinChoisi.nomMagasin }}
                </span>
                <span v-else-if="isAvailableInOtherStores">
                  Pas disponible à {{ appStore.magasinChoisi.nomMagasin }}, mais disponible ailleurs
                </span>
                <span v-else>
                  Pas disponible en magasin
                </span>
              </p>
            </template>
          </div>
        </div>

        <div class="actions-area">
          <button 
            v-if="selectedTaille && appStore.magasinChoisi && isAvailableOnline" 
            class="btn-black"
            @click="addToCart"
          >
            » AJOUTER AU PANIER
          </button>

          <button class="btn-white" @click="handleStoreAction">
            {{ storeButtonText }}
          </button>
        </div>

        <StoreLocator ref="storeLocatorRef" @storeSelected="handleStoreSelection" />

        <div class="color-section" v-if="variantesCouleurs.length > 0">
          <h3 class="section-label">ÉGALEMENT DISPONIBLE EN</h3>
          <div class="color-grid">
            <RouterLink 
              v-for="v in variantesCouleurs" 
              :key="v.reference"
              :to="{ name: 'visualize', params: { id: v.reference.trim() }}"
              class="color-dot-wrapper"
              :class="{ 'active-color': v.reference.trim() === reference }"
            >
              <span 
                class="color-dot" 
                :style="{ backgroundColor: '#' + (v.idCouleurNavigation?.hexaCouleur || 'CCC') }"
              ></span>
            </RouterLink>
          </div>
        </div>

        <div class="battery-section" v-if="variantesBatteries.length > 0">
          <h3 class="section-label">BATTERIE :</h3>
          <div class="battery-grid">
            <RouterLink 
              v-for="v in variantesBatteries" 
              :key="v.reference"
              :to="{ name: 'visualize', params: { id: v.reference.trim() }}"
              class="battery-box"
              :class="{ 'active': v.idBatterie === article.idBatterie }"
            >
              {{ v.idBatterieNavigation.capaciteBatterie }} WH
            </RouterLink>
          </div>
        </div>

        <div class="battery-section" v-if="batterieInfo">
          <h3 class="section-label">DÉTAILS ÉLECTRIQUES</h3>
          <div class="battery-card">
            <div class="battery-row">
              <span class="batt-label">Modèle :</span>
              <span class="batt-val">{{ batterieInfo.nomBatterie || 'Standard' }}</span>
            </div>
            <div class="battery-row">
              <span class="batt-label">Capacité :</span>
              <span class="batt-val">{{ batterieInfo.capacite || batterieInfo.capaciteBatterie }} Wh</span>
            </div>
          </div>
        </div>

      </div>
    </div>


    <div v-if="isVelo" class="calculator-integration-wrapper">
      <div class="calculator-header">
        <h2 class="section-label">CALCULATEUR DE TAILLE</h2>
        <p>Trouvez la géométrie parfaite pour votre morphologie</p>
      </div>
      <div class="calculator-box">
        <CubeCalculator />
      </div>
    </div>

    <div class="similar-section" v-if="articlesSimilaires.length > 0">
      <h2 class="section-label">ARTICLES SIMILAIRES</h2>
      <div class="similar-grid">
        <RouterLink 
          v-for="sim in articlesSimilaires" 
          :key="sim.reference"
          :to="{ name: 'visualize', params: { id: sim.reference.trim() } }"
          class="similar-card"
        >
          <div class="similar-img-wrapper">
            <img :src="getLocalImage(sim.reference, 1)" :alt="sim.nomArticle" class="similar-img" />
          </div>
          <div class="similar-info">
            <h4 class="similar-name">{{ sim.nomArticle }}</h4>
            <span class="similar-price">{{ sim.prix?.toLocaleString() }} €</span>
          </div>
        </RouterLink>
      </div>
    </div>

    <div class="modal-overlay" v-if="showCartModal" @click.self="showCartModal = false">
      <div class="modal-content">
        <button class="modal-close" @click="showCartModal = false">✖</button>
        <div class="modal-icon">✓</div>
        <h3>Ajouté au panier</h3>
        <p><strong>{{ article.nomArticle }}</strong> (Taille : {{ selectedTaille?.idTailleNavigation.taille1.trim() }}) a bien été ajouté à votre panier.</p>
        
        <div class="modal-actions">
          <button class="btn-continue" @click="showCartModal = false">CONTINUER MES ACHATS</button>
          <button class="btn-cart" @click="router.push({ name: 'CartView' })">VOIR MON PANIER</button>
        </div>
      </div>
    </div>

  </div>
  <div v-else-if="loading" class="loader-container">
    <div class="bike-wheel"></div>
    <div class="loading-text">CHARGEMENT...</div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
.visualize-page { max-width: 1400px; margin: 100px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
.product-hero { display: grid; grid-template-columns: 1.6fr 1.2fr; gap: 0; background: #fff; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
.needs-size { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
.needs-size .section-label { color: #ff3333; transition: color 0.3s; }
.needs-size .size-box { border-color: #ff3333; background-color: #fffafa; transition: all 0.3s; }

.gallery-column { padding: 40px; }
.main-image-wrapper { position: relative; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 500px; border: 1px solid #f0f0f0; }
.main-view { max-width: 90%; max-height: 500px; object-fit: contain; }
.nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: #fff; border: 1px solid #ddd; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 5; }
.prev { left: 10px; } .next { right: 10px; }
.thumbnails-row { display: flex; justify-content: center; gap: 10px; margin: 20px 0 60px; }
.thumbnails-row img { width: 70px; height: 70px; object-fit: contain; border: 1px solid #eee; cursor: pointer; padding: 5px; }
.thumbnails-row img.active { border-color: #000; border-width: 2px; }

.zoom-cursor { cursor: zoom-in; transition: transform 0.3s ease; }
.zoom-cursor:hover { transform: scale(1.02); }
.zoom-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.98); z-index: 2000; display: flex; justify-content: center; align-items: center; cursor: zoom-out; animation: fadeIn 0.2s ease-out; }
.zoom-container { max-width: 90vw; max-height: 90vh; display: flex; justify-content: center; align-items: center; }
.zoom-img { max-width: 100%; max-height: 90vh; object-fit: contain; box-shadow: 0 10px 50px rgba(0,0,0,0.1); cursor: default; }
.close-zoom { position: absolute; top: 30px; right: 40px; background: none; border: none; font-size: 2rem; cursor: pointer; color: #000; z-index: 2100; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.highlight-column { background-color: rgba(0, 207, 232, 0.1) !important; border-left: 1px solid rgba(0, 207, 232, 0.3); border-right: 1px solid rgba(0, 207, 232, 0.3); position: relative; }
th.highlight-column { color: #00CFE8; background-color: rgba(0, 207, 232, 0.15) !important; }
.geo-table tr:hover td.highlight-column { background-color: rgba(0, 207, 232, 0.2) !important; }

.purchase-column { background: #f2f2f2; padding: 40px; display: flex; flex-direction: column; }
.saison-badge { display: inline-block; border: 1px solid #000; padding: 5px 10px; font-weight: 900; font-size: 0.75rem; width: fit-content; margin-bottom: 20px; background: #fff; }
.product-title { font-size: 3.2rem; font-weight: 900; font-style: italic; text-transform: uppercase; margin: 5px 0 15px; line-height: 1; }
.meta-info { font-size: 0.8rem; color: #888; margin-bottom: 30px; font-weight: 700; }
.section-label { font-weight: 900; font-style: italic; font-size: 1rem; margin-bottom: 15px; }

.size-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
.size-box { border: 1px solid #e0e0e0; padding: 15px; text-align: center; cursor: pointer; border-radius: 8px; background: #fff; }
.size-box.active { border-color: #000; border-width: 2px; }
.size-box.out { background: #f9f9f9; color: #ccc; cursor: not-allowed; }
.s-name { display: block; font-weight: 900; font-size: 1.1rem; }
.s-range { font-size: 0.7rem; }

.price-val { font-size: 2.2rem; font-weight: 900; font-style: italic; display: block; margin-bottom: 20px; }
.legend-title { font-size: 0.7rem; font-weight: 900; margin-bottom: 10px; }
.status-line { display: flex; align-items: center; font-size: 0.85rem; margin: 6px 0; color: #aaa; }
.status-line.ok { color: #000; font-weight: 600; }
.status-line.err { color: #000; font-weight: 600; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #ccc; margin-right: 10px; }
.ok .dot { background: #7ED321; }
.err .dot { background: #FF0000; }
.availability-legend { margin-bottom: 25px; }

.btn-black, .btn-white { width: 100%; padding: 20px; font-weight: 900; font-style: italic; cursor: pointer; border: none; margin-bottom: 10px; clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%); }
.btn-black { background: #000; color: #fff; margin-bottom: 25px;}
.btn-white { color: #000; border: 1px solid #000; background: transparent;}

.accordion-item { border-top: 1px solid #eee; }
.accordion-header { display: flex; justify-content: space-between; padding: 25px 0; cursor: pointer; align-items: center; }
.accordion-header h2 { font-size: 1.3rem; font-weight: 900; font-style: italic; margin: 0; }
.icon-circle { width: 30px; height: 30px; border: 1px solid #000; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 400; }
.group-title { background: #f5f5f5; text-align: center; padding: 10px; font-size: 0.8rem; font-weight: 900; font-style: italic; letter-spacing: 2px; }
.tech-row { display: flex; padding: 15px; border-bottom: 1px solid #f9f9f9; font-size: 0.9rem; }
.tech-label { width: 35%; font-weight: 900; text-transform: uppercase; font-size: 0.75rem; }
.geo-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.geo-table th, .geo-table td { padding: 12px; text-align: center; border-bottom: 1px solid #eee; }
.sticky-col { position: sticky; left: 0; background: #fff; font-weight: 900; text-align: left !important; }
.text-block { line-height: 1.7; color: #444; padding-bottom: 30px; }
.loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  z-index: 9999; 
}

.bike-wheel {
  width: 60px;
  height: 60px;
  border: 6px solid #2c3e50; 
  border-radius: 50%;
  position: relative;
  animation: spin 1.2s linear infinite;
}

.bike-wheel::before {
  content: '';
  position: absolute;
  top: 50%; 
  left: 50%;
  width: 46px; 
  height: 46px;
  transform: translate(-50%, -50%);
  border: 3px dashed #7f8c8d; 
  border-radius: 50%;
}

.bike-wheel::after {
  content: '';
  position: absolute;
  top: 50%; 
  left: 50%;
  width: 12px; 
  height: 12px;
  background-color: rgb(17, 163, 221);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.loading-text {
  margin-top: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-weight: 800;
  color: #2c3e50;
  letter-spacing: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.color-section { padding-top: 20px; }
.color-grid { display: flex; gap: 15px; margin-top: 10px; }
.color-dot-wrapper { padding: 3px; border: 2px solid transparent; border-radius: 50%; display: flex; transition: 0.2s; }
.color-dot-wrapper.active-color { border-color: #000; }
.color-dot { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; display: block; }

.battery-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
.battery-grid { display: flex; gap: 12px; margin-top: 10px; }
.battery-box { text-decoration: none; border: 1px solid #e0e0e0; padding: 12px 25px; font-weight: 900; font-style: italic; background: #fff; color: #ccc; font-size: 0.9rem; transition: all 0.2s ease; cursor: pointer; }
.battery-box.active { border: 2px solid #000; color: #000; }
.battery-box:hover:not(.active) { border-color: #999; color: #666; }
.battery-card { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.battery-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.95rem; }
.battery-row:last-child { margin-bottom: 0; }
.batt-label { font-weight: 700; color: #666; text-transform: uppercase; font-size: 0.8rem; }
.batt-val { font-weight: 900; color: #000; }

.help-circle { background: #00CFE8; color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 0.7rem; margin-left: 5px; cursor: help; }

/* Articles Similaires */
.similar-section { margin-top: 80px; padding-top: 40px; border-top: 1px solid #eee; }
.similar-section .section-label { font-size: 1.5rem; margin-bottom: 30px; text-align: center; }
.similar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 30px; }
.similar-card { text-decoration: none; color: inherit; background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; }
.similar-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.similar-img-wrapper { background: #f9f9f9; padding: 20px; display: flex; justify-content: center; align-items: center; height: 200px; }
.similar-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.similar-info { padding: 20px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; }
.similar-name { font-weight: 900; font-style: italic; font-size: 1rem; margin: 0 0 10px 0; text-transform: uppercase; }
.similar-price { font-weight: 700; color: #666; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); }
.modal-content { background: #fff; padding: 40px; border-radius: 12px; text-align: center; position: relative; max-width: 500px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes modalPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
.modal-close { position: absolute; top: 15px; right: 20px; font-size: 20px; background: none; border: none; cursor: pointer; color: #999; transition: color 0.2s; }
.modal-close:hover { color: #000; }
.modal-icon { width: 50px; height: 50px; background: #7ED321; color: white; font-size: 24px; line-height: 50px; border-radius: 50%; margin: 0 auto 20px; font-weight: bold; }
.modal-content h3 { font-weight: 900; font-style: italic; font-size: 1.5rem; margin-bottom: 10px; text-transform: uppercase; }
.modal-content p { color: #666; margin-bottom: 30px; font-size: 0.95rem; }
.modal-actions { display: flex; gap: 15px; }
.btn-continue, .btn-cart { flex: 1; padding: 15px; font-weight: 900; font-style: italic; font-size: 0.9rem; cursor: pointer; border: none; border-radius: 6px; transition: all 0.2s; clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%); }
.btn-continue { background: #f0f0f0; color: #000; }
.btn-continue:hover { background: #e0e0e0; }
.btn-cart { background: #000; color: #fff; }
.btn-cart:hover { background: #00a8e8; }

@media (max-width: 1000px) { .product-hero { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .modal-actions { flex-direction: column; } }

.calculator-integration-wrapper {
  margin: 60px 0;
  padding: 50px 20px;
  background-color: #f8f9fa; /* Fond gris très clair pour faire ressortir la zone */
  border-top: 1px solid #eaeaea;
  border-bottom: 1px solid #eaeaea;
}

.calculator-header {
  text-align: center;
  margin-bottom: 30px;
}

.calculator-header .section-label {
  font-size: 1.8rem;
  margin-bottom: 5px;
  color: #000;
}

.calculator-header p {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.calculator-box {
  max-width: 1100px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.04); /* Ombre douce et moderne */
  border: 1px solid #f0f0f0;
  overflow: hidden; /* Garde les bords arrondis propres */
  padding: 10px;
}
</style>