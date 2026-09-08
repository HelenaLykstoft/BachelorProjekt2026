
**US-01:**
- Som skinner, vil jeg have mulighed for at uploade YDD/YTD filer direkte på websiten, så jeg ikke behøver manuelt at finde og styre dem i OpenIV. 

*Accept kriterie:* 
- Givet en rigtig YDD eller YTD fil, når brugeren  uploader den, så accepterer siden den og giver en bekræftelse.

Detaljer: 
- Klar besked om filen er accepteret eller ej (error message)
- V1: Upload PNG fil
- V2: Upload YTD fil, hvor siden automatisk laver en PNG ud af den

**US-02:** 
- Som skinner, vil jeg have muligheden for at downloade mit færdige skin som  ready-to-use YDD/YTD filer, så jeg kan installere dem direkte til FiveM uden flere konverterings steps.

Accept kriterie: 
- Givet det er et komplekst projekt, når brugeren trykker "download", så eksporterer siden automatisk YDD/YTD filerne, og med de rette navne som GTA V har.

Detaljer: 
- Knap til at trykke download
- V1: PNG bliver downloadet
- V1,5: PNG bliver downloadet med rigtig navn, så brugeren ved hvad YTD filen skal hedde
- V2: YDD/YTD bliver downloadet automatisk med rigtige navne

**US-03:** 
- Som skinner, vil jeg have mulighed for at "drag and drop" et logo på min tøjtekstur, så jeg hurtigt kan positionere den uden at skulle bruge tid på layers i en separat editor.

*Accept kriterie:*
- Givet et logo, når brugeren sætter det ind på siden, så ser brugeren det på teksturen og kan frit ændre størrelse og placering.

Detaljer:
- Logo skal kunne uploades af brugeren
- V1: Logo upload + indsæt på PNG
- V2: Prædefinerede lokationer til logoet, så det automatisk bliver sat ind. Eventuelt logo 1 placering, logo 2 placering

**US-04:**
- Som skinner, vil jeg have mulighed for at ændre farve på PNG'en, så jeg nemt kan lave det design jeg ønsker

*Accept kriterie:* 
- Givet en farve, når brugeren vælger farve og gennemsigtighed, så ændrer tøjet farve.

Detaljer: 
- Kan deles op i mange dele, kan være farve, tekstur eller lignende
- V1: Bruger kan vælge "farve overlay", som ændrer den basale farve på hele PNG'en
- V2: Prædefinerede lokationer til farve, hvis der skal ændres på få dele af teksturen
	- Fx syningsfarver, kravefarver eller lignende på specifikke stykker tøj


**US-05:**
- Som skinner, vil jeg have muligheden for at se et "preview" af mit tøj, så jeg ikke behøver gentagne gange at downloade det og putte det ind i OpenIV for at se hvordan det ender med at se ud.

*Accept kriterie:*
- Givet at brugeren har ændret i noget tøj, når brugeren åbner 3D preview mode, så kan brugeren rotere i modellen for at se resultatet.

Detaljer: 
- V1: Basic 2D
- V2: 3D view

**US-06:**
- Som skinner, vil jeg have mulighed for at generere et logo ved brug af AI, så jeg kan spare tid på at designe det selv

*Accept kriterie:*
- Givet en tekst prompt eller et reference billede, når brugeren spørger om et AI genereret logo, så producere systemet et brugbart logo med den rette tekst og farve, som brugeren kan bruge på sin tøjtekstur

Detaljer:
- V1: Kopier den prompt jeg har lavet, og selv brug en AI til at lave logo
- V2: Få AI ind i mit projekt, og kør igennem den prompt jeg har lavet for at generere logoet

**US-07:**
- Som skinner, vil jeg have mulighed for at gemme mit projekt, så jeg kan komme tilbage til det senere istedet for at starte forfra

*Accept kriterie:* 
- Givet et igangværende projekt, når brugeren trykker "gem", så bliver projektet gemt

Detaljer:
- V1: Manuelt gemme templaten/projektet i projektets filsystem
- V2: Gemt på en cloud, så alle ikke kan se alles edits (måske noget login i fremtiden)

**US-08:**
- Som bruger, vil jeg have muligheden for at starte et projekt ud fra templates på hjemmesiden, så jeg ikke har brug for at bruge tid på at finde dem selv

*Accept kriterie:*
- Givet at der er nogle templates, når brugeren starter et nyt projekt, så har brugeren mulighed at importere sin egen, eller vælge ud fra templates der allerede ligger der

Detaljer: 
- V1: Prædefinerede templates, med PNG filer, som man kan vælge fra. 
- V2: Prædefinerede projekter, hvor der både er YDD/YTD fil osv som man kan ændre i, med rigtige filnavne

Udvidelse:
- US-19: Model library med en masse forskellige (som grzy tools)


