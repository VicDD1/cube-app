<template>
    <div class="chatbot-wrapper">
        <button class="chat-toggle-btn" @click="toggleChat" aria-label="Ouvrir le chat">
            💬
        </button>

        <div v-if="isOpen" class="chat-window">
            <div class="chat-header">
                <h3>Assistant Vélos</h3>
                <button @click="toggleChat" class="close-btn" aria-label="Fermer le chat">✖</button>
            </div>

            <div class="chat-messages" ref="messagesContainer">
                <div
                    v-for="(msg, index) in messages"
                    :key="index"
                    :class="['message-bubble', msg.role === 'user' ? 'user-msg' : 'bot-msg']"
                >
                    <div v-html="formatMessage(msg.text)"></div>
                </div>
                
                <div v-if="isLoading" class="message-bubble bot-msg typing-indicator">
                    L'assistant réfléchit...
                </div>
            </div>

            <div class="chat-input-area">
                <input
                    v-model="userInput"
                    @keyup.enter="sendMessage"
                    type="text"
                    placeholder="Rechercher un vélo, une commande..."
                    :disabled="isLoading"
                />
                <button @click="sendMessage" :disabled="isLoading || !userInput.trim()">
                    Envoyer
                </button>
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed } from 'vue'
import { ref, nextTick, onMounted } from 'vue';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAppStore } from '../stores/useStore';
const store = useAppStore();

// Configuration (À remplacer par votre clé)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const MODEL_NAME = "models/gemini-flash-lite-latest";

const isOpen = ref(false);
const userInput = ref(' ');
const isLoading = ref(false);
const messagesContainer = ref(null);
const bikeData = ref(null);
const messages = computed(() => store.chatMessages);
const inventoryData = ref(null);

// Récupération automatique au montage du composant
onMounted(async () => {
    try {
        // Chargement parallèle du catalogue et des inventaires
        const [resArticles, resInventory] = await Promise.all([
            fetch('/api-azure/api/Articles/GetCatalog'),
            fetch('https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api/ArticleInventaire/GetArticleInventaires')
        ]);

        bikeData.value = await resArticles.json();
        inventoryData.value = await resInventory.json();
        
        // On met à jour le premier message dans le store si besoin
        if (store.chatMessages.length <= 1) {
            store.chatMessages[0].text = "Je suis prêt ! Je connais nos vélos et leurs stocks en temps réel. Que cherchez-vous ?";
        }
    } catch (error) {
        console.error("Erreur de chargement des données:", error);
        if (store.chatMessages.length <= 1) {
            store.chatMessages[0].text = "Bonjour ! Je suis disponible pour répondre à vos questions générales.";
        }
    }
});

const toggleChat = () => { isOpen.value = !isOpen.value; };

