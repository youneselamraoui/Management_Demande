CREATE TABLE [Capexes] (
    [Id] int NOT NULL IDENTITY,
    [NomCapex] nvarchar(200) NOT NULL,
    [BudgetTotal] decimal(18,2) NOT NULL,
    [BudgetRestant] decimal(18,2) NOT NULL,
    CONSTRAINT [PK__Capex__120BD429C6355FB6] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Departements] (
    [Id] int NOT NULL IDENTITY,
    [Nom] nvarchar(200) NOT NULL,
    CONSTRAINT [PK__Departem__3214EC075C2917C8] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Utilisateurs] (
    [Id] int NOT NULL IDENTITY,
    [Nom] nvarchar(200) NOT NULL,
    [DepartementID] int NOT NULL,
    CONSTRAINT [PK__Utilisat__3214EC075DBA5179] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Utilisateur_Departement] FOREIGN KEY ([DepartementID]) REFERENCES [Departements] ([Id])
);
GO


CREATE TABLE [Demandes] (
    [Id] int NOT NULL IDENTITY,
    [UtilisateurId] int NOT NULL,
    [Statut] nvarchar(50) NOT NULL,
    [Id] int NOT NULL,
    [RFX] nvarchar(50) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [DateValidationAchat1] datetime2 NULL,
    [DateValidationAchat2] datetime2 NULL,
    [DateValidateChef] datetime2 NULL,
    [DateValidateFinance] datetime2 NULL,
    [DateValidateDirecteur] datetime2 NULL,
    CONSTRAINT [PK__Demande__8CE9A8CAB33538E6] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Demande_Capex] FOREIGN KEY ([Id]) REFERENCES [Capexes] ([Id]),
    CONSTRAINT [FK_Demande_Utilisateur] FOREIGN KEY ([UtilisateurId]) REFERENCES [Utilisateurs] ([Id])
);
GO


CREATE TABLE [DetailsDemandes] (
    [Id] int NOT NULL IDENTITY,
    [DemandeId] int NOT NULL,
    [Article] nvarchar(200) NOT NULL,
    [Quantite] int NOT NULL,
    [Prix] decimal(18,2) NOT NULL,
    [Devis] nvarchar(200) NULL,
    CONSTRAINT [PK__DetailDe__3214EC07CD94415F] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DetailDemande_Demande] FOREIGN KEY ([DemandeId]) REFERENCES [Demandes] ([Id])
);
GO


CREATE INDEX [IX_Demandes_Id] ON [Demandes] ([Id]);
GO


CREATE INDEX [IX_Demandes_UtilisateurId] ON [Demandes] ([UtilisateurId]);
GO


CREATE UNIQUE INDEX [UQ_Nom] ON [Departements] ([Nom]);
GO


CREATE INDEX [IX_DetailsDemandes_DemandeId] ON [DetailsDemandes] ([DemandeId]);
GO


CREATE INDEX [IX_Utilisateurs_DepartementID] ON [Utilisateurs] ([DepartementID]);
GO


CREATE UNIQUE INDEX [UQ_NomU] ON [Utilisateurs] ([Nom]);
GO


