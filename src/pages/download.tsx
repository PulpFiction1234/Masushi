import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";

export default function Download() {
  const [showInstructions, setShowInstructions] = useState(false);

  const apkUrl = process.env.NODE_ENV === 'production' 
    ? "https://www.masushi.cl/masushi.apk" 
    : "/masushi.apk"; // APK lista en producción
  
  return (
    <>
      <Seo title="Descargar App — Masushi" canonicalPath="/download" noIndex />
      <Navbar />
      
      <div className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-md px-4 py-12">
          <div className="text-center">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Descarga Masushi App</h1>
              <p className="text-neutral-400">Ordena más rápido desde tu celular</p>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl mb-6 inline-block">
              <QRCodeSVG 
                value={apkUrl} 
                size={200} 
                level="M"
                includeMargin={true}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-8">
              <p className="text-lg">
                <span className="inline-block w-6 h-6 bg-green-500 text-white rounded-full text-sm font-bold mr-2">1</span>
                Escanea el código QR
              </p>
              <p className="text-neutral-400">o</p>
              
              {/* Download Button */}
              <button
                onClick={() => window.open(apkUrl, '_blank')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl transition-colors w-full"
              >
                📱 Descargar para Android
              </button>
            </div>

            {/* iOS Alternative */}
            <div className="bg-neutral-900 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-2">¿Tienes iPhone?</h3>
              <p className="text-sm text-neutral-400 mb-3">
                Agrega Masushi a tu pantalla de inicio como una app
              </p>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-green-400 text-sm underline"
              >
                Ver instrucciones para iOS
              </button>
              
              {showInstructions && (
                <div className="mt-4 text-left text-sm text-neutral-300 space-y-2">
                  <p>1. Abre <strong>masushi.cl</strong> en Safari</p>
                  <p>2. Toca el botón <strong>Compartir</strong> 📤</p>
                  <p>3. Selecciona <strong>&quot;Agregar a inicio&quot;</strong></p>
                  <p>4. Toca <strong>&quot;Agregar&quot;</strong></p>
                  <div className="mt-3 p-2 bg-blue-900/20 rounded text-xs text-blue-200">
                    ℹ️ <strong>Nota:</strong> En iOS se abrirá en Safari pero sin barras de navegación, funcionando como una app nativa.
                  </div>
                </div>
              )}
            </div>

            {/* Features Preview */}
            <div className="text-left bg-neutral-900 rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-center">🚀 Con la app puedes:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  <span>Ordenar más rápido</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  <span>Acceso directo desde tu inicio</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  <span>Misma experiencia que la web</span>
                </div>
              </div>
            </div>

            {/* Installation Steps */}
            <div className="mt-6 bg-neutral-900 rounded-xl p-4 text-left">
              <h4 className="font-semibold mb-3 text-sm">📲 Pasos para instalar:</h4>
              <div className="space-y-2 text-xs text-neutral-300">
                <p><span className="text-green-400 font-bold">1.</span> Descarga la APK tocando el botón</p>
                <p><span className="text-green-400 font-bold">2.</span> Permite &quot;Instalar apps desconocidas&quot; si aparece</p>
                <p><span className="text-green-400 font-bold">3.</span> Abre el archivo descargado</p>
                <p><span className="text-green-400 font-bold">4.</span> Toca &quot;Instalar&quot; y ¡listo!</p>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-4 bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
              <p className="text-xs text-blue-200">
                🔒 <strong>¿Es seguro?</strong> Sí, es nuestra app oficial. Android puede mostrar una advertencia porque no viene de Google Play, pero es completamente segura.
              </p>
            </div>

            {/* Note */}
            <p className="text-xs text-neutral-500 mt-4">
              Para Android 8.0 o superior. La app es segura y gratuita.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}