// Models/StatutDemande.cs
namespace backend.Models;

public enum StatutDemande
{
    EnAttenteValidationAchat1,
    EnAttenteValidationAchat2,
    EnAttenteValidationChef,
    EnAttenteValidationFinance,
    EnAttenteValidationDirecteur,
    BonDeCommande,
    RefuseeAchat1,
    RefuseeAchat2,
    RefuseeChef,
    RefuseeFinance,
    RefuseeDirecteur
}

public static class StatutDemandeExtensions
{
    public static bool EstEnAttenteDeValidation(this StatutDemande statut) => statut is
        StatutDemande.EnAttenteValidationAchat1 or
        StatutDemande.EnAttenteValidationAchat2 or
        StatutDemande.EnAttenteValidationChef or
        StatutDemande.EnAttenteValidationFinance or
        StatutDemande.EnAttenteValidationDirecteur;
}
