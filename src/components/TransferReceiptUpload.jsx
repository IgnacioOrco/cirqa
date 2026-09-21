import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Formatea el tamaño de archivo en KB o MB legible
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Formulario interactivo para carga y validación de comprobantes de transferencia
 *
 * @param {Object} props
 * @param {string} props.orderId - Identificador único de la orden en MongoDB
 * @param {string} [props.uploadUrl] - Endpoint personalizado (por defecto /api/orders/:orderId/receipt)
 * @param {Function} [props.onSuccess] - Callback invocado tras la subida exitosa (recibe data del backend)
 * @param {Function} [props.onError] - Callback invocado en caso de fallo
 */
export default function TransferReceiptUpload({
  orderId,
  uploadUrl,
  onSuccess,
  onError,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Validación estricta de tipo MIME, extensión y tamaño
  const validateFile = (file) => {
    if (!file) return 'No se seleccionó ningún archivo.';

    const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type) ||
      ALLOWED_EXTENSIONS.includes(fileExtension);

    if (!isValidType) {
      return `Formato no permitido. Solo se aceptan imágenes (${ALLOWED_EXTENSIONS.filter(e => e !== '.pdf').join(', ')}) o documentos .pdf`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `El archivo supera el límite de 5 MB (Tamaño: ${formatFileSize(file.size)}).`;
    }

    return null;
  };

  const handleFileSelection = (file) => {
    setValidationError('');
    setUploadSuccess(false);

    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);

    // Si es imagen, crear preview; si es PDF, limpiar preview para mostrar ícono de documento
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  // Manejo de Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Envío del formulario al backend con FormData
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError('Por favor, selecciona un comprobante antes de continuar.');
      return;
    }

    const fileError = validateFile(selectedFile);
    if (fileError) {
      setValidationError(fileError);
      return;
    }

    setIsUploading(true);
    setValidationError('');

    try {
      const formData = new FormData();
      // Campo receipt que espera el backend
      formData.append('receipt', selectedFile);

      const targetEndpoint =
        uploadUrl ||
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${orderId}/receipt`;

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar la subida del comprobante.');
      }

      setUploadSuccess(true);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      console.error('[Upload Receipt] Error:', err);
      const msg = err.message || 'Ocurrió un error al enviar el comprobante. Intenta nuevamente.';
      setValidationError(msg);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-neutral-950 border border-neutral-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm text-neutral-200">
      {/* Título y descripción */}
      <div className="mb-5 pb-4 border-b border-neutral-800/60">
        <h3 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-red-500" />
          Comprobante de Transferencia
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          Adjuntá la constancia bancaria de tu orden para que nuestro equipo valide el pago.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Zona de Drop & Carga */}
        {!selectedFile && !uploadSuccess && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer group relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragging
                ? 'border-red-500 bg-red-950/10'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-neutral-800/80 flex items-center justify-center text-neutral-400 group-hover:text-red-400 group-hover:scale-105 transition-all mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-200">
                Arrastrá tu comprobante aquí o{' '}
                <span className="text-red-400 underline underline-offset-4">examinar</span>
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                Formatos permitidos: .JPG, .PNG o .PDF (Máx. 5 MB)
              </p>
            </div>
          </div>
        )}

        {/* Vista previa del archivo seleccionado */}
        {selectedFile && !uploadSuccess && (
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {previewUrl ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-700 flex-shrink-0 bg-black">
                  <img
                    src={previewUrl}
                    alt="Preview comprobante"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-red-400 flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-neutral-400 font-mono">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type === 'application/pdf' ? 'Documento PDF' : 'Imagen'}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Quitar archivo"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Mensaje de Error de Validación o Servidor */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensaje de Éxito */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3 text-emerald-200"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">¡Comprobante enviado con éxito!</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Estamos verificando la acreditación para preparar tu pedido.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón de Enviar */}
        {!uploadSuccess && (
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/30"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando comprobante...</span>
              </>
            ) : (
              <>
                <span>Confirmar y Enviar Comprobante</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </form>

      {/* Pie de seguridad */}
      <div className="mt-5 pt-4 border-t border-neutral-900 flex items-center justify-center gap-2 text-xs text-neutral-500">
        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
        <span>Comprobante almacenado de forma segura y confidencial</span>
      </div>
    </div>
  );
}
