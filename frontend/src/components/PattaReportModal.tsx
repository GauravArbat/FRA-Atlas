import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper
} from '@mui/material';
import { Download, Close, CheckCircle, Warning, Person, Landscape, Analytics, Assignment, Lightbulb, DragIndicator } from '@mui/icons-material';
import { pattaHoldersAPI } from '../services/pattaHoldersAPI';
import jsPDF from 'jspdf';

interface PattaReportModalProps {
  open: boolean;
  onClose: () => void;
  pattaId: string;
  ownerName: string;
}

const PattaReportModal: React.FC<PattaReportModalProps> = ({
  open,
  onClose,
  pattaId,
  ownerName
}) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 500, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open && pattaId) {
      generateReport();
    }
  }, [open, pattaId]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await pattaHoldersAPI.generateReport(pattaId);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Helper functions
    const getEstimatedTime = (stage: string) => {
      const timeMap: { [key: string]: string } = {
        'Initial': '15-30 days',
        'Processing': '30-45 days', 
        'Completed': 'N/A'
      };
      return timeMap[stage] || '30-60 days';
    };
    
    const getRiskLevel = (area: number, compliance: any) => {
      if (area > 10) return 'High - Large area requires verification';
      if (!compliance?.documentationComplete) return 'Medium - Missing documents';
      if (!compliance?.areaWithinLimits) return 'Medium - Area exceeds limits';
      return 'Low - Standard processing';
    };
    
    // Header with Government Logo
    pdf.setFillColor(25, 118, 210);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GOVERNMENT OF INDIA', pageWidth/2, 15, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text('Ministry of Tribal Affairs - Forest Rights Act', pageWidth/2, 25, { align: 'center' });
    
    yPos = 50;
    pdf.setTextColor(0, 0, 0);
    
    // Title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PATTA HOLDER REPORT', pageWidth/2, yPos, { align: 'center' });
    yPos += 20;
    
    // Basic Information Section
    pdf.setFillColor(227, 242, 253);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BASIC INFORMATION', 15, yPos);
    yPos += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const basicInfo = [
      ['Owner Name:', String(report.ownerName || 'N/A')],
      ['Father Name:', String(report.fatherName || 'N/A')],
      ['Village:', String(report.address?.village || 'N/A')],
      ['District:', String(report.address?.district || 'N/A')],
      ['State:', String(report.address?.state || 'N/A')],
      ['PIN Code:', String(report.summary?.pincode || 'N/A')]
    ];
    
    basicInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 100, yPos);
      yPos += 10;
    });
    
    yPos += 10;
    
    // Land Details Section
    pdf.setFillColor(232, 245, 233);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('LAND DETAILS', 15, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    const landInfo = [
      ['Survey Number:', String(report.landDetails?.surveyNo || 'N/A')],
      ['Khasra Number:', String(report.landDetails?.khasra || 'N/A')],
      ['Total Area:', String(report.summary?.totalArea || 'N/A')],
      ['Classification:', String(report.landDetails?.classification || 'N/A')],
      ['FRA Status:', String(report.landDetails?.fraStatus || 'N/A')]
    ];
    
    landInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(value, pageWidth - 110);
      pdf.text(lines, 100, yPos);
      yPos += lines.length * 6 + 4;
    });
    
    yPos += 10;
    
    // Compliance Check Section
    pdf.setFillColor(255, 243, 224);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('COMPLIANCE STATUS', 15, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    const compliance = [
      ['Documentation Complete:', report.compliance?.documentationComplete ? '✓ Yes' : '✗ No'],
      ['Area Within Limits:', report.compliance?.areaWithinLimits ? '✓ Yes' : '✗ No'],
      ['Valid Status:', report.compliance?.statusValid ? '✓ Yes' : '✗ No'],
      ['Address Complete:', report.compliance?.addressComplete ? '✓ Yes' : '✗ No'],
      ['GPS Coordinates:', report.compliance?.coordinatesAvailable ? '✓ Yes' : '✗ No']
    ];
    
    compliance.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(value.includes('✓') ? 0 : 255, value.includes('✓') ? 128 : 0, 0);
      pdf.text(value, 100, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 10;
    });
    
    yPos += 10;
    
    // Analysis Section
    pdf.setFillColor(255, 248, 225);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('ANALYSIS & ASSESSMENT', 15, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    const analysisInfo = [
      ['Area Category:', String(report.analysis?.areaAnalysis?.category || 'N/A')],
      ['Area Description:', String(report.analysis?.areaAnalysis?.description || 'N/A')],
      ['Location Type:', String(report.analysis?.locationAnalysis?.ruralUrban || 'N/A')],
      ['Current Stage:', String(report.analysis?.statusAnalysis?.stage || 'N/A')],
      ['Next Step:', String(report.analysis?.statusAnalysis?.nextStep || 'N/A')],
      ['Priority Level:', String(report.analysis?.statusAnalysis?.priority || 'N/A')],
      ['Record Age:', String(report.analysis?.timeAnalysis?.age || 'N/A')],
      ['Last Activity:', String(report.analysis?.timeAnalysis?.lastActivity || 'N/A')]
    ];
    
    analysisInfo.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(value, pageWidth - 110);
      pdf.text(lines, 100, yPos);
      yPos += lines.length * 6 + 4;
    });
    
    yPos += 10;
    
    // Documents Section
    pdf.setFillColor(240, 248, 255);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('REQUIRED DOCUMENTS', 15, yPos);
    yPos += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    report.documents?.required?.forEach((doc: string, index: number) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(`${index + 1}. ${doc}`, 15, yPos);
      yPos += 8;
    });
    
    yPos += 10;
    
    // Timeline Section
    pdf.setFillColor(248, 255, 248);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('PROCESSING TIMELINE', 15, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    report.timeline?.forEach((item: any, index: number) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${item.event}`, 15, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Status: ${item.status}`, 20, yPos);
      yPos += 6;
      if (item.date) {
        pdf.text(`Date: ${new Date(item.date).toLocaleDateString()}`, 20, yPos);
        yPos += 6;
      }
      pdf.text(`Description: ${item.description}`, 20, yPos);
      yPos += 10;
    });
    
    yPos += 10;
    
    // Geographic Information
    pdf.setFillColor(255, 245, 238);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('GEOGRAPHIC INFORMATION', 15, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    const geoInfo = [
      ['Full Address:', String(report.summary?.fullAddress || 'N/A')],
      ['Administrative Region:', String(report.analysis?.locationAnalysis?.region || 'N/A')],
      ['Accessibility:', String(report.analysis?.locationAnalysis?.accessibility || 'N/A')],
      ['GPS Coordinates Available:', report.compliance?.coordinatesAvailable ? 'Yes' : 'No'],
      ['Area in Square Meters:', String(report.analysis?.areaAnalysis?.areaInSqMeters || 'N/A')],
      ['Area in Acres:', String(report.analysis?.areaAnalysis?.areaInAcres || 'N/A')]
    ];
    
    geoInfo.forEach(([label, value]) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(value, pageWidth - 110);
      pdf.text(lines, 100, yPos);
      yPos += lines.length * 6 + 4;
    });
    
    yPos += 10;
    
    // System Information
    pdf.setFillColor(250, 245, 255);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('SYSTEM INFORMATION', 15, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    const systemInfo = [
      ['Record ID:', String(report.id || 'N/A')],
      ['Created Date:', new Date(report.created).toLocaleDateString()],
      ['Last Modified:', new Date(report.lastModified).toLocaleDateString()],
      ['Created By:', String(report.createdBy || 'System')],
      ['Record Status:', String(report.status || 'Active')]
    ];
    
    systemInfo.forEach(([label, value]) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 100, yPos);
      yPos += 10;
    });
    
    yPos += 10;
    
    // Recommendations Section
    pdf.setFillColor(252, 228, 236);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('RECOMMENDATIONS & ACTION ITEMS', 15, yPos);
    yPos += 15;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    report.recommendations?.forEach((rec: string, index: number) => {
      const lines = pdf.splitTextToSize(`${index + 1}. ${rec}`, pageWidth - 30);
      lines.forEach((line: string) => {
        if (yPos > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, 15, yPos);
        yPos += 8;
      });
      yPos += 4;
    });
    
    // Summary Statistics
    yPos += 10;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(10, yPos-5, pageWidth-20, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('SUMMARY STATISTICS', 15, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    const complianceScore = Object.values(report.compliance || {}).filter(Boolean).length;
    const totalChecks = Object.keys(report.compliance || {}).length;
    const compliancePercentage = totalChecks > 0 ? Math.round((complianceScore / totalChecks) * 100) : 0;
    
    const summaryStats = [
      ['Compliance Score:', `${complianceScore}/${totalChecks} (${compliancePercentage}%)`],
      ['Processing Priority:', String(report.analysis?.statusAnalysis?.priority || 'Medium')],
      ['Estimated Processing Time:', getEstimatedTime(report.analysis?.statusAnalysis?.stage)],
      ['Risk Assessment:', getRiskLevel(report.landDetails?.area?.hectares, report.compliance)]
    ];
    
    summaryStats.forEach(([label, value]) => {
      if (yPos > pdf.internal.pageSize.getHeight() - 50) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 15, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, 100, yPos);
      yPos += 10;
    });
    
    // Footer
    const footerY = pdf.internal.pageSize.getHeight() - 25;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, footerY-5, pageWidth, 20, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, footerY);
    pdf.text('Ministry of Tribal Affairs, Government of India', pageWidth/2, footerY+8, { align: 'center' });
    const reportId = String(report.id).substring(0, 20) + '...';
    pdf.text(`ID: ${reportId}`, pageWidth-15, footerY, { align: 'right' });
    

    
    // Save PDF
    pdf.save(`FRA-Detailed-Report-${report.ownerName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(400, resizeStart.height + (e.clientY - resizeStart.y));
      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      hideBackdrop
      disableEnforceFocus
      style={{ pointerEvents: 'none' }}
      PaperProps={{ 
        ref: dialogRef,
        style: { 
          pointerEvents: 'auto',
          transform: `translate(${position.x}px, ${position.y}px)`,
          width: size.width,
          height: size.height,
          maxWidth: 'none',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #e3f2fd',
          position: 'relative'
        } 
      }}
    >
      <DialogTitle 
        onMouseDown={handleMouseDown}
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          py: 2,
          cursor: 'move',
          userSelect: 'none'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DragIndicator sx={{ fontSize: 20 }} />
              <Assignment sx={{ fontSize: 24 }} /> Patta Report
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>{ownerName}</Typography>
          </Box>
          <Button onClick={onClose} size="small" sx={{ color: 'white' }}>
            <Close />
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, bgcolor: '#f8f9fa', height: 'calc(100% - 120px)', overflow: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : report ? (
          <Box sx={{ height: '100%', overflow: 'auto', position: 'relative' }}>
            {/* Basic Information Card */}
            <Box sx={{ p: 2, bgcolor: 'white', m: 2, borderRadius: 2, boxShadow: 1, border: '1px solid #e3f2fd' }}>
              <Typography variant="subtitle1" sx={{ color: '#1976d2', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 18 }} /> Basic Information
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Owner:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.ownerName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Father:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.fatherName}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Village:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.summary.location}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">PIN:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.summary.pincode}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Land Details Card */}
            <Box sx={{ p: 2, bgcolor: 'white', m: 2, borderRadius: 2, boxShadow: 1, border: '1px solid #e8f5e8' }}>
              <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Landscape sx={{ fontSize: 18 }} /> Land Details
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Survey No:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.landDetails.surveyNo}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Khasra:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.landDetails.khasra}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Area:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.summary.totalArea}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  <Chip 
                    label={report.summary.fraStatus} 
                    color={report.summary.fraStatus.includes('Granted') ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>

            {/* Analysis Card */}
            <Box sx={{ p: 2, bgcolor: 'white', m: 2, borderRadius: 2, boxShadow: 1, border: '1px solid #fff3e0' }}>
              <Typography variant="subtitle1" sx={{ color: '#f57c00', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics sx={{ fontSize: 18 }} /> Analysis
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.8 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Category:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.analysis?.areaAnalysis?.category}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Stage:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.analysis?.statusAnalysis?.stage}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Next Step:</Typography>
                  <Typography variant="body2" fontWeight={500}>{report.analysis?.statusAnalysis?.nextStep}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Compliance Card */}
            <Box sx={{ p: 2, bgcolor: 'white', m: 2, borderRadius: 2, boxShadow: 1, border: '1px solid #e8f5e8' }}>
              <Typography variant="subtitle1" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment sx={{ fontSize: 18 }} /> Compliance
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {[
                  { key: 'documentationComplete', label: 'Documentation' },
                  { key: 'areaWithinLimits', label: 'Area Limits' },
                  { key: 'statusValid', label: 'Valid Status' },
                  { key: 'addressComplete', label: 'Address' },
                  { key: 'coordinatesAvailable', label: 'GPS Data' }
                ].map(({ key, label }) => (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{label}:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {report.compliance[key] ? 
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} /> : 
                        <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                      }
                      <Typography variant="body2" fontWeight={500} color={report.compliance[key] ? 'success.main' : 'warning.main'}>
                        {report.compliance[key] ? 'Complete' : 'Pending'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Recommendations Card */}
            <Box sx={{ p: 2, bgcolor: 'white', m: 2, borderRadius: 2, boxShadow: 1, border: '1px solid #fce4ec' }}>
              <Typography variant="subtitle1" sx={{ color: '#c2185b', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb sx={{ fontSize: 18 }} /> Recommendations
              </Typography>
              <Box sx={{ display: 'grid', gap: 0.8 }}>
                {report.recommendations.map((rec: string, index: number) => (
                  <Typography key={index} variant="body2" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#c2185b', mt: 1, flexShrink: 0 }} />
                    {rec}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Typography>Failed to load report</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#f8f9fa', p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Ministry of Tribal Affairs • Government of India
        </Typography>
        <Button onClick={downloadReport} startIcon={<Download />} disabled={!report} variant="contained" size="small">
          Download
        </Button>
        <Button onClick={onClose} size="small">Close</Button>
      </DialogActions>
      
      {/* Resize Handle */}
      <Box
        onMouseDown={handleResizeMouseDown}
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 20,
          height: 20,
          cursor: 'nw-resize',
          background: 'linear-gradient(-45deg, transparent 0%, transparent 40%, #1976d2 40%, #1976d2 60%, transparent 60%)',
          '&:hover': {
            background: 'linear-gradient(-45deg, transparent 0%, transparent 35%, #1976d2 35%, #1976d2 65%, transparent 65%)'
          }
        }}
      />
    </Dialog>
  );
};

export default PattaReportModal;