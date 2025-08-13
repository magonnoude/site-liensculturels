# site-liensculturels
# Site Web de l'Association Liens Culturels

![Logo de Liens Culturels](assets/img/logo.png)

Bienvenue sur le dépôt GitHub du site officiel de l'association **Liens Culturels**. Ce projet a pour but de fournir une vitrine numérique moderne, accessible et informative pour présenter les missions, les projets et les activités de l'association.

## 🎯 Objectif du Site

Le site `www.liensculturels.org` a été conçu pour :
* **Informer** le public sur la vision et les actions de l'association.
* **Faciliter l'interaction** avec la communauté via des formulaires de contact et d'adhésion.
* **Promouvoir les projets**, notamment le programme de bourse scolaire "Avenir Partagé".
* **Centraliser la communication** grâce à une newsletter et une médiathèque.

---

## ✨ Fonctionnalités Principales

* **Présentation Complète :** Pages dédiées à l'association, au bureau et aux dirigeants.
* **Galerie Média :** Une photothèque interactive et une vidéothèque pour partager les moments forts.
* **Formulaires Dynamiques :**
    * Un formulaire de **contact** pour les demandes d'information.
    * Un formulaire d'**adhésion** pour les nouveaux membres.
    * Les soumissions sont traitées par une architecture "serverless" et envoyées par e-mail.
* **Newsletter :** Un formulaire d'inscription intégré au service Brevo pour garder la communauté engagée.
* **Design Responsive :** Le site est entièrement adaptable aux ordinateurs, tablettes et mobiles.

---

## 🛠️ Technologies Utilisées

Ce site repose sur une architecture moderne, performante et économique, combinant des technologies statiques pour l'interface et des services "serverless" pour l'interactivité.

* **Frontend :**
    * **HTML5**
    * **CSS3** (avec Flexbox et Grid pour la mise en page)
    * **JavaScript "vanilla"** (sans framework) pour la gestion des formulaires et des interactions.
    * **Font Awesome** pour les icônes.
    * **Lightbox2** pour la galerie photo.

* **Backend (Serverless) :**
    * **AWS API Gateway :** Pour créer un point d'entrée sécurisé pour les données des formulaires.
    * **AWS Lambda :** Pour exécuter le code de traitement des formulaires (écrit en **Python 3.11**).
    * **AWS SES (Simple Email Service) :** Pour l'envoi fiable des e-mails de notification.

* **Services Tiers :**
    * **Brevo (Sendinblue) :** Pour la gestion professionnelle de la newsletter.

---

## 🚀 Installation et Déploiement

Le site étant statique, il peut être hébergé sur n'importe quel service d'hébergement moderne (AWS S3, Netlify, Vercel, hébergeur classique).

1.  Clonez ce dépôt :
    ```bash
    git clone [https://github.com/magonnoude/site-liens-culturels.git](https://github.com/magonnoude/site-liens-culturels.git)
    ```
2.  Ouvrez le fichier `index.html` dans votre navigateur pour visualiser le site en local.

Les endpoints des formulaires dans `assets/js/main.js` et les liens de la newsletter sont configurés pour la production et ne nécessitent pas de modification sauf en cas de changement d'infrastructure.

---

## 📂 Structure des Fichiers

```
.
├── assets/
│   ├── css/
│   │   └── style.css       # Feuille de style principale
│   ├── img/                # Toutes les images (logos, photos, etc.)
│   └── js/
│       └── main.js         # Logique des formulaires et autres scripts
├── index.html              # Page d'accueil
├── a-propos.html
├── bureau.html
├── contact.html
├── ... (toutes les autres pages HTML)
└── README.md               # Ce fichier
```

---

## Contact

Pour toute question relative à l'association, veuillez utiliser le formulaire de contact du site ou envoyer un e-mail à **contact@liensculturels.org**.