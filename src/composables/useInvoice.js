import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function useInvoice() {
  const API_BASE = 'https://apicube-epbsakembjgcghcp.francecentral-01.azurewebsites.net/api'


  const colors = {
    red: [204, 0, 0],
    black: [0, 0, 0],
    white: [255, 255, 255],
    gray: [240, 240, 240],
    darkGray: [100, 100, 100]
  }

  const downloadInvoice = async (commande, user) => {
    try {

      const resLignes = await fetch(`${API_BASE}/LigneCommande/GetByCommande/${commande.idCommande}`)
      let lignes = []
      if (resLignes.ok) {
        const data = await resLignes.json()
        lignes = data.$values || data || []
      }

      let magasin = null;
      try {
        const storedMagasin = localStorage.getItem('selectedStore'); 
        if (storedMagasin) {
          magasin = JSON.parse(storedMagasin);
        }
      } catch (e) {
        console.warn("Impossible de lire le magasin dans le localStorage", e);
      }

      const nomExpediteur = magasin?.nomAffiche || magasin?.nomMagasin || "CUBE BIKES FRANCE";
      const adresseExpediteur = magasin?.adresseAffiche || "123 Rue du Vélo";
      const cpVilleExpediteur = `${magasin?.cpAffiche || "75000"} ${magasin?.villeAffiche || "PARIS"}`.toUpperCase().trim();

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      doc.setFillColor(...colors.black);
      doc.triangle(0, 0, 210, 0, 0, 50, 'F');
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(...colors.white);
      doc.setFontSize(35);
      doc.setFont("helvetica", "bolditalic");
      doc.text("CUBE", 14, 25);
      
      doc.setDrawColor(...colors.red);
      doc.setLineWidth(1.5);
      doc.line(14, 28, 45, 28);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("NUMÉRO DE FACTURE", 196, 15, { align: "right" });
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bolditalic");
      doc.text(String(commande.idCommande).padStart(6, '0'), 196, 22, { align: "right" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Date : ${new Date(commande.dateCommande).toLocaleDateString('fr-FR')}`, 196, 28, { align: "right" });

      const addressY = 60;

      doc.setFillColor(...colors.red);
      doc.rect(14, addressY, 2, 25, 'F');
      doc.setFillColor(...colors.black);
      doc.rect(105, addressY, 2, 25, 'F');

      doc.setTextColor(...colors.black);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bolditalic");
      doc.text("ÉMETTEUR (MAGASIN CUBE)", 20, addressY + 4);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(nomExpediteur, 20, addressY + 10);
      doc.setFont("helvetica", "normal");
      doc.text(adresseExpediteur, 20, addressY + 15);
      doc.text(cpVilleExpediteur, 20, addressY + 20);

      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(11);
      doc.text("DESTINATAIRE (FACTURÉ À)", 111, addressY + 4);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${user.prenomClient} ${user.nomClient.toUpperCase()}`, 111, addressY + 10);
      doc.setFont("helvetica", "normal");
      doc.text(user.emailClient, 111, addressY + 15);
      if (user.tel) doc.text(user.tel, 111, addressY + 20);

      const tableData = lignes.map(ligne => [
        ligne.reference.trim(),
        ligne.referenceNavigation?.nomArticle.toUpperCase() || 'ARTICLE',
        ligne.tailleSelectionnee.trim(),
        ligne.quantiteArticleCommande,
        `${ligne.prixUnitaireArticle.toFixed(2)} €`,
        `${(ligne.prixUnitaireArticle * ligne.quantiteArticleCommande).toFixed(2)} €`
      ])

      autoTable(doc, {
        startY: 100,
        head: [['RÉF', 'DÉSIGNATION', 'TAILLE', 'QTÉ', 'PRIX UNIT.', 'TOTAL TTC']],
        body: tableData,
        theme: 'grid', 
        headStyles: { 
          fillColor: colors.black, 
          textColor: colors.white, 
          fontStyle: 'bolditalic', 
          fontSize: 9,
          halign: 'center',
          cellPadding: 4
        },
        bodyStyles: { 
          textColor: colors.black, 
          fontSize: 9,
          borderColor: [220, 220, 220]
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: colors.red }
        },
        alternateRowStyles: {
          fillColor: colors.gray
        },
        afterPageContent: (data) => {
          doc.setDrawColor(...colors.red);
          doc.setLineWidth(0.5);
          doc.line(data.settings.margin.left, data.table.head[0].y + data.table.head[0].height, 210 - data.settings.margin.right, data.table.head[0].y + data.table.head[0].height);
        }
      })

      const finalY = doc.lastAutoTable.finalY + 15;
      const totalBoxWidth = 80;
      const totalBoxX = 210 - 14 - totalBoxWidth;


      doc.setFillColor(...colors.gray);
      doc.triangle(totalBoxX, finalY, totalBoxX + 10, finalY, totalBoxX + 10, finalY + 25, 'F');
      doc.rect(totalBoxX + 10, finalY, totalBoxWidth - 10, 25, 'F');
      
      doc.setDrawColor(...colors.black);
      doc.setLineWidth(1);
      doc.line(totalBoxX, finalY, 210 - 14, finalY);
      doc.line(210 - 14, finalY, 210 - 14, finalY + 25);
      doc.line(totalBoxX + 10, finalY + 25, 210 - 14, finalY + 25);
      doc.line(totalBoxX, finalY, totalBoxX + 10, finalY + 25);

      doc.setTextColor(...colors.black);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bolditalic");
      doc.text("TOTAL NET TTC", totalBoxX + 15, finalY + 10);

      doc.setTextColor(...colors.red);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bolditalic");
      doc.text(`${commande.montantTotalCommande.toFixed(2)} €`, totalBoxX + 15, finalY + 20);

      doc.setFillColor(...colors.black);
      doc.triangle(0, 297, 210, 297, 210, 280, 'F'); 
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(`Facture générée numériquement le ${new Date().toLocaleDateString('fr-FR')} - CUBE Bikes France`, 14, 290);
      
      doc.setTextColor(...colors.white);
      doc.setFont("helvetica", "bolditalic");
      doc.text(`Merci pour votre confiance, ${user.prenomClient}.`, 196, 292, { align: "right" });

      doc.save(`Facture_CUBE_${String(commande.idCommande).padStart(6, '0')}.pdf`)

    } catch (error) {
      console.error("Erreur lors de la génération de la facture :", error)
      alert("Impossible de générer la facture pour le moment.")
    }
  }

  return { downloadInvoice }
}