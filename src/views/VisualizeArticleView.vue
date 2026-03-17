<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import StoreLocator from '../components/StoreLocator.vue' // Vérifie le chemin
import { useAppStore } from '../stores/useStore'

const route = useRoute()
const appStore = useAppStore()

// On utilise une ref pour la référence pour qu'elle soit réactive au changement de couleur
const reference = computed(() => route.params.id?.trim())
const article = ref(null)
const caracteristiques = ref([])
const inventaire = ref([])
const variantesCouleurs = ref([])
const loading = ref(true)

const currentImgIndex = ref(1)
const isVelo = computed(() => reference.value?.length === 6)
const folder = computed(() => isVelo.value ? 'VELOS' : 'ACCESSOIRES')

const getLocalImage = (ref, index) => {
  try {
    return new URL(`../assets/images/${folder.value}/${ref}/image_${index}.webp`, import.meta.url).href
  } catch (e) {
    return 'https://via.placeholder.com/600x400?text=Image+Indisponible'
  }
}

const fichesTechniquesGroupees = computed(() => {
  const groupes = {}

  caracteristiques.value.forEach(item => {
    const groupe = item.idCaracteristiqueNavigation?.idGroupeCaracteristiqueNavigation?.nomGroupe || 'AUTRES'

    if (!groupes[groupe]) {
      groupes[groupe] = []
    }

    groupes[groupe].push(item)
  })

  return groupes
})

// --- GESTION GALERIE ---
const nextImage = () => {
  if (currentImgIndex.value < 4) currentImgIndex.value++
  else currentImgIndex.value = 1
}

const prevImage = () => {
  if (currentImgIndex.value > 1) currentImgIndex.value--
  else currentImgIndex.value = 4
}

const storeLocatorRef = ref(null)

const openStoreLocator = () => {
  storeLocatorRef.value?.toggle()
}

const handleStoreSelection = (magasin) => {
  console.log("Magasin sélectionné depuis la page article :", magasin)
  appStore.setMagasin(magasin) 
}

// --- GESTION ACHAT ---
const selectedTaille = ref(null)

// 1. Stock en ligne (pour le bouton Ajouter au panier)
const isAvailableOnline = computed(() => (selectedTaille.value?.quantiteStockEnLigne || 0) > 0)

// 2. Stock dans le magasin ACTUEL (choisi via Pinia)
const isAvailableInCurrentStore = computed(() => {
  if (!selectedTaille.value || !appStore.magasinChoisi || !selectedTaille.value.inventaireMagasins) return false
  
  const stockMagasin = selectedTaille.value.inventaireMagasins.find(
    m => m.idMagasin === appStore.magasinChoisi.idMagasin
  )
  return (stockMagasin?.quantiteStockMagasin || 0) > 0
})

// 3. Stock dans un AUTRE magasin (pour le point Orange/Jaune)
const isAvailableInOtherStores = computed(() => {
  if (!selectedTaille.value || !selectedTaille.value.inventaireMagasins) return false
  
  return selectedTaille.value.inventaireMagasins.some(m => 
    m.quantiteStockMagasin > 0 && m.idMagasin !== appStore.magasinChoisi?.idMagasin
  )
})

// 4. Stock global magasin
const isAvailableInAnyStore = computed(() => {
  if (!selectedTaille.value || !selectedTaille.value.inventaireMagasins) return false
  return selectedTaille.value.inventaireMagasins.some(m => m.quantiteStockMagasin > 0)
})

const selectTaille = (item) => { 
  selectedTaille.value = item 
}

const storeButtonText = computed(() => {
  // Si aucun magasin n'est dans le store Pinia
  if (!appStore.magasinChoisi) {
    return '» AJOUTER UN MAGASIN';
  }
  // Si un magasin est choisi mais qu'on veut en changer
  return '» CHANGER DE MAGASIN';
})

// --- ACCORDÉONS ---
const activeSection = ref('TECH')
const toggleSection = (s) => activeSection.value = activeSection.value === s ? null : s

// --- GEOMETRIE ---
const tableauGeometrie = ref({})
const listeTailles = ref([])

