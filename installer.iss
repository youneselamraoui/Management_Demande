; Capex Manager - Installateur Windows (comme dotnet-sdk-10.0.400-win-x64 ou go1.27.0.windows-amd64)
; Genere CapexManager-Setup.exe via Inno Setup 6 (jrsoftware.org/isdl.php)
; Usage: ISCC.exe installer.iss  (ou lance build-app.ps1)

#define MyAppName "Capex Manager"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Capex"
#define MyAppExeName "CapexManager.exe"

[Setup]
AppId={{8E4A6C23-7F1A-4B2C-9D8E-CAPEXMANAGER1}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\CapexManager
DefaultGroupName=Capex Manager
OutputDir=Output
OutputBaseFilename=CapexManager-Setup
Compression=lzma2/ultra64
SolidCompression=yes
SetupIconFile=frontend\public\favicon.svg
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "backend\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; Parameters: ""
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
Filename: "http://localhost:5000"; Description: "Ouvrir dans le navigateur"; Flags: postinstall shellexec nowait skipifsilent unchecked

[UninstallDelete]
Type: filesandordirs; Name: "{app}\capex.db"
