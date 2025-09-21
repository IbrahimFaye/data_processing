# 🧹 DataCleaner – Scala & Apache Spark  

## 📌 Description  
**DataCleaner** est une application académique développée en **Scala** avec **Apache Spark** et **Play Framework**.  
Elle automatise le **nettoyage de fichiers CSV hétérogènes** afin de garantir la qualité et l’exploitabilité des données pour l’analyse ou le machine learning.  

---

## ✨ Fonctionnalités  
- Traitement des **valeurs manquantes** (médiane / valeur par défaut)  
- Détection et remplacement des **valeurs aberrantes** (méthode IQR)  
- Suppression des **doublons**  
- **Normalisation Min-Max** des colonnes numériques  
- Nettoyage des **caractères spéciaux**  
- Export en **CSV UTF-8 tabulé**  

---

## 🛠 Tech Stack  
- **Backend** : Scala • Apache Spark • Play Framework • SBT  
- **Frontend** : React • Chart.js  

---

## 🚀 Lancement  

### Backend (Scala + Play + Spark)  
```bash
sbt run