const fetchGeometries = async (idModele, tailles) => {
  const geoData = {}
  for (const taille of tailles) {
    try {
      const res = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/AGeometrie/GetByModeleAndTaille/${idModele}/${taille.idTaille}`)
      const data = await res.json()
      data.forEach(item => {
        const nom = item.idGeometrieNavigation.nomGeometrie
        if (!geoData[nom]) geoData[nom] = {}
        geoData[nom][taille.idTaille] = item.valeurGeometrie
      })
    } catch (e) { console.error(e) }
  }
  tableauGeometrie.value = geoData
}

const fetchData = async () => {
  loading.value = true
  try {
    const cleanRef = reference.value
    const endpoint = isVelo.value ? 'VarianteVelo/GetFullDetails' : 'Accessoire/GetDetails'
    
    const [resDetail, resCarac, resInv] = await Promise.all([
      fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/${endpoint}/${cleanRef}`),
      fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ACaracteristique/GetByArticle/${cleanRef}`),
      // ON CHANGE CETTE URL ICI :
      fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Articles/GetStock/${cleanRef}`)
    ])

    article.value = await resDetail.json()
    caracteristiques.value = await resCarac.json()
    
    // On récupère les données de l'API Articles/GetStock
    const stockData = await resInv.json()
    // On injecte les inventaires complets dans notre variable
    inventaire.value = stockData.articleInventaires 

    if (isVelo.value && article.value?.idModele) {
      const resModel = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/Modele/GetDetails/${article.value.idModele}`)
      const modelData = await resModel.json()
      variantesCouleurs.value = modelData.varianteVelos || []
      
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

watch(reference, () => {
    fetchData();
    currentImgIndex.value = 1;
    selectedTaille.value = null;
})

onMounted(() => {
  document.body.classList.add('force-white-header')
  fetchData()
})

onUnmounted(() => {
  document.body.classList.remove('force-white-header')
})
</script>

<template>
  <div class="visualize-page" v-if="article">
    
    <div class="product-hero">
      <div class="gallery-column">
        <div class="main-image-wrapper">
          <button class="nav-btn prev" @click="prevImage">&#10216;</button>
          <img :src="getLocalImage(reference, currentImgIndex)" class="main-view" />
          <button class="nav-btn next" @click="nextImage">&#10217;</button>
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

        <div class="size-section">
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
          <button v-if="selectedTaille && appStore.magasinChoisi && isAvailableOnline" class="btn-black">
            » AJOUTER AU PANIER
          </button>

          <button class="btn-white" @click="openStoreLocator">
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
      </div>
    </div>
  </div>
  <div v-else-if="loading" class="loader">CHARGEMENT...</div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
.visualize-page { max-width: 1400px; margin: 100px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
.product-hero { display: grid; grid-template-columns: 1.6fr 1fr; gap: 50px; }

/* Galerie */
.main-image-wrapper { position: relative; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 500px; border: 1px solid #f0f0f0; }
.main-view { max-width: 90%; max-height: 500px; object-fit: contain; }
.nav-btn { position: absolute; top: 50%; transform: translateY(-50%); background: #fff; border: 1px solid #ddd; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; z-index: 5; }
.prev { left: 10px; } .next { right: 10px; }
.thumbnails-row { display: flex; justify-content: center; gap: 10px; margin: 20px 0 60px; }
.thumbnails-row img { width: 70px; height: 70px; object-fit: contain; border: 1px solid #eee; cursor: pointer; padding: 5px; }
.thumbnails-row img.active { border-color: #000; border-width: 2px; }

/* Couleur de la colonne sélectionnée */
.highlight-column {
  background-color: rgba(0, 207, 232, 0.1) !important; /* Bleu très clair */
  border-left: 1px solid rgba(0, 207, 232, 0.3);
  border-right: 1px solid rgba(0, 207, 232, 0.3);
  position: relative;
}

/* Optionnel : mettre le texte en gras dans la colonne active */
th.highlight-column {
  color: #00CFE8;
  background-color: rgba(0, 207, 232, 0.15) !important;
}

/* Pour s'assurer que le survol fonctionne toujours bien */
.geo-table tr:hover td.highlight-column {
  background-color: rgba(0, 207, 232, 0.2) !important;
}

/* Achat */
.breadcrumb { font-size: 0.7rem; font-weight: 900; color: #999; }
.product-title { font-size: 3.2rem; font-weight: 900; font-style: italic; text-transform: uppercase; margin: 5px 0 15px; line-height: 1; }
.meta-info { font-size: 0.8rem; color: #888; margin-bottom: 30px; font-weight: 700; }
.section-label { font-weight: 900; font-style: italic; font-size: 1rem; margin-bottom: 15px; }
.size-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
.size-box { border: 1px solid #e0e0e0; padding: 15px; text-align: center; cursor: pointer; border-radius: 8px; }
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

.availability-legend {
  margin-bottom: 25px;
}

.btn-black, .btn-white { width: 100%; padding: 20px; font-weight: 900; font-style: italic; cursor: pointer; border: none; margin-bottom: 10px; clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%); }
.btn-black { background: #000; color: #fff; margin-bottom: 25px;}
.btn-white { color: #000; border: 1px solid #000; }

/* Accordéons */
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
.loader { padding: 100px; text-align: center; font-weight: 900; }

/* --- LAYOUT --- */
.product-hero { 
  display: grid; 
  grid-template-columns: 1.6fr 1.2fr; /* Ajustement largeur */
  gap: 0; /* On colle pour le fond gris */
  background: #fff;
}

.gallery-column { padding: 40px; }

.purchase-column { 
  background: #f2f2f2; /* FOND GRIS DEMANDÉ */
  padding: 40px;
  display: flex;
  flex-direction: column;
}

/* --- BADGE SAISON --- */
.saison-badge {
  display: inline-block;
  border: 1px solid #000;
  padding: 5px 10px;
  font-weight: 900;
  font-size: 0.75rem;
  width: fit-content;
  margin-bottom: 20px;
  background: #fff;
}

/* --- SECTION COULEURS --- */
.color-section { padding-top: 20px; }
.color-grid { display: flex; gap: 15px; margin-top: 10px; }

.color-dot-wrapper {
  padding: 3px;
  border: 2px solid transparent;
  border-radius: 50%;
  display: flex;
  transition: 0.2s;
}

.color-dot-wrapper.active-color { border-color: #000; }

.color-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
  cursor: pointer;
  display: block;
}

.help-circle {
  background: #00CFE8;
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-style: normal;
  font-size: 0.7rem;
  margin-left: 5px;
  cursor: help;
}

/* --- AJUSTEMENTS PRIX --- */
.price-box {
  margin: 30px 0;
  border-top: 1px solid #ddd;
  padding-top: 20px;
}

.dot { 
  width: 10px; 
  height: 10px; 
  border-radius: 50%; 
  background: #ccc; 
  margin-right: 10px; 
  display: inline-block;
}

/* Vert : Dispo Magasin Actuel */
.status-line.ok .dot { background: #7ED321 !important; }

/* Orange/Jaune : Dispo Ailleurs uniquement */
.status-line.warn .dot { background: #FFB300 !important; } 

/* Rouge : Dispo nulle part */
.status-line.err .dot { background: #FF0000 !important; }

.status-line { display: flex; align-items: center; font-size: 0.85rem; margin: 6px 0; color: #000; font-weight: 600; }

@media (max-width: 1000px) { .product-hero { grid-template-columns: 1fr; } }
</style>

<style>
/* OVERRIDE GLOBAL DU HEADER
  Ne s'active QUE sur cette page grâce à la classe sur le body !
*/
body.force-white-header .cube-header .main-nav {
  background-color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
  border-bottom: 1px solid transparent !important;
}

/* On force les textes en noir */
body.force-white-header .cube-header .main-link,
body.force-white-header .cube-header .shop-link,
body.force-white-header .cube-header .icon-btn {
  color: #000000 !important;
}

/* Mais on garde quand même ton bel effet bleu au survol ! */
body.force-white-header .cube-header .main-link:hover,
body.force-white-header .cube-header .shop-link:hover,
body.force-white-header .cube-header .icon-btn:hover {
  color: #00a8e8 !important;
}

/* On force le logo en noir */
body.force-white-header .cube-header .logo-img {
  filter: invert(100%) !important;
}
</style>