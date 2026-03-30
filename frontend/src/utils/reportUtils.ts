import jsPDF from 'jspdf';
import { api } from '../services/api';

export interface CompanyInfo {
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  logo: string;
}

let cachedSettings: CompanyInfo | null = null;

export async function getCompanySettings(): Promise<CompanyInfo> {
  if (cachedSettings) return cachedSettings;
  
  try {
    const res = await api.get('/parametrizacion');
    cachedSettings = res.data.data;
    return cachedSettings as CompanyInfo;
  } catch {
    const defaultSettings: CompanyInfo = { nombre: 'Mi Empresa', nit: '', direccion: '', telefono: '', logo: '' };
    cachedSettings = defaultSettings;
    return defaultSettings;
  }
}

export function clearCompanyCache() {
  cachedSettings = null;
}

export function generateReportHeader(doc: jsPDF, company: CompanyInfo, title: string, subtitle?: string) {
  let yPos = 15;
  
  if (company.logo && company.logo.startsWith('data:image')) {
    try {
      const format = company.logo.includes('image/png') ? 'PNG' : company.logo.includes('image/jpeg') || company.logo.includes('image/jpg') ? 'JPEG' : 'PNG';
      doc.addImage(company.logo, format, 14, 10, 30, 30);
      yPos = 45;
    } catch (e) {
      console.warn('No se pudo agregar el logo:', e);
    }
  }
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, yPos, { align: 'center' });
  
  if (subtitle) {
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 105, yPos, { align: 'center' });
  }
  
  const infoX = company.logo ? 50 : 14;
  
  if (company.nombre) {
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(company.nombre, infoX, yPos);
  }
  
  if (company.nit) {
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIT: ${company.nit}`, infoX, yPos);
  }
  
  if (company.direccion) {
    yPos += 4;
    doc.text(`Dirección: ${company.direccion}`, infoX, yPos);
  }
  
  if (company.telefono) {
    yPos += 4;
    doc.text(`Tel: ${company.telefono}`, infoX, yPos);
  }
  
  return yPos + 10;
}

export function generateReportFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128);
  doc.text(
    `© 2025 Adrian F. Celis Morales. Todos los derechos reservados. | Generado: ${new Date().toLocaleString('es-CO')}`,
    105,
    pageHeight - 5,
    { align: 'center' }
  );
  doc.setTextColor(0);
}

export function generateFilename(prefix: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${dateStr}_${timeStr}_${random}.pdf`;
}