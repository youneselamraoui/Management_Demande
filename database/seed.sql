-- Seed demo (idempotent) — lance apres schema.sql
-- Departements
IF NOT EXISTS (SELECT 1 FROM [Departement] WHERE [Nom] = 'Informatique')
    INSERT INTO [Departement] ([Nom]) VALUES ('Informatique');
IF NOT EXISTS (SELECT 1 FROM [Departement] WHERE [Nom] = 'Finance')
    INSERT INTO [Departement] ([Nom]) VALUES ('Finance');
IF NOT EXISTS (SELECT 1 FROM [Departement] WHERE [Nom] = 'RH')
    INSERT INTO [Departement] ([Nom]) VALUES ('RH');
IF NOT EXISTS (SELECT 1 FROM [Departement] WHERE [Nom] = 'Production')
    INSERT INTO [Departement] ([Nom]) VALUES ('Production');
GO

-- Utilisateurs (depend de Departement)
IF NOT EXISTS (SELECT 1 FROM [Utilisateur] WHERE [Nom] = 'Admin')
    INSERT INTO [Utilisateur] ([Nom], [DepartementID]) VALUES ('Admin', (SELECT TOP 1 [Id] FROM [Departement] WHERE [Nom]='Informatique'));
IF NOT EXISTS (SELECT 1 FROM [Utilisateur] WHERE [Nom] = 'Finance User')
    INSERT INTO [Utilisateur] ([Nom], [DepartementID]) VALUES ('Finance User', (SELECT TOP 1 [Id] FROM [Departement] WHERE [Nom]='Finance'));
GO

-- Capex
IF NOT EXISTS (SELECT 1 FROM [Capex] WHERE [NomCapex] = 'CAPEX 2026 - IT')
    INSERT INTO [Capex] ([NomCapex], [BudgetTotal], [ResteBudget]) VALUES ('CAPEX 2026 - IT', 100000, 100000);
IF NOT EXISTS (SELECT 1 FROM [Capex] WHERE [NomCapex] = 'CAPEX 2026 - Production')
    INSERT INTO [Capex] ([NomCapex], [BudgetTotal], [ResteBudget]) VALUES ('CAPEX 2026 - Production', 250000, 250000);
GO
