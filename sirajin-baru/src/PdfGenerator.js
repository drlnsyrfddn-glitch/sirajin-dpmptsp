/**
 * PdfGenerator.js — generate laporan aktivitas sebagai PDF dari template
 * Google Docs (TEMPLATE_DOC_ID): replaceText placeholder {{...}}, sisip
 * foto, export ke PDF, simpan di folder PDF, buang salinan Docs sementara.
 */

function formatTanggalIndonesia(tanggalIso) {
  var bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  var parts = tanggalIso.split('-'); // format input: YYYY-MM-DD
  var tahun = parts[0], bulan = parseInt(parts[1], 10) - 1, tanggal = parseInt(parts[2], 10);
  return tanggal + ' ' + bulanIndo[bulan] + ' ' + tahun;
}

function insertImageAtPlaceholder(body, placeholder, imageBlob) {
  var found = body.findText(placeholder);
  if (!found) return;
  var paragraph = found.getElement().getParent().asParagraph();
  paragraph.clear();
  if (imageBlob) {
    paragraph.appendInlineImage(imageBlob);
  }
}

function generateLaporanPdf(pegawai, laporan) {
  var props = PropertiesService.getScriptProperties();
  var templateId = props.getProperty('TEMPLATE_DOC_ID');
  var pdfFolderId = props.getProperty('FOLDER_PDF_ID');

  if (!templateId) {
    throw new Error('TEMPLATE_DOC_ID belum diset. Jalankan setTemplateDocId() dulu (lihat Task 3).');
  }

  var nipBersih = String(pegawai.nip).replace(/\s+/g, '');
  var namaFile = nipBersih + '_' + laporan.tanggal + '_' + laporan.jamMulai.replace(':', '') + '.pdf';

  var templateFile = DriveApp.getFileById(templateId);
  var pdfFolder = DriveApp.getFolderById(pdfFolderId);
  var copy = templateFile.makeCopy('TEMP_' + namaFile, pdfFolder);

  var doc = DocumentApp.openById(copy.getId());
  var body = doc.getBody();

  body.replaceText('{{NAMA}}', pegawai.nama);
  body.replaceText('{{NIP}}', pegawai.nip);
  body.replaceText('{{JABATAN}}', pegawai.jabatan);
  body.replaceText('{{UNIT_KERJA}}', pegawai.unitKerja);
  body.replaceText('{{TANGGAL}}', formatTanggalIndonesia(laporan.tanggal));
  body.replaceText('{{JAM_MULAI}}', laporan.jamMulai);
  body.replaceText('{{JAM_SELESAI}}', laporan.jamSelesai);
  body.replaceText('{{DURASI}}', formatDuration(laporan.durasiMenit));
  body.replaceText('{{NAMA_AKTIVITAS}}', laporan.namaAktivitas);
  body.replaceText('{{URAIAN}}', laporan.uraian.join('\n'));

  for (var i = 0; i < 2; i++) {
    var placeholder = '{{FOTO_' + (i + 1) + '}}';
    insertImageAtPlaceholder(body, placeholder, laporan.fotoBlobs[i] || null);
  }

  doc.saveAndClose();

  var pdfBlob = DriveApp.getFileById(copy.getId()).getAs('application/pdf');
  var pdfFile = pdfFolder.createFile(pdfBlob).setName(namaFile);
  DriveApp.getFileById(copy.getId()).setTrashed(true); // buang salinan Docs sementara, sisakan PDF saja

  return pdfFile.getUrl();
}
