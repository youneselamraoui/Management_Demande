CREATE TABLE [Capex] (
    [CapexId] int NOT NULL IDENTITY,
    [NomCapex] nvarchar(200) NOT NULL,
    [BudgetTotal] decimal(18,2) NOT NULL,
    [ResteBudget] decimal(18,2) NOT NULL,
    CONSTRAINT [PK__Capex__120BD429C6355FB6] PRIMARY KEY ([CapexId])
);
GO


CREATE TABLE [Departement] (
    [Id] int NOT NULL IDENTITY,
    [Nom] nvarchar(200) NOT NULL,
    CONSTRAINT [PK__Departem__3214EC075C2917C8] PRIMARY KEY ([Id])
);
GO


CREATE TABLE [Utilisateur] (
    [Id] int NOT NULL IDENTITY,
    [Nom] nvarchar(200) NOT NULL,
    [DepartementID] int NOT NULL,
    CONSTRAINT [PK__Utilisat__3214EC075DBA5179] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Utilisateur_Departement] FOREIGN KEY ([DepartementID]) REFERENCES [Departement] ([Id])
);
GO


CREATE TABLE [Demande] (
    [idDemande] int NOT NULL IDENTITY,
    [UtilisateurId] int NOT NULL,
    [Statut] nvarchar(50) NOT NULL,
    [CapexId] int NOT NULL,
    [RFx] nvarchar(50) NULL,
    [CreateAt] datetime2 NOT NULL DEFAULT ((getdate())),
    [DateValidation1] datetime2 NULL,
    [DateValidation2] datetime2 NULL,
    [DateValidateChef] datetime2 NULL,
    [DateValidateFinance] datetime2 NULL,
    [DateValidateDirecteur] datetime2 NULL,
    CONSTRAINT [PK__Demande__8CE9A8CAB33538E6] PRIMARY KEY ([idDemande]),
    CONSTRAINT [FK_Demande_Capex] FOREIGN KEY ([CapexId]) REFERENCES [Capex] ([CapexId]),
    CONSTRAINT [FK_Demande_Utilisateur] FOREIGN KEY ([UtilisateurId]) REFERENCES [Utilisateur] ([Id])
);
GO


CREATE TABLE [DetailDemande] (
    [Id] int NOT NULL IDENTITY,
    [DemandeId] int NOT NULL,
    [Article] nvarchar(200) NOT NULL,
    [Quantite] int NOT NULL,
    [Prix] decimal(18,2) NOT NULL,
    [Devis] nvarchar(200) NULL,
    CONSTRAINT [PK__DetailDe__3214EC07CD94415F] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DetailDemande_Demande] FOREIGN KEY ([DemandeId]) REFERENCES [Demande] ([idDemande])
);
GO


CREATE INDEX [IX_Demande_CapexId] ON [Demande] ([CapexId]);
GO


CREATE INDEX [IX_Demande_UtilisateurId] ON [Demande] ([UtilisateurId]);
GO


CREATE UNIQUE INDEX [UQ_Nom] ON [Departement] ([Nom]);
GO


CREATE INDEX [IX_DetailDemande_DemandeId] ON [DetailDemande] ([DemandeId]);
GO


CREATE INDEX [IX_Utilisateur_DepartementID] ON [Utilisateur] ([DepartementID]);
GO


CREATE UNIQUE INDEX [UQ_NomU] ON [Utilisateur] ([Nom]);
GO


