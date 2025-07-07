import React, { useState } from 'react'
import FileUpload from './components/FileUpload'
import DownloadButton from './components/DownloadButton'
import backgroundImage from './assets/images/d.jpeg'

export default function App() {
  const [status, setStatus] = useState('')
  const [fileReady, setFileReady] = useState(false)

  return (
    <div
  className="min-h-screen bg-cover bg-center relative"
  style={{
    backgroundImage: `url(${backgroundImage})`
  }}
>
  <div className="absolute inset-0 bg-black bg-opacity-50"></div>

  <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
    <h1 className="text-3xl font-bold mb-6 text-white">Nettoyage Automatique de Données</h1>
    <FileUpload setStatus={setStatus} setFileReady={setFileReady} />
    <p className="mt-4 text-blue-100">{status}</p>
    {fileReady && <DownloadButton />}
  </div>
</div>

   
  )

}