// Fonction pour faire défiler automatiquement vers le bas
const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};
const formatMessage = (text) => {
    if (!text) return '';
  // Supprime les étoiles et dièses du Markdown
  // Remplace les \n par des balises <br> pour l'affichage HTML
    return text
    .replace(/[#*]/g, '') 
    .replace(/\n/g, '<br>'); 
};

const sendMessage = async () => {
    if (!userInput.value.trim() || isLoading.value) return;

    const text = userInput.value;
    messages.value.push({ role: 'user', text });
    userInput.value = '';
    isLoading.value = true;
    await scrollToBottom();

    try {
    // 1. Données du Store (Utilisateur, Magasin, Panier)
    const user = store.user; 
    const userInfo = user 
        ? `${user.prenomClient} ${user.nomClient} (${user.email})` 
        : "Client non connecté";
        
    const magasin = store.magasinChoisi ? store.magasinChoisi.nom : "Aucun magasin sélectionné";
    
    const panierLignes = store.panierVisiteur?.lignePaniers || [];
    const aDesArticles = panierLignes.length > 0;
    const panierStatus = aDesArticles 
        ? `Le panier contient ${panierLignes.length} article(s).` 
        : "Le panier est actuellement vide.";

    /// 2. Préparation du catalogue enrichi avec les stocks
const rawData = Array.isArray(bikeData.value) ? bikeData.value : [];
const rawInventory = Array.isArray(inventoryData.value) ? inventoryData.value : [];

const simplifiedCatalog = rawData.map(b => {
    const cleanRef = b.reference ? b.reference.trim() : "";

    // On cherche dans l'inventaire avec le bon nom de champ : quantiteStockEnLigne
    const stockItem = rawInventory.find(inv => 
        (inv.reference ? inv.reference.trim() : "") === cleanRef
    );

    return {
        nom: b.nomArticle,
        prix: b.prix,
        reference: cleanRef,
        poids: b.poids,
        // On utilise ici le champ exact de ton image
        stock: stockItem ? stockItem.quantiteStockEnLigne : 0 
    };
});

    // 3. Prompt System complet
    const promptSystem = `
        Tu es l'assistant expert de la boutique Cube.
        
        CONTEXTE CLIENT :
        - Utilisateur : ${userInfo}
        - Magasin : ${magasin}
        - Panier : ${panierStatus}
        
        CATALOGUE ET STOCKS RÉELS : ${JSON.stringify(simplifiedCatalog)}

        CONSIGNES :
        1. Si on te demande "Qui suis-je ?", réponds avec le nom : ${user?.nomClient || ''}, le prénom : ${user?.prenomClient || 'visiteur'} et l'email : ${user?.email || ''}.
        2. Pour le PANIER : 
            - Si vide, propose de découvrir le catalogue.
            - Si rempli, affiche : <a href="http://localhost:5173/panier" class="btn-cart">Voir mon panier 🛒</a>
        3. POUR LES STOCKS :
            - Tu dois IMPÉRATIVEMENT donner le chiffre exact du stock s'il est mentionné dans le catalogue.
            - Si "stock" > 0, écris : "En stock ([X] exemplaires disponibles)".
            - Si "stock" est 0, écris : "Actuellement indisponible".
            - Si l'utilisateur demande "combien en reste-t-il", utilise la valeur "stock" du catalogue.
        4. LIENS : Pour chaque vélo, ajoute : <a href="http://localhost:5173/produit/LA_REFERENCE" class="btn-product">Voir le produit</a>
        5. RÈGLE D'OR : Utilise le NOM ARTICLE EXACT du catalogue pour tes réponses.
    `;
        // 4. Appel API Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptSystem + " Question : " + text }]
                }]
            })
        
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const botReply = data.candidates[0].content.parts[0].text;
        store.addChatMessage({ role: 'bot', text: botReply });

    } catch (error) {
        console.error("Erreur Chatbot:", error);
        messages.value.push({ role: 'bot', text: "Je n'arrive pas à accéder à vos informations. Êtes-vous bien connecté ?" });
    }finally {
        isLoading.value = false;
        await scrollToBottom();
    }
};
</script>
<style scoped>

.btn-product, .btn-cart {
    display: inline-block;
    background-color: #007bff;
    color: white !important;
    padding: 8px 12px;
    border-radius: 5px;
    text-decoration: none;
    margin-top: 5px;
    font-weight: bold;
    font-size: 0.9em;
}

.btn-cart {
    background-color: #28a745; /* Vert pour le panier */
}
.chatbot-wrapper {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    font-family: Arial, sans-serif;
}

.chat-toggle-btn {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}

.chat-toggle-btn:hover {
    transform: scale(1.05);
}

.chat-window {
    position: absolute;
    bottom: 70px;
    right: 0;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.chat-header {
    background-color: #007bff;
    color: white;
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.chat-header h3 {
    margin: 0;
    font-size: 16px;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;
}

.chat-messages {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: #f8f9fa;
    overscroll-behavior: contain;
}

.message-bubble {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 15px;
    font-size: 14px;
    line-height: 1.4;
}

.user-msg {
    align-self: flex-end;
    background-color: #007bff;
    color: white;
    border-bottom-right-radius: 0;
}

.bot-msg {
    align-self: flex-start;
    background-color: #e9ecef;
    color: #333;
    border-bottom-left-radius: 0;
}

.typing-indicator {
    font-style: italic;
    color: #6c757d;
}

.chat-input-area {
    display: flex;
    padding: 10px;
    background: white;
    border-top: 1px solid #dee2e6;
}

.chat-input-area input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ced4da;
    border-radius: 20px;
    outline: none;
}

.chat-input-area button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0 15px;
    margin-left: 10px;
    border-radius: 20px;
    cursor: pointer;
}

.chat-input-area button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}
</style>