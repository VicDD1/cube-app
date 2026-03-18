<script setup>
import { ref, computed, watch, nextTick, markRaw } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '../stores/useStore' // L'import vital qui manquait

const appStore = useAppStore() // L'initialisation du store

const emit = defineEmits(['storeSelected'])

const isVisible = ref(false)
const currentView = ref('list')
const map = ref(null)
const markersLayer = ref(null)
const mapContainer = ref(null)

const magasins = ref([])
const userCoords = ref(null)
const searchQuery = ref('')
const onlyInStock = ref(false)
const gpsStatus = ref('Recherche de votre position...')

const greenIcon = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png", shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })
const blueIcon = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png", shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })
const redIcon = new L.Icon({ iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png", shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })

const toggle = () => {
  isVisible.value = !isVisible.value
  if (isVisible.value) {
    document.body.style.overflow = "hidden"
    onlyInStock.value = false 
    if (!magasins.value.length) fetchMagasins()
    
    if (!map.value) {
      nextTick(initMap)
    } else {
      setTimeout(() => {
        if (map.value) map.value.invalidateSize()
      }, 150)
    }
  } else {
    document.body.style.overflow = ""
  }
}

defineExpose({ toggle })

const selectStore = (magasin) => {
  
  emit('storeSelected', magasin)
  toggle()
 
}

const fetchMagasins = async () => {
  try {
    const res = await fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/MagasinPartenaire/GetMagasins')
    const data = await res.json()
    let magasinsDeBase = data.$values || data || []

    const rawMagasins = await Promise.all(
      magasinsDeBase.map(async (mag) => {
        try {
          const detailRes = await fetch(`https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/MagasinPartenaire/GetDetails/${mag.idMagasin}`)
          return await detailRes.json()
        } catch (e) { return mag }
      })
    )

    magasins.value = rawMagasins.map(mag => {
      const nom = mag.nomMagasin || mag.nom || 'Magasin Inconnu'
      let adresseDetail = mag.idAdresses && mag.idAdresses.length > 0 ? mag.idAdresses[0] : mag
      return {
        ...mag,
        nomAffiche: nom,
        adresseAffiche: adresseDetail.adresseMagasin || adresseDetail.adresse || adresseDetail.rue || '',
        villeAffiche: adresseDetail.villeMagasin || adresseDetail.ville || '',
        cpAffiche: adresseDetail.codePostal || adresseDetail.cp || '',
        coords: null 
      }
    })

    for (let i = 0; i < magasins.value.length; i++) {
      const mag = magasins.value[i]
      const queryText = `${mag.adresseAffiche} ${mag.cpAffiche} ${mag.villeAffiche}`.trim()

      if (queryText && queryText.length > 5) {
        await new Promise(r => setTimeout(r, 100))
        const query = encodeURIComponent(queryText)
        try {
          const geoRes = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${query}&limit=1`)
          const geoData = await geoRes.json()
          
          if (geoData.features?.length > 0) {
            magasins.value[i].coords = {
              lat: geoData.features[0].geometry.coordinates[1],
              lng: geoData.features[0].geometry.coordinates[0]
            }
            updateMapMarkers()
          }
        } catch (err) { }
      }
    }
  } catch (e) { console.error("Erreur chargement magasins:", e) }
}

const initMap = () => {
  if (!mapContainer.value || map.value) return
  
  const m = L.map(mapContainer.value).setView([46.603354, 1.888334], 5)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(m)
  
  map.value = markRaw(m)
  markersLayer.value = markRaw(L.layerGroup().addTo(map.value))

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoords.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        gpsStatus.value = "Position trouvée"
        L.marker([pos.coords.latitude, pos.coords.longitude], { icon: redIcon })
          .addTo(map.value)
          .bindPopup("<b>Votre position</b>").openPopup()
        map.value.setView([pos.coords.latitude, pos.coords.longitude], 9)
      },
      (err) => { gpsStatus.value = "Position non détectée" }
    )
  } else { gpsStatus.value = "GPS non supporté" }
}

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const magasinsFiltres = computed(() => {
  let list = magasins.value.map(m => ({ ...m })) 

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m => m.nomAffiche.toLowerCase().includes(q) || m.villeAffiche.toLowerCase().includes(q))
  }

  // Filtrage intelligent "En Stock" connecté au Store Pinia
  if (onlyInStock.value && appStore.currentBikeInventory) {
    list = list.filter(magasin => {
      return appStore.currentBikeInventory.some(tailleInventaire => {
        const stockMagasin = tailleInventaire.inventaireMagasins?.find(m => m.idMagasin === magasin.idMagasin)
        return stockMagasin && stockMagasin.quantiteStockMagasin > 0
      })
    })
  }
  
  if (userCoords.value) {
    list.forEach(m => {
      if (m.coords) m.distance = getDistance(userCoords.value.lat, userCoords.value.lng, m.coords.lat, m.coords.lng)
    })
    list.sort((a, b) => (a.distance || 99999) - (b.distance || 99999))
  }
  return list
})

watch(magasinsFiltres, () => { updateMapMarkers() }, { deep: true })

const updateMapMarkers = () => {
  if (!markersLayer.value || !map.value) return
  markersLayer.value.clearLayers()

  magasinsFiltres.value.forEach((mag, index) => {
    if (mag.coords) {
      const isTop2 = userCoords.value && index < 2
      const marker = L.marker([mag.coords.lat, mag.coords.lng], { icon: isTop2 ? greenIcon : blueIcon })
      
      const popupDiv = document.createElement('div')
      popupDiv.innerHTML = `
        <div style="text-align:center; font-family:'Inter', sans-serif;">
          <b style="font-size:14px;">${mag.nomAffiche}</b><br>
          <span style="color:#666;">${mag.villeAffiche}</span><br>
          <button class="btn-popup-select" style="margin-top:10px; background:#000; color:#fff; border:none; padding:8px 12px; width:100%; font-weight:bold; font-style:italic; cursor:pointer;">SÉLECTIONNER</button>
        </div>
      `
      
      const btn = popupDiv.querySelector('.btn-popup-select')
      btn.addEventListener('click', () => { selectStore(mag) })

      marker.bindPopup(popupDiv)
      markersLayer.value.addLayer(marker)
    }
  })
  
  if (currentView.value === 'map') { map.value.invalidateSize() }
}

const switchView = (view) => {
  currentView.value = view
  if (view === 'map' && map.value) { setTimeout(() => map.value.invalidateSize(), 100) }
}
</script>

<template>
  <div v-show="isVisible" class="sl-overlay" @click.self="toggle">
    <div class="sl-modal">
      <button class="sl-close" @click="toggle">✖</button>
      
      <div class="sl-header">
        <h2>CHOISIR UN MAGASIN</h2>
        <div class="sl-controls">
          <input type="text" v-model="searchQuery" placeholder="Ville, nom du magasin..." class="sl-search">
          
          <label v-if="appStore.currentBikeInventory" class="sl-toggle">
            <input type="checkbox" v-model="onlyInStock"> <span>En stock pour ce modèle</span>
          </label>
        </div>
        
        <div class="sl-tabs">
          <button :class="{ active: currentView === 'list' }" @click="switchView('list')">LISTE</button>
          <button :class="{ active: currentView === 'map' }" @click="switchView('map')">CARTE</button>
        </div>
      </div>

      <div class="sl-content">
        <div v-show="currentView === 'list'" class="sl-list">
          <div class="gps-status">{{ gpsStatus }}</div>

          <div v-for="(mag, index) in magasinsFiltres" :key="mag.idMagasin || index" class="sl-card" :class="{'top-closest': userCoords && index < 2}">
            <div v-if="userCoords && index < 2" class="badge-proche">📍 Les plus proches</div>
            <h3>{{ mag.nomAffiche }}</h3>
            <p>{{ mag.adresseAffiche }} <br> {{ mag.cpAffiche }} {{ mag.villeAffiche }}</p>
            <p v-if="mag.distance" class="sl-distance">{{ mag.distance.toFixed(1) }} km</p>
            <button class="btn-select" @click="selectStore(mag)">SÉLECTIONNER</button>
          </div>
          <div v-if="!magasinsFiltres.length" class="empty-state">Aucun magasin trouvé.</div>
        </div>

        <div v-show="currentView === 'map'" class="sl-map-container">
          <div ref="mapContainer" class="leaflet-map"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sl-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(0,0,0,0.5); z-index: 1000; 
  display: flex; justify-content: flex-end; 
  align-items: flex-start;
}

.sl-modal { 
  background: #fff; 
  width: 30%; 
  min-width: 400px; 
  height: 100vh; 
  display: flex; flex-direction: column; position: relative; 
  font-family: 'Inter', sans-serif;
  box-shadow: -5px 0 25px rgba(0,0,0,0.1);
  animation: slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.sl-close { position: absolute; top: 15px; right: 20px; font-size: 28px; background: none; border: none; cursor: pointer; color: #000; z-index: 10;}
.sl-close:hover { color: #00A3E0; }

.sl-header { padding: 40px 30px 20px; border-bottom: 1px solid #eee; }
.sl-header h2 { font-style: italic; font-weight: 900; margin-top: 0; text-transform: uppercase; font-size: 1.4rem;}

.sl-controls { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }
.sl-search { width: 100%; padding: 12px; border: 1.5px solid #ccc; font-family: 'Inter', sans-serif; font-weight: 700; box-sizing: border-box; outline: none; border-radius: 4px; transition: border 0.3s;}
.sl-search:focus { border-color: #000; }
.sl-toggle { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }

.sl-tabs { display: flex; border-bottom: 2px solid #eee; }
.sl-tabs button { flex: 1; background: none; border: none; padding: 15px; font-weight: 800; cursor: pointer; font-style: italic; font-size: 1rem; color: #888; transition: color 0.3s;}
.sl-tabs button.active { border-bottom: 3px solid #000; color: #000; }

.sl-content { flex: 1; display: flex; overflow: hidden; background: #f9f9f9; }

.sl-list { flex: 1; overflow-y: auto; padding: 20px; }
.gps-status { font-size: 12px; color: #888; margin-bottom: 15px; font-style: italic; }

.sl-card { background: #fff; padding: 20px; margin-bottom: 15px; border: 1px solid #eaeaea; position: relative; transition: 0.3s; border-radius: 8px;}
.sl-card.top-closest { border: 2px solid #000; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.badge-proche { position: absolute; top: -10px; left: 15px; background: #000; color: #fff; font-size: 10px; padding: 4px 10px; font-weight: 900; text-transform: uppercase; border-radius: 20px;}

.sl-card h3 { margin: 0 0 10px 0; font-size: 1.1rem; font-weight: 900; text-transform: uppercase;}
.sl-card p { margin: 5px 0; font-size: 0.9rem; color: #555; line-height: 1.4;}
.btn-select { background: #000; color: #fff; border: none; padding: 10px; width: 100%; cursor: pointer; font-weight: 900; margin-top: 15px; font-style: italic; border-radius: 4px; transition: background 0.3s;}
.btn-select:hover { background: #00A3E0; }

.sl-distance { position: absolute; top: 20px; right: 20px; font-weight: 900; color: #00A3E0; font-size: 1rem; }
.empty-state { text-align: center; padding: 40px 20px; font-weight: 700; color: #888; }

.sl-map-container { flex: 1; display: flex; }
.leaflet-map { width: 100%; height: 100%; z-index: 1;}
</style>