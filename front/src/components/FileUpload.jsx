import React, { useState } from 'react';
import axios from 'axios';
import Dashboard from './Dashboard';

export default function FileUpload({ setStatus, setFileReady }) {
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [cleanedData, setCleanedData] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      setRawData(csvData);
    };
    reader.readAsText(selectedFile);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!file) return setStatus("Veuillez sélectionner un fichier");

  setStatus("Traitement en cours...");

  try {
    const formData = new FormData();
    formData.append('csv', file);

    const rawContent = await file.text();
    setRawData(rawContent);

    const response = await axios.post('http://localhost:9000/upload', formData, {
      responseType: 'blob'
    });

    const cleanedContent = await new Response(response.data).text();
    setCleanedData(cleanedContent);
    setShowDashboard(true);

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cleaned_data.csv';
    link.click();

    setStatus("Traitement réussi!");
    setFileReady(true);
  } catch (err) {
    setStatus(`Erreur: ${err.message}`);
    console.error("Détails de l'erreur:", err);
  }
};

  if (showDashboard) {
    return <Dashboard rawData={rawData} cleanedData={cleanedData} />;
  }

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
  );
}