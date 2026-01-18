import { jsPDF } from 'jspdf';
import { Quotation, Deliverables } from '@/types';
import { formatCurrency, formatCurrencyForPDF, formatDate } from './utils';

function safeFormatDate(date: string | Date | undefined | null) {
  try {
    if (!date) return '';
    return formatDate(date as string | Date);
  } catch (e) {
    return '';
  }
}

export function generateQuotationPDF(quotation: Quotation, customerName: string, deliverables?: Deliverables | null): void {
  // Use A4 size explicitly
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;
  
  // Ensure deliverables is parsed correctly
  if (!deliverables && quotation.deliverables) {
    try {
      deliverables = typeof quotation.deliverables === 'string' 
        ? JSON.parse(quotation.deliverables) 
        : quotation.deliverables;
    } catch (e) {
      console.error('Error parsing deliverables:', e);
      deliverables = null;
    }
  }

  // Letterhead Design (Simple Professional Template)
  doc.setFillColor(50, 50, 50);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AURA KNOT PHOTOGRAPHY', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Photography & Videography Services', pageWidth / 2, 30, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos = 50;

  // Quotation Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Quotation Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Quotation ID: ${quotation.quotationId}`, 20, yPos);
  doc.text(`Date: ${safeFormatDate(quotation.createdAt)}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 10;

  // Customer Information
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customerName}`, 25, yPos);
  yPos += 7;
  doc.text(`Event Type: ${quotation.eventType}`, 25, yPos);
  yPos += 7;
  const startDate = safeFormatDate(quotation.eventDateStart);
  const endDate = safeFormatDate(quotation.eventDateEnd);
  doc.text(`Event Date: ${startDate}${startDate && endDate ? ' - ' : ''}${endDate}`, 25, yPos);
  yPos += 7;
  doc.text(`Location: ${quotation.location}`, 25, yPos);
  yPos += 7;
  doc.text(`Package: ${quotation.packageType}`, 25, yPos);
  yPos += 10;

  // Services Section - Handle both string and object formats
  let services: any = {};
  try {
    services = typeof quotation.services === 'string' 
      ? JSON.parse(quotation.services) 
      : (quotation.services || {});
  } catch (e) {
    console.error('Error parsing services:', e);
    services = {};
  }
  
  if (services.photography && services.photography.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Photography Services:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    services.photography.forEach((service: any) => {
      doc.text(`• ${service.type} - ${service.stage} (${service.cameraCount} cameras, ${service.session})`, 25, yPos);
      yPos += 6;
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
    });
    yPos += 5;
  }

  if (services.videography && services.videography.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Videography Services:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    services.videography.forEach((service: any) => {
      doc.text(`• ${service.type} - ${service.stage} (${service.cameraCount} cameras, ${service.session})`, 25, yPos);
      yPos += 6;
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
    });
    yPos += 5;
  }

  if (services.additional && services.additional.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Services:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    services.additional.forEach((service: any) => {
      const additionalName = (service.customName && String(service.customName).trim()) ? service.customName : service.name;
      doc.text(`• ${additionalName}`, 25, yPos);
      yPos += 6;
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
    });
    yPos += 5;
  }

  // Deliverables Section
  if (deliverables) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Deliverables:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    
    // Albums
    if (deliverables.numberOfAlbums && deliverables.numberOfAlbums > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Albums:', 25, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`• Number of Albums: ${deliverables.numberOfAlbums}`, 30, yPos);
      yPos += 6;
      if (deliverables.albumSize) {
        doc.text(`• Album Size: ${deliverables.albumSize}`, 30, yPos);
        yPos += 6;
      }
      if (deliverables.sheetsPerAlbum) {
        doc.text(`• Sheets per Album: ${deliverables.sheetsPerAlbum}`, 30, yPos);
        yPos += 6;
      }
      if (deliverables.totalSheets) {
        doc.text(`• Total Sheets: ${deliverables.totalSheets}`, 30, yPos);
        yPos += 6;
      }
      if (deliverables.totalPhotosForSelection) {
        doc.text(`• Total No. of photos for selection: ${deliverables.totalPhotosForSelection}`, 30, yPos);
        yPos += 6;
      }
      yPos += 3;
    }

    // Services (only show if selected)
    if (deliverables.services) {
      const serviceList = [];
      if (deliverables.services.dronePhotography) serviceList.push('Drone Photography');
      if (deliverables.services.droneVideography) serviceList.push('Drone Videography');
      if (deliverables.services.preWeddingShoot) serviceList.push('Pre-Wedding Shoot');
      if (deliverables.services.postWeddingShoot) serviceList.push('Post-Wedding Shoot');
      if (deliverables.services.outdoorShoot) serviceList.push('Outdoor Shoot');
      
      if (serviceList.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Services:', 25, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        serviceList.forEach((service) => {
          doc.text(`• ${service}`, 30, yPos);
          yPos += 6;
        });
        if (deliverables.sessionType) {
          doc.text(`Session Type: ${deliverables.sessionType} (Informational Only)`, 30, yPos);
          yPos += 6;
        }
        yPos += 3;
      }
    }

    // Digital Deliverables (only show if Yes)
    if (deliverables.digital) {
      const digitalList = [];
      if (deliverables.digital.allImagesJPEG) digitalList.push('All Images in JPEG Format (Pendrive)');
      if (deliverables.digital.traditionalVideoPendrive) digitalList.push('Traditional Video in Pendrive');
      
      if (digitalList.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Digital Deliverables:', 25, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        digitalList.forEach((item) => {
          doc.text(`• ${item}`, 30, yPos);
          yPos += 6;
        });
        yPos += 3;
      }
    }

    // Other Deliverables (only show if Yes)
    if (deliverables.others) {
      const othersList = [];
      if (deliverables.others.cinematicTeaser) othersList.push('Cinematic Teaser');
      if (deliverables.others.cinematicHighlight) othersList.push('Cinematic Highlight');
      if (deliverables.others.aiFaceRecognitionImageDelivery) othersList.push('AI Face Recognition Image Delivery');
      if (deliverables.others.saveTheDateReels) othersList.push('Save the Date Reels');
      if (deliverables.others.premiumAlbumBox) othersList.push('Premium Album Box');
      if (deliverables.others.extraFrame) othersList.push('Extra Frame');
      if (deliverables.others.otherWorks && deliverables.others.otherWorksText) {
        othersList.push(deliverables.others.otherWorksText);
      }
      
      if (othersList.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Other Deliverables:', 25, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        othersList.forEach((item) => {
          // Check if text fits on page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`• ${item}`, 30, yPos);
          yPos += 6;
        });
        yPos += 3;
      }
    }

    // Print & Gifts (only show if quantity > 0)
    if (deliverables.printGifts) {
      const printList = [];
      if (deliverables.printGifts.miniBook > 0) printList.push(`Mini Book: ${deliverables.printGifts.miniBook}`);
      if (deliverables.printGifts.calendar > 0) printList.push(`Calendar: ${deliverables.printGifts.calendar}`);
      if (deliverables.printGifts.portraitFrames > 0) printList.push(`Portrait Frames: ${deliverables.printGifts.portraitFrames}`);
      
      if (printList.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Print & Gifts:', 25, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        printList.forEach((item) => {
          doc.text(`• ${item}`, 30, yPos);
          yPos += 6;
        });
        yPos += 3;
      }
    }
  }

  // (No additional summary of updated deliverable fields - keep PDF concise)

  // Total Amount
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }
  yPos += 10;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 20, yPos);
  doc.text(formatCurrencyForPDF(quotation.manualTotal || quotation.customerTotal), pageWidth - 20, yPos, { align: 'right' });

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for choosing Aura Knot Photography', pageWidth / 2, footerY, { align: 'center' });
  doc.text('This is a computer-generated quotation', pageWidth / 2, footerY + 5, { align: 'center' });

  // Save PDF
  doc.save(`Quotation-${quotation.quotationId}-${Date.now()}.pdf`);
}
