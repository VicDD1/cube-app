import { reactive } from 'vue';

export function useValidation() {
  const errors = reactive({});

  const validateRegistration = (form, confirmPassword, sameAddress) => {
    // Réinitialiser les erreurs
    Object.keys(errors).forEach(key => delete errors[key]);

    let isValid = true;

    // --- NOM & PRÉNOM ---
    if (!form.nom || form.nom.trim().length < 2) {
      errors.nom = "Le nom doit contenir au moins 2 caractères.";
      isValid = false;
    }
    if (!form.prenomClient || form.prenomClient.trim().length < 2) {
      errors.prenomClient = "Le prénom doit contenir au moins 2 caractères.";
      isValid = false;
    }

    // --- DATE DE NAISSANCE (Ex: vérifier +18 ans) ---
    if (!form.dateNaissance) {
      errors.dateNaissance = "La date de naissance est requise.";
      isValid = false;
    } else {
      const birthDate = new Date(form.dateNaissance);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.dateNaissance = "Date invalide (Vous devez avoir au moins 18 ans.)";
        isValid = false;
      }
    }

    // --- EMAIL ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      errors.email = "Veuillez entrer une adresse email valide.";
      isValid = false;
    }

    // --- MOT DE PASSE ---
    // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!form.password || !passwordRegex.test(form.password)) {
      errors.password = "8 caractères min, incluant majuscule, minuscule, chiffre et caractère spécial.";
      isValid = false;
    }

    if (form.password !== confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas.";
      isValid = false;
    }

    // --- TÉLÉPHONE (Format Français) ---
    const phoneRegex = /^(0|\+33|0033)[1-9]([-. ]?[0-9]{2}){4}$/;
    if (form.telephone && !phoneRegex.test(form.telephone)) {
      errors.telephone = "Format de téléphone invalide (ex: 06 12 34 56 78).";
      isValid = false;
    }

    // --- ADRESSE FACTURATION ---
    if (!form.rueFacturation || form.rueFacturation.trim().length < 5) {
      errors.rueFacturation = "L'adresse de facturation est incomplète.";
      isValid = false;
    }
    if (!form.cpFacturation || !form.villeFacturation) {
      errors.cpFacturation = "Veuillez sélectionner une adresse valide dans la liste.";
      isValid = false;
    }

    // --- ADRESSE LIVRAISON ---
    if (!sameAddress) {
      if (!form.rueLivraison || form.rueLivraison.trim().length < 5) {
        errors.rueLivraison = "L'adresse de livraison est incomplète.";
        isValid = false;
      }
      if (!form.cpLivraison || !form.villeLivraison) {
        errors.cpLivraison = "Veuillez sélectionner une adresse de livraison valide.";
        isValid = false;
      }
    }

    return isValid;
  };

  return { errors, validateRegistration };
}