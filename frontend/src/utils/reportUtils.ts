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
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let yPos = margin;
  
  if (company.logo && company.logo.startsWith('data:')) {
    try {
      const format = company.logo.includes('png') ? 'PNG' : company.logo.includes('jpeg') || company.logo.includes('jpg') ? 'JPEG' : 'PNG';
      doc.addImage(company.logo, format, margin, yPos, 28, 28);
      yPos += 32;
    } catch (e) {
      console.warn('No se pudo agregar el logo:', e);
    }
  }
  
  if (company.nombre) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(company.nombre, margin, yPos);
    yPos += 6;
  }
  
  if (company.nit) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIT: ${company.nit}`, margin, yPos);
    yPos += 4;
  }
  
  if (company.direccion) {
    doc.setFontSize(8);
    doc.text(`Dirección: ${company.direccion}`, margin, yPos);
    yPos += 4;
  }
  
  if (company.telefono) {
    doc.setFontSize(8);
    doc.text(`Teléfono: ${company.telefono}`, margin, yPos);
    yPos += 4;
  }
  
  yPos += 6;
  
  doc.setDrawColor(180);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
  }
  
  return yPos;
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