<template>
  <footer class="cube-footer">
    <div class="footer-columns">
      
      <div class="col">
        <h3>VÉLOS</h3>
        <ul>
          <li><a href="#">VTT</a></li>
          <li><a href="#">Route</a></li>
          <li><a href="#">Ville et Campagne</a></li>
          <li><a href="#">Enfants</a></li>
        </ul>
      </div>

      <div class="col">
        <h3>VÉLOS HYBRIDS</h3>
        <ul>
          <li><a href="#">VTTAE</a></li>
          <li><a href="#">Ville et Campagne</a></li>
          <li><a href="#">Enfants</a></li>
        </ul>
      </div>

      <div class="col">
        <h3>LÉGAL</h3>
        <ul>
          <li><a href="#">Politique de confidentialité et gestion des Cookies</a></li>
          <li><a href="#">Conditions Générales de Vente</a></li>
          <li><a href="#">Paramétrer les cookies</a></li>
        </ul>
      </div>

    </div>
  </footer>
</template>

<style scoped>
.cube-footer {
  background-color: #111;
  color: #999;
  padding: 60px 40px;
  font-family: Arial, sans-serif;
}

.footer-columns {
  display: flex;
  justify-content: space-around; /* Modifié pour mieux répartir les 3 colonnes restantes */
  flex-wrap: wrap;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.col h3 {
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  font-style: italic;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.col li {
  margin-bottom: 12px;
}

.col a {
  color: #999;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.col a:hover {
  color: #fff;
}
</style>