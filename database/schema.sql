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
    [Nom] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [MotDePasse] nvarchar(max) NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [DepartementID] int NOT NULL,
    [ChefId] int NULL,
    [Active] bit NOT NULL DEFAULT 1,
    [DoitChangerMotDePasse] bit NULL,
    [EmailChef] nvarchar(max) NULL,
    [NomChef] nvarchar(max) NULL,
    CONSTRAINT [PK__Utilisat__3214EC075DBA5179] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Utilisateur_Departement] FOREIGN KEY ([DepartementID]) REFERENCES [Departements] ([Id]),
    CONSTRAINT [FK_Utilisateur_Chef] FOREIGN KEY ([ChefId]) REFERENCES [Utilisateurs] ([Id])
);
GO


CREATE TABLE [Demandes] (
    [Id] int NOT NULL IDENTITY,
    [UtilisateurId] int NOT NULL,
    [Statut] nvarchar(max) NOT NULL,
    [CapexId] int NULL,
    [RFX] nvarchar(max) NULL,
    [Commentaire] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE(),
    [DateValidationAchat1] datetime2 NULL,
    [DateValidationAchat2] datetime2 NULL,
    [MontantReserve] float NULL,
    [CheminDevis] nvarchar(max) NULL,
    [CheminSAP] nvarchar(max) NULL,
    [CheminFinance] nvarchar(max) NULL,
    [FichierPath] nvarchar(max) NULL,
    [Justification] nvarchar(max) NULL,
    [DateValidateChef] datetime2 NULL,
    [DateValidateFinance] datetime2 NULL,
    [DateValidateDirecteur] datetime2 NULL,
    [sta1] int NULL,
    [sta2] int NULL,
    [stc] int NULL,
    [stf] int NULL,
    [std] int NULL,
    [stu] int NULL,
    [stp] int NULL,
    CONSTRAINT [PK__Demande__8CE9A8CAB33538E6] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Demande_Capex] FOREIGN KEY ([CapexId]) REFERENCES [Capexes] ([Id]),
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


