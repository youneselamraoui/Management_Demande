-- Seed pour nouvelles tables : Capexes, Demandes, DetailsDemandes, Utilisateurs, Departements
IF NOT EXISTS (SELECT 1 FROM [Departements] WHERE [Nom] = 'Informatique')
    INSERT INTO [Departements] ([Nom]) VALUES ('Informatique');
IF NOT EXISTS (SELECT 1 FROM [Departements] WHERE [Nom] = 'Finance')
    INSERT INTO [Departements] ([Nom]) VALUES ('Finance');
IF NOT EXISTS (SELECT 1 FROM [Departements] WHERE [Nom] = 'RH')
    INSERT INTO [Departements] ([Nom]) VALUES ('RH');
IF NOT EXISTS (SELECT 1 FROM [Departements] WHERE [Nom] = 'Production')
    INSERT INTO [Departements] ([Nom]) VALUES ('Production');
GO
IF NOT EXISTS (SELECT 1 FROM [Utilisateurs] WHERE [Nom] = 'Admin')
    INSERT INTO [Utilisateurs] ([Nom], [DepartementID]) VALUES ('Admin', (SELECT TOP 1 [Id] FROM [Departements] WHERE [Nom]='Informatique'));
IF NOT EXISTS (SELECT 1 FROM [Utilisateurs] WHERE [Nom] = 'Finance User')
    INSERT INTO [Utilisateurs] ([Nom], [DepartementID]) VALUES ('Finance User', (SELECT TOP 1 [Id] FROM [Departements] WHERE [Nom]='Finance'));
GO
IF NOT EXISTS (SELECT 1 FROM [Capexes] WHERE [NomCapex] = 'CAPEX 2026 - IT')
    INSERT INTO [Capexes] ([NomCapex], [BudgetTotal], [BudgetRestant]) VALUES ('CAPEX 2026 - IT', 100000, 100000);
IF NOT EXISTS (SELECT 1 FROM [Capexes] WHERE [NomCapex] = 'CAPEX 2026 - Production')
    INSERT INTO [Capexes] ([NomCapex], [BudgetTotal], [BudgetRestant]) VALUES ('CAPEX 2026 - Production', 250000, 250000);
GO
