import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export const LOAN_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
export const LOAN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// Devuelve un mensaje de error si el archivo no es válido, o null si se puede subir.
export function validateLoanImage(file: File): string | null {
  if (!LOAN_IMAGE_ACCEPT.split(',').includes(file.type)) {
    return 'Solo se aceptan imágenes (JPG, PNG, WebP, GIF)';
  }
  if (file.size > LOAN_IMAGE_MAX_BYTES) {
    return 'La imagen no puede pesar más de 5 MB';
  }
  return null;
}

export async function uploadLoanImage(loanId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await axios.post<{ imageUrl: string }>(
    `${API}/loans/${loanId}/image`,
    formData,
    { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
  );
  return data.imageUrl;
}
