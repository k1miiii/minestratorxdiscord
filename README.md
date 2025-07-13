# Bot Discord MineStrator

Ce bot Discord interagit avec l'[API MineStrator](https://minestrator.com) pour gérer des serveurs. Il permet de lister les serveurs, vérifier l'utilisation des ressources et effectuer des actions (démarrer, arrêter, redémarrer, terminer) sur les serveurs MineStrator. Les commandes sont réservées aux utilisateurs ayant un rôle spécifique de fondateur.

## Fonctionnalités

- **Commandes Slash** :
  - `/list-servers` : Liste tous les serveurs MineStrator (hashsupport, IP, port, DNS, dates de début/fin).
  - `/server-ressources <hashsupport>` : Affiche l'utilisation du CPU, de la RAM et du disque pour un serveur spécifié.
  - `/start [hashsupport]` : Démarre un serveur (par défaut : `` si aucun `hashsupport` n'est fourni).
  - `/stop [hashsupport]` : Arrête un serveur (par défaut : ``).
  - `/restart [hashsupport]` : Redémarre un serveur (par défaut : ``).
  - `/kill [hashsupport]` : Termine immédiatement un serveur (par défaut : ``).
- **Accès Restreint** : Les commandes sont limitées aux utilisateurs avec le rôle de fondateur (configuré via `roleFounderId`).
- **Intégration API MineStrator** : Utilise l'API MineStrator pour la gestion et la récupération des données des serveurs.
- **Gestion des Erreurs** : Affiche des messages d'erreur clairs via des embeds Discord en cas de problème API ou d'entrée invalide.

## Prérequis

- **Node.js** : Version 16 ou supérieure (testé avec `node-fetch@2` pour compatibilité CommonJS).
- **Bot Discord** : Un bot créé sur le [Portail Développeur Discord](https://discord.com/developers/applications) avec la permission `applications.commands`.
- **Jeton API MineStrator** : Obtenu depuis le [panneau MineStrator](https://minestrator.com/panel/modifier/mon/compte).
- **Code Serveur** : Un code `hashsupport` valide (ex. : ``) pour le serveur par défaut.

## Installation

1. **Créer un Répertoire de Projet** :
   ```bash
   mkdir minestrator-bot
   cd minestrator-bot
   ```

2. **Enregistrer le Fichier du Bot** :
   - Copiez le fichier `minestrator-bot.js` dans le répertoire du projet.

3. **Installer les Dépendances** :
   - Initialisez un projet Node.js et installez les packages nécessaires :
     ```bash
     npm init -y
     npm install discord.js node-fetch@2
     ```

4. **Configurer le Bot** :
   - Modifiez `minestrator-bot.js` pour mettre à jour l'objet `config` avec vos identifiants :
     ```javascript
     const config = {
       discordToken: 'VOTRE_JETON_BOT_DISCORD', // Depuis le Portail Développeur Discord
       discordClientId: 'VOTRE_ID_CLIENT', // ID du client du bot
       discordGuildId: 'VOTRE_ID_SERVEUR', // ID du serveur Discord
       roleFounderId: 'VOTRE_ID_ROLE_FONDATEUR', // ID du rôle de fondateur
       apiToken: 'VOTRE_JETON_API_MINESTRATOR', // Depuis le panneau MineStrator
       hashsupport: '' // Code serveur par défaut
     };
     ```

5. **Inviter le Bot** :
   - Dans le Portail Développeur Discord, générez un lien d'invitation pour votre bot avec la permission `applications.commands`.
   - Ajoutez le bot à votre serveur (`discordGuildId`).

6. **Lancer le Bot** :
   ```bash
   node minestrator-bot.js
   ```
   - Sortie console attendue :
     ```
     🔄 Enregistrement des commandes slash...
     ✅ Commandes enregistrées : list-servers, server-ressources, start, stop, restart, kill.
     ✅ Connecté en tant que <nom_du_bot>
     ```

## Utilisation

1. **Accéder aux Commandes** :
   - Dans votre serveur Discord, tapez `/` pour voir les commandes disponibles.
   - Les commandes sont réservées aux utilisateurs avec le rôle de fondateur (`roleFounderId`).

2. **Exemples de Commandes** :
   - Lister tous les serveurs :
     ```
     /list-servers
     ```
     Sortie : Embed avec les détails des serveurs (hashsupport, IP, port, DNS, dates).
   - Vérifier les ressources pour `` :
     ```
     /server-ressources 
     ```
     Sortie : Embed avec l'utilisation du CPU, de la RAM et du disque.
   - Démarrer le serveur par défaut (``) :
     ```
     /start
     ```
     Sortie : Embed confirmant l'action de démarrage.
   - Redémarrer un serveur spécifique (ex. : `GUUJV`) :
     ```
     /restart GUUJV
     ```
     Sortie : Embed confirmant le redémarrage pour `GUUJV`.

3. **Réponses des Embeds** :
   - **Initial** : Orange (`#FFA500`) avec "Récupération des données..." ou "Envoi de la commande...".
   - **Succès** : Vert (`#00FF00`) avec les données formatées ou un message de succès.
   - **Échec** : Rouge (`#FF0000`) avec un message d'erreur (ex. : `hashsupport` invalide ou erreur API).

## Dépannage

- **Les Commandes N’Apparaissent Pas** :
  - Vérifiez la console pour les erreurs `[SLASH_COMMANDS]`.
  - Assurez-vous que `discordToken`, `discordClientId` et `discordGuildId` sont corrects dans `config`.
  - Confirmez que le bot a la permission `applications.commands` et est invité au serveur.
  - Attendez 5 à 10 minutes pour que Discord se mette à jour, ou reconnectez-vous au serveur.

- **Erreurs API** :
  - Si `[MINESTRATOR_API] Erreur` apparaît (ex. : `401 Unauthorized`), vérifiez `apiToken` dans le panneau MineStrator.
  - Testez l’API manuellement :
    ```bash
    curl -X GET \
      -H "Authorization: VOTRE_JETON_API" \
      https://rest.minestrator.com/api/v1/server/ressources/
    ```
    ```bash
    curl -X POST \
      -H "Authorization: VOTRE_JETON_API" \
      -d "hashsupport=&action=start" \
      https://rest.minestrator.com/api/v1/server/action
    ```
  - Contactez le support MineStrator si les requêtes échouent.

- **Code `hashsupport` Invalide** :
  - Utilisez `/list-servers` pour obtenir les codes `hashsupport` valides (ex. : ``, `GUUJV`).
  - Si un code invalide est fourni, le bot renverra :
    ```
    ❌ Échec de l'envoi de la commande <commande> pour <hashsupport>. Vérifiez le jeton API ou le code support.
    ```

- **Autres Erreurs** :
  - Vérifiez les journaux de la console pour les erreurs `[MINESTRATOR_API]` ou `[INTERACTION]`.
  - Partagez les journaux, notamment les réponses API (ex. : `[MINESTRATOR_API] Données récupérées pour ressources/: {...}`), pour un débogage supplémentaire.

## Notes de Sécurité

- **Identifiants Codés en Dur** : Le bot utilise des valeurs `config` codées en dur. Ne partagez jamais `discordToken` ou `apiToken`. Régénérez-les en cas d'exposition.
- **Restriction par Rôle** : Assurez-vous que `roleFounderId` est défini sur un rôle sécurisé pour éviter les accès non autorisés.

## Licence

Ce projet est destiné à un usage personnel et interagit avec l'API MineStrator. Respectez les conditions d'utilisation de MineStrator et les politiques de développement de Discord.
