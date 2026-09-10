// Models/StatutDemande.cs
namespace backend.Models;

public enum StatutDemande
{
    EnAttenteValidationAchat1,
    EnAttenteValidationAchat2,
    EnAttenteValidationChef,
    EnAttenteValidationFinance,
    EnAttenteConfirmationFinance, // alias SSMS "En attente confirmation finance"
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
        StatutDemande.EnAttenteConfirmationFinance or
        StatutDemande.EnAttenteValidationDirecteur;

    public static string ToDisplay(this StatutDemande s) => s switch
    {
        StatutDemande.EnAttenteValidationAchat1 => "En attente validation achat1",
        StatutDemande.EnAttenteValidationAchat2 => "En attente validation achat2",
        StatutDemande.EnAttenteValidationChef => "En attente validation chef",
        StatutDemande.EnAttenteValidationFinance => "En attente validation finance",
        StatutDemande.EnAttenteConfirmationFinance => "En attente confirmation finance",
        StatutDemande.EnAttenteValidationDirecteur => "En attente validation directeur",
        StatutDemande.BonDeCommande => "Bon de commande",
        StatutDemande.RefuseeAchat1 => "Refusé achat1",
        StatutDemande.RefuseeAchat2 => "Refusé achat2",
        StatutDemande.RefuseeChef => "Refusé chef",
        StatutDemande.RefuseeFinance => "Refusé finance",
        StatutDemande.RefuseeDirecteur => "Refusé directeur",
        _ => s.ToString()
    };

    public static StatutDemande ParseStatut(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return StatutDemande.EnAttenteValidationAchat1;
        var n = raw.Normalize(System.Text.NormalizationForm.FormD);
        n = new string(n.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark).ToArray());
        n = n.ToLower().Trim().Replace("  ", " ");
        return n switch
        {
            "refuse achat1" or "refusee achat1" => StatutDemande.RefuseeAchat1,
            "refuse achat2" or "refusee achat2" => StatutDemande.RefuseeAchat2,
            "refuse chef" or "refusee chef" => StatutDemande.RefuseeChef,
            "refuse finance" or "refusee finance" => StatutDemande.RefuseeFinance,
            "refuse directeur" or "refusee directeur" => StatutDemande.RefuseeDirecteur,
            "bon de commande" or "bon commande" => StatutDemande.BonDeCommande,
            "en attente validation directeur" => StatutDemande.EnAttenteValidationDirecteur,
            "en attente confirmation finance" => StatutDemande.EnAttenteConfirmationFinance,
            "en attente validation finance" => StatutDemande.EnAttenteValidationFinance,
            "en attente validation achat2" => StatutDemande.EnAttenteValidationAchat2,
            "en attente validation chef" => StatutDemande.EnAttenteValidationChef,
            "en attente validation achat1" => StatutDemande.EnAttenteValidationAchat1,
            _ => Enum.TryParse<StatutDemande>(raw.Replace(" ", "").Replace("é","e"), true, out var e) ? e : StatutDemande.EnAttenteValidationAchat1
        };
    }
}
