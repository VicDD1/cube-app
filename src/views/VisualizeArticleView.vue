  <script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const reference = route.params.id?.trim()
  const article = ref(null)
  const loading = ref(true)

  // L'image actuellement affichée en grand
  const selectedImage = ref('')

  const isVelo = computed(() => reference?.length === 6)
  const folder = computed(() => isVelo.value ? 'VELOS' : 'ACCESSOIRES')

  // Fonction pour générer le chemin local (image_1, image_2, etc.)
  const getLocalImage = (ref, index = 1) => {
    try {
      return new URL(`../assets/images/${folder.value}/${ref}/image_${index}.webp`, import.meta.url).href
    } catch (e) {
      return 'https://via.placeholder.com/600x400?text=Image+Manquante'
    }
  }

  const fetchDetails = async () => {
    loading.value = true
    try {
      const endpoint = isVelo.value ? 'VarianteVelo/GetFullDetails' : 'Accessoire/GetDetails'
      const url = `https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/${endpoint}/${reference}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Produit introuvable.")
      
      article.value = await response.json()
      
      // Par défaut, on affiche l'image_1 de ton dossier local
      selectedImage.value = getLocalImage(reference, 1)

    } catch (err) {
      console.error("Erreur chargement:", err)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchDetails)
  </script>

  <template>
    <div class="visualize-page" v-if="article">
      <div class="product-layout">
        
        <div class="gallery-container">
          <div class="main-image-wrapper">
            <img :src="selectedImage" class="main-view" />
          </div>
          
          <div class="thumbnails">
            <img 
              v-for="i in 4" 
              :key="i"
              :src="getLocalImage(reference, i)"
              @click="selectedImage = getLocalImage(reference, i)"
              :class="{ active: selectedImage === getLocalImage(reference, i) }"
              @error="(e) => e.target.style.display = 'none'" 
            />
          </div>
        </div>

        <div class="details-container">
          <p class="brand-path">CUBE / {{ folder }}</p>
          <h1 class="product-title">{{ article.nomArticle }}</h1>
          <p class="price-tag">{{ article.prix?.toLocaleString() }} €</p>

          <div class="description-box">
            <h3>Résumé</h3>
            <p>{{ article.idResumeNavigation?.contenuResume }}</p>
          </div>

          <div class="specs-table">
            <h3>Fiche Technique</h3>
            
            <div class="spec-row" v-if="isVelo">
              <span class="spec-label">Matériau</span>
              <span class="spec-value">{{ article.idModeleNavigation?.materiauCadre }}</span>
            </div>

            <div class="spec-row" v-if="article.poids">
              <span class="spec-label">Poids</span>
              <span class="spec-value">{{ article.poids }} kg</span>
            </div>

            <div class="spec-row" v-if="article.idCouleurNavigation">
              <span class="spec-label">Couleur</span>
              <span class="spec-value">{{ article.idCouleurNavigation.nomCouleur.trim() }}</span>
            </div>
            
            <div class="spec-row" v-if="!isVelo && article.materiau">
              <span class="spec-label">Composant</span>
              <span class="spec-value">{{ article.materiau }}</span>
            </div>
          </div>

          <button class="buy-btn">AJOUTER AU PANIER</button>
        </div>
      </div>
    </div>
  </template>

  <style scoped>
  /* (Styles identiques au précédent, avec un ajout pour masquer les miniatures manquantes) */
  .thumbnails img {
    width: 90px;
    height: 90px;
    object-fit: contain;
    background: white;
    border: 1px solid #eee;
    cursor: pointer;
    padding: 5px;
  }
  .thumbnails img.active { border: 2px solid #000; }

  .visualize-page { max-width: 1400px; margin: 120px auto; padding: 0 40px; font-family: 'Inter', sans-serif; }
  .product-layout { display: flex; gap: 60px; }

  /* Galerie */
  .gallery-container { flex: 1.5; }
  .main-image-wrapper {padding: 40px; border-radius: 4px; display: flex; justify-content: center; }
  .main-view { max-width: 100%; height: 500px; object-fit: contain; }
  .thumbnails { display: flex; gap: 10px; margin-top: 20px; overflow-x: auto; }
  .thumbnails img { width: 80px; height: 80px; object-fit: cover; cursor: pointer; border: 2px solid transparent;}
  .thumbnails img.active { border-color: #000; }

  /* Infos */
  .details-container { flex: 1; }
  .brand-path { font-weight: 700; font-size: 0.8rem; color: #888; text-transform: uppercase; margin-bottom: 10px; }
  .product-title { font-size: 3rem; font-weight: 900; font-style: italic; text-transform: uppercase; line-height: 1; margin-bottom: 20px; }
  .price-tag { font-size: 2.2rem; font-weight: 900; margin-bottom: 30px; }

  .description-box h3, .specs-table h3 { font-size: 1rem; text-transform: uppercase; font-weight: 900; margin-bottom: 15px; border-bottom: 2px solid #000; display: inline-block; }
  .description-box { margin-bottom: 40px; line-height: 1.6; color: #444; }

  .spec-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  .spec-label { color: #888; font-weight: 600; text-transform: uppercase; }
  .spec-value { font-weight: 700; text-align: right; }

  .buy-btn { width: 100%; background: #000; color: #fff; border: none; padding: 25px; font-weight: 900; font-style: italic; font-size: 1.2rem; cursor: pointer; clip-path: polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%); margin-top: 40px; transition: 0.3s; }
  .buy-btn:hover { background: #333; transform: scale(1.02); }

  @media (max-width: 900px) {
    .product-layout { flex-direction: column; }}
  </style>