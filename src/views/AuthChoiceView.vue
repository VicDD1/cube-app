<template>
  <main class="auth-choice-page">
    <div class="choice-container">
      <header class="choice-header">
        <h1>REJOIGNEZ L'AVENTURE CUBE</h1>
        <div class="separator"></div>
        <p>Connectez-vous pour retrouver vos commandes ou créez un compte en quelques secondes.</p>
      </header>

      <div class="options-grid">
        <div class="option-card">
          <div class="icon-box">
            <i class="fas fa-user-check"></i>
          </div>
          <h2>DÉJÀ CLIENT ?</h2>
          <p>Accédez à votre profil et vos vélos enregistrés.</p>
          <router-link to="/login" class="btn-primary">SE CONNECTER</router-link>
        </div>

        <div class="option-card">
          <div class="icon-box">
            <i class="fas fa-user-plus"></i>
          </div>
          <h2>NOUVEAU ICI ?</h2>
          <p>Profitez de nos services exclusifs et du suivi de garantie.</p>
          <router-link to="/creer-compte" class="btn-outline">CRÉER UN COMPTE</router-link>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.auth-choice-page {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 100px;
  background-color: #f4f4f4;
  font-family: 'CubeFont', sans-serif;
  box-sizing: border-box;
  overflow: hidden; 
}

.choice-container {
  width: 90%;
  max-width: 900px;
  text-align: center;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.choice-header h1 {
  font-size: 28px;
  font-weight: 900;
  font-style: italic;
  margin-bottom: 10px;
}

.separator {
  width: 60px;
  height: 5px;
  background: #00a8e8;
  margin: 0 auto 20px auto;
}

.choice-header p {
  color: #666;
  margin-bottom: 50px;
}

.options-grid {
  display: flex;
  gap: 30px;
}

.option-card {
  flex: 1;
  background: white;
  padding: 40px;
  border-radius: 4px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease;
  border-bottom: 4px solid transparent;
}

.option-card:hover {
  transform: translateY(-10px);
  border-bottom: 4px solid #000;
}

.option-card h2 {
  font-size: 18px;
  font-weight: 800;
  margin: 20px 0 10px 0;
}

.option-card p {
  font-size: 14px;
  color: #888;
  margin-bottom: 30px;
  height: 40px; /* Aligne les boutons */
}

.btn-primary, .btn-outline {
  width: 100%;
  padding: 15px;
  text-decoration: none;
  font-weight: 800;
  font-style: italic;
  font-size: 14px;
  transition: 0.3s;
}

.btn-primary {
  background: #000;
  color: #fff;
}

.btn-primary:hover {
  background: #00a8e8;
}

.btn-outline {
  border: 2px solid #000;
  color: #000;
}

.btn-outline:hover {
  background: #000;
  color: #fff;
}

@media (max-width: 768px) {
  .options-grid { flex-direction: column; }
}
</style>