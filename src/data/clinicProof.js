export const assetBase = '/assets/dentnow/';

export const clinicGallery = [
  { src: assetBase + 'clinic-exterior.svg', alt: 'Placeholder pentru exteriorul clinicii DentNow din Bucuresti', title: 'Clinica DentNow', caption: 'Inlocuieste cu fotografia reala a intrarii in clinica.' },
  { src: assetBase + 'reception.svg', alt: 'Placeholder pentru receptia DentNow', title: 'Receptie si orientare', caption: 'Primul contact trebuie sa confirme adresa, programul si pasii vizitei.' },
  { src: assetBase + 'treatment-room.svg', alt: 'Placeholder pentru cabinet stomatologic modern', title: 'Cabinet modern', caption: 'Spatiu clinic curat, organizat si pregatit pentru tratamente.' },
  { src: assetBase + 'sterilization.svg', alt: 'Placeholder pentru zona de sterilizare', title: 'Sterilizare', caption: 'Fotografia reala va trebui sa sustina protocolul de siguranta.' },
  { src: assetBase + 'airflow.svg', alt: 'Placeholder pentru echipament EMS Guided Biofilm Therapy', title: 'GBT / EMS Airflow', caption: 'Igienizare blanda si controlata pentru pacienti.' },
  { src: assetBase + 'microscope.svg', alt: 'Placeholder pentru microscop dentar Carl Zeiss', title: 'Microscop dentar', caption: 'Pentru tratamente de canal si lucrari care necesita precizie.' },
];

export const doctors = [
  { name: 'Dr. Daria', role: 'Medicina dentara generala si copii', focus: 'Comunicare calma, preventie si planuri clare pentru familii.', image: assetBase + 'doctor-daria.svg' },
  { name: 'Dr. Diana', role: 'Stomatologie restaurativa', focus: 'Obturații estetice, tratamente conservatoare si explicatii pas cu pas.', image: assetBase + 'doctor-diana.svg' },
  { name: 'Dr. Loredana', role: 'Diagnostic si planuri de tratament', focus: 'Evaluare initiala, deviz transparent si coordonarea tratamentelor complexe.', image: assetBase + 'doctor-loredana.svg' },
];

export const technologies = [
  { title: 'Guided Biofilm Therapy', text: 'Protocol modern de igienizare, orientat spre confort si preventie.', image: assetBase + 'airflow.svg' },
  { title: 'Microscop dentar', text: 'Vizibilitate mai buna pentru tratamente endodontice si detalii fine.', image: assetBase + 'microscope.svg' },
  { title: 'Sterilizare si trasabilitate', text: 'Proces clinic clar, usor de explicat pacientilor inainte de tratament.', image: assetBase + 'sterilization.svg' },
];

export const patientJourney = [
  { step: '01', title: 'Programare', text: 'Alegi telefonic, pe WhatsApp sau prin formular serviciul si intervalul preferat.' },
  { step: '02', title: 'Consult si diagnostic', text: 'Medicul explica problema, optiunile si ce investigatii sunt necesare.' },
  { step: '03', title: 'Deviz transparent', text: 'Primeste un plan de tratament cu pasi, durata estimata si costuri.' },
  { step: '04', title: 'Tratament si aftercare', text: 'Dupa interventie primesti instructiuni clare si recomandari de control.' },
];

export const caseExamples = [
  { treatment: 'Implantologie', title: 'Implant + coroana', beforeImage: assetBase + 'case-implant-before.svg', afterImage: assetBase + 'case-implant-after.svg', desc: 'Placeholder ilustrativ pana la adaugarea fotografiilor reale cu acordul pacientului.' },
  { treatment: 'Estetica', title: 'Albire profesionala', beforeImage: assetBase + 'case-whitening-before.svg', afterImage: assetBase + 'case-whitening-after.svg', desc: 'Exemplu vizual pentru structura cardului, nu rezultat clinic real.' },
  { treatment: 'Ortodontie', title: 'Corectie aliniere', beforeImage: assetBase + 'case-ortho-before.svg', afterImage: assetBase + 'case-ortho-after.svg', desc: 'Inlocuieste cu fotografii reale doar dupa verificarea consimtamantului.' },
];
