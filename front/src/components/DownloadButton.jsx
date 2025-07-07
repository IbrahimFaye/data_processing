import React from 'react'

export default function DownloadButton() {
  return (
    <a
      href="http://localhost:9000/download"
      className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      download
    >
      Télécharger le fichier nettoyé
    </a>
  )
}
