# PROGRAMMAZIONE-DI-APPLICAZIONE-INTELLIGENTI
# Vehicle Authorization Control App

## Descrizione del progetto

Questo progetto consiste nello sviluppo di un’applicazione per il controllo dei veicoli autorizzati alla circolazione in aree soggette a restrizioni ambientali o normative.

Un esempio di utilizzo riguarda la verifica dei veicoli **Euro 1** ed **Euro 2**, che in alcune zone possono essere soggetti a **divieto di circolazione**.

L’applicazione consente di caricare immagini dei veicoli e di effettuare una serie di controlli automatici per determinare se il mezzo è autorizzato oppure no.

## Funzionalità principali

- Caricamento delle immagini dei veicoli
- Rilevamento della presenza di un veicolo nell’immagine
- Lettura automatica della targa
- Confronto della targa con una banca dati
- Verifica dell’autorizzazione alla circolazione nell’area selezionata
- Invio automatico di una segnalazione al moderatore in caso di veicolo non autorizzato

## Flusso di funzionamento

1. L’utente carica la foto di un veicolo.
2. Il sistema analizza l’immagine per verificare che sia effettivamente presente un veicolo.
3. Se il veicolo viene rilevato, il sistema tenta di identificare e leggere la targa.
4. La targa estratta viene confrontata con una banca dati dei veicoli.
5. Il sistema controlla se il mezzo è autorizzato alla circolazione in quella determinata area.
6. Se il veicolo non risulta autorizzato, viene inviata automaticamente una segnalazione al moderatore, cioè all’operatore incaricato di procedere con la sanzione.

## Obiettivo

L’obiettivo del progetto è automatizzare il processo di controllo dei veicoli in aree soggette a limitazioni, migliorando l’efficienza dei controlli e supportando gli operatori nella gestione delle violazioni.

## Tecnologie coinvolte

Il progetto può includere l’utilizzo delle seguenti tecnologie:

- **Computer Vision** per il riconoscimento del veicolo nell’immagine
- **OCR (Optical Character Recognition)** per la lettura automatica della targa
- **Database** per la consultazione delle informazioni sui veicoli
- **Backend Application** per la gestione della logica di controllo
- **Sistema di notifica** per l’invio delle segnalazioni al moderatore

## Possibili casi d’uso

- Controllo accessi in zone a traffico limitato
- Verifica automatica di veicoli soggetti a restrizioni ambientali
- Supporto agli operatori nella gestione delle sanzioni
- Monitoraggio della circolazione in aree urbane regolamentate

## Struttura logica del sistema

- **Modulo di upload immagini**
- **Modulo di riconoscimento veicolo**
- **Modulo di lettura targa**
- **Modulo di verifica autorizzazioni**
- **Modulo di invio segnalazioni**
- **Interfaccia moderatore**

## Stato del progetto

Progetto accademico / prototipo sviluppato a scopo didattico.

## Autori

Progetto sviluppato nell’ambito del corso di studi in Informatica.
