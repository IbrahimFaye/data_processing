import React, { useState } from 'react'
import axios from 'axios'

export default function FileUpload({ setStatus, setFileReady }) {
  const [file, setFile] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!file) return setStatus("Veuillez sélectionner un fichier");

  setStatus("Traitement en cours...");

  try {
    const formData = new FormData();
    formData.append('csv', file);

    const response = await axios.post('http://localhost:9000/upload', formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.type === "text/plain") {
      const error = await response.data.text();
      throw new Error(error);
    }

    // Téléchargement du fichier
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleaned_data.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();

    setStatus("Traitement réussi!");
  } catch (err) {
    setStatus(`Erreur: ${err.message}`);
    console.error("Détails de l'erreur:", err);
  }
};
  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="file-input file-input-bordered"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Uploader & Traiter
      </button>
    </form>
  )
}
