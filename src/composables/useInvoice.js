import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function useInvoice() {
  const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'

  const downloadInvoice = async (commande, user) => {
    try {
      // 1. Récupérer les lignes de la commande
      const resLignes = await fetch(`${API_BASE}/LigneCommande/GetByCommande/${commande.idCommande}`)
      let lignes = []
      if (resLignes.ok) {
        const data = await resLignes.json()
        lignes = data.$values || data || []
      }

      // 2. Initialiser le PDF
      const doc = new jsPDF()
      
      // En-tête de la facture
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.text("FACTURE", 14, 20)
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("CUBE BIKES FRANCE", 14, 30)
      doc.text("123 Rue du Vélo", 14, 35)
      doc.text("75000 PARIS", 14, 40)
      doc.text("TVA: FR123456789", 14, 45)

      // Infos Commande
      doc.setFont("helvetica", "bold")
      doc.text(`N° Commande : ${String(commande.idCommande).padStart(6, '0')}`, 120, 30)
      doc.setFont("helvetica", "normal")
      doc.text(`Date : ${new Date(commande.dateCommande).toLocaleDateString('fr-FR')}`, 120, 35)

      // Infos Client
      doc.setFont("helvetica", "bold")
      doc.text("FACTURÉ À :", 14, 60)
      doc.setFont("helvetica", "normal")
      doc.text(`${user.prenomClient} ${user.nomClient.toUpperCase()}`, 14, 65)
      doc.text(user.emailClient, 14, 70)
      if (user.tel) doc.text(user.tel, 14, 75)

      // Tableau des articles
      const tableData = lignes.map(ligne => [
        ligne.reference.trim(),
        ligne.referenceNavigation?.nomArticle || 'Article',
        ligne.tailleSelectionnee.trim(),
        ligne.quantiteArticleCommande,
        `${ligne.prixUnitaireArticle.toFixed(2)} €`,
        `${(ligne.prixUnitaireArticle * ligne.quantiteArticleCommande).toFixed(2)} €`
      ])

      autoTable(doc, {
        startY: 90,
        head: [['Réf', 'Désignation', 'Taille', 'Qté', 'Prix Unitaire', 'Total TTC']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0] },
        styles: { font: 'helvetica', fontSize: 9 }
      })

      // Totaux
      const finalY = doc.lastAutoTable.finalY + 10
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`TOTAL TTC : ${commande.montantTotalCommande.toFixed(2)} €`, 140, finalY)

      // Pied de page
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(150)
      doc.text("Merci pour votre confiance. CUBE BIKES.", 105, 280, { align: "center" })

      // Télécharger
      doc.save(`Facture_CUBE_${commande.idCommande}.pdf`)

    } catch (error) {
      console.error("Erreur lors de la génération de la facture :", error)
      alert("Impossible de générer la facture pour le moment.")
    }
  }

  return { downloadInvoice }
}